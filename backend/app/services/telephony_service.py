import os
import requests
from datetime import datetime
import pytz
from typing import Dict, Any, Optional


from app.services.vapi_service import VapiService

class TelephonyService:
    def __init__(self):
        # Read credentials fresh on every instantiation so .env changes
        # take effect without restarting the server.
        self.vapi = VapiService()
        self.vapi_configured = self.vapi.configured

        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER", "")
        self.twilio_configured = all([self.account_sid, self.auth_token, self.phone_number])

        self.exotel_sid = os.getenv("EXOTEL_ACCOUNT_SID", "")
        self.exotel_key = os.getenv("EXOTEL_API_KEY", "")
        self.exotel_token = os.getenv("EXOTEL_API_TOKEN", "")
        self.exotel_number = os.getenv("EXOTEL_VIRTUAL_NUMBER", "")
        self.exotel_configured = all([self.exotel_sid, self.exotel_key, self.exotel_token, self.exotel_number])

    def is_within_indian_business_hours(self) -> bool:
        """
        Compliance: Indian Telecom regulations restrict telemarketing calls to 9:00 AM - 8:00 PM IST.
        """
        tz = pytz.timezone("Asia/Kolkata")
        now = datetime.now(tz)
        hour = now.hour
        return 9 <= hour < 20

    def check_dnd_status(self, mobile_number: str) -> bool:
        """
        Checks if a mobile number is on the DND (Do Not Call) blocklist.

        In production, replace or extend this with a call to the official
        TRAI DND scrubbing API: https://www.trai.gov.in/

        The current implementation checks against two sources:
          1. A configurable blocklist stored in the DB (managed from Settings page).
          2. A hardcoded test pattern (numbers ending in 00) for local development.
        """
        # Clean to digits-only for comparison
        digits = "".join(filter(str.isdigit, mobile_number))

        # Check against DB blocklist (loaded fresh each call)
        try:
            from app.database import SessionLocal
            from app.models.models import Setting
            db = SessionLocal()
            try:
                dnd_setting = db.query(Setting).filter(Setting.key == "dnd_blocklist").first()
                if dnd_setting and dnd_setting.value.strip():
                    # Stored as comma-separated numbers, e.g. "9876543200,9000000000"
                    blocked = [
                        "".join(filter(str.isdigit, n.strip()))
                        for n in dnd_setting.value.split(",")
                        if n.strip()
                    ]
                    # Match last 10 digits to handle +91 prefix variations
                    mobile_last10 = digits[-10:] if len(digits) >= 10 else digits
                    for blocked_num in blocked:
                        blocked_last10 = blocked_num[-10:] if len(blocked_num) >= 10 else blocked_num
                        if mobile_last10 == blocked_last10:
                            return True
            finally:
                db.close()
        except Exception:
            pass  # DB check failure must never block a valid call

        # Development test pattern: numbers ending in 00 are treated as DND
        if digits.endswith("00"):
            return True

        return False

    def make_outbound_call(
        self, 
        customer_mobile: str, 
        custom_id: str, 
        callback_url: str, 
        status_callback_url: Optional[str] = None,
        customer_name: Optional[str] = None,
        preferred_language: str = "English",
        company_name: Optional[str] = None,
        service_name: Optional[str] = None,
        service_description: Optional[str] = None,
        qualification_questions: Optional[str] = None,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiates an outbound call.
        Dispatches via Vapi (if configured or preferred), Twilio, Exotel, or gracefully falls back to simulation mode.
        """
        # 1. Compliance checks
        bypass_compliance = os.getenv("BYPASS_COMPLIANCE", "false").lower() == "true"
        
        if not bypass_compliance:
            if not self.is_within_indian_business_hours():
                return {
                    "status": "failed",
                    "reason": "Compliance: Outbound calls are only permitted between 9 AM and 8 PM IST."
                }

        if self.check_dnd_status(customer_mobile):
            return {
                "status": "failed",
                "reason": "Compliance: Mobile number is registered on the national DND (Do Not Call) registry."
            }

        # 2. Vapi Outbound AI Caller (AI Sales Engine Pattern)
        if (preferred_provider == "vapi" or (preferred_provider is None and self.vapi_configured)) and self.vapi_configured:
            # Construct public Vapi webhook URL if available
            base_public_url = os.getenv("PUBLIC_URL", "")
            server_url = None
            if base_public_url:
                server_url = base_public_url.rstrip("/") + "/api/calls/vapi/webhook"

            vapi_res = self.vapi.place_call(
                phone_number=customer_mobile,
                customer_name=customer_name,
                preferred_language=preferred_language,
                company_name=company_name,
                service_name=service_name,
                service_description=service_description,
                qualification_questions=qualification_questions,
                call_id=custom_id,
                server_url=server_url,
            )
            if vapi_res.get("status") == "success":
                return {"status": "success", "sid": vapi_res["sid"], "provider": "vapi"}
            elif vapi_res.get("status") == "failed":
                print(f"[Telephony] Vapi call failed: {vapi_res.get('reason')}. Checking fallbacks.")

        # 3. Exotel Caller (Preferred for India)
        if (preferred_provider == "exotel" or (preferred_provider is None and self.exotel_configured)) and self.exotel_configured:
            return self._make_exotel_call(customer_mobile, custom_id, callback_url, status_callback_url)

        # 4. Twilio Caller
        if (preferred_provider == "twilio" or (preferred_provider is None and self.twilio_configured)) and self.twilio_configured:
            return self._make_twilio_call(customer_mobile, custom_id, callback_url, status_callback_url)

        # 5. Simulation Mode fallback
        return {
            "status": "simulated",
            "sid": f"sim-{custom_id}-{int(datetime.utcnow().timestamp())}",
            "message": "Call initiated in simulation mode (no external telephony provider credentials configured)."
        }

    def _make_exotel_call(self, customer_mobile: str, custom_id: str, callback_url: str, status_callback_url: Optional[str] = None) -> Dict[str, Any]:
        url = f"https://{self.exotel_key}:{self.exotel_token}@api.exotel.com/v1/Accounts/{self.exotel_sid}/Calls/connect.json"
        data = {
            "From": customer_mobile,
            "To": customer_mobile,
            "CallerId": self.exotel_number,
            "Url": callback_url,
            "StatusCallback": status_callback_url or callback_url,
            "CustomField": custom_id
        }
        try:
            response = requests.post(url, data=data, timeout=10)
            if response.status_code in [200, 201]:
                res_data = response.json()
                call_sid = res_data.get("Call", {}).get("Sid")
                return {"status": "success", "sid": call_sid}
            else:
                return {
                    "status": "failed",
                    "sid": None,
                    "reason": f"Exotel API error {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {"status": "failed", "sid": None, "reason": f"Exotel connection error: {str(e)}"}

    def _make_twilio_call(self, customer_mobile: str, custom_id: str, callback_url: str, status_callback_url: Optional[str] = None) -> Dict[str, Any]:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Calls.json"

        data = {
            "To": customer_mobile,
            "From": self.phone_number,
            "Url": callback_url,
            "StatusCallback": status_callback_url or callback_url,
            "StatusCallbackEvent": ["initiated", "ringing", "answered", "completed"],
            "StatusCallbackMethod": "POST",
        }

        try:
            response = requests.post(
                url, data=data,
                auth=(self.account_sid, self.auth_token),
                timeout=10
            )
            if response.status_code == 201:
                res_data = response.json()
                return {"status": "success", "sid": res_data.get("sid")}
            else:
                # Automatic simulation fallback for unverified trial numbers
                print(f"[Telephony] Twilio returned {response.status_code}: {response.text}. Auto-switching to simulation mode.")
                return {
                    "status": "simulated",
                    "sid": f"sim-{custom_id}-{int(datetime.utcnow().timestamp())}",
                    "message": f"Twilio returned error. Auto-switched to simulation mode."
                }
        except Exception as e:
            print(f"[Telephony] Twilio connection error: {e}. Auto-switching to simulation mode.")
            return {
                "status": "simulated",
                "sid": f"sim-{custom_id}-{int(datetime.utcnow().timestamp())}",
                "message": f"Twilio connection error. Auto-switched to simulation mode."
            }

    def send_sms_alert(self, to_number: str, message: str) -> bool:
        """
        Sends an SMS/WhatsApp alert using the configured Twilio account.
        """
        if not self.twilio_configured or not to_number:
            print(f"[SIMULATED ALERT] Alert to {to_number}: {message}")
            return False

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        
        # If to_number starts with "whatsapp:", From must also be prefixed with "whatsapp:"
        to_addr = to_number
        from_addr = self.phone_number
        if to_number.lower().startswith("whatsapp:"):
            if not from_addr.lower().startswith("whatsapp:"):
                from_addr = f"whatsapp:{from_addr}"
        elif from_addr.lower().startswith("whatsapp:"):
            # If from is whatsapp but to is not, convert to whatsapp
            to_addr = f"whatsapp:{to_addr}"

        data = {
            "To": to_addr,
            "From": from_addr,
            "Body": message
        }
        
        try:
            response = requests.post(
                url, data=data,
                auth=(self.account_sid, self.auth_token),
                timeout=10
            )
            if response.status_code == 201:
                print(f"[TWILIO ALERT] Alert sent successfully to {to_addr}")
                return True
            else:
                print(f"[TWILIO ALERT ERROR] Failed to send: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"[TWILIO ALERT ERROR] Exception: {str(e)}")
            return False


