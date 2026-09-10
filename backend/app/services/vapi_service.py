import os
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class VapiService:
    BASE_URL = "https://api.vapi.ai"

    def __init__(self):
        self.api_key = os.getenv("VAPI_API_KEY", "").strip()
        self.phone_number_id = os.getenv("VAPI_PHONE_NUMBER_ID", "").strip()
        self.assistant_id = os.getenv("VAPI_ASSISTANT_ID", "").strip()
        self.configured = bool(self.api_key and self.phone_number_id and self.assistant_id)

    @property
    def headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def place_call(
        self,
        phone_number: str,
        customer_name: Optional[str] = None,
        preferred_language: str = "English",
        company_name: Optional[str] = None,
        service_name: Optional[str] = None,
        service_description: Optional[str] = None,
        qualification_questions: Optional[str] = None,
        call_id: Optional[str] = None,
        server_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiates an outbound AI call via Vapi API with dynamic assistant context.
        """
        if not self.configured:
            return {
                "status": "simulated",
                "sid": f"vapi-sim-{call_id or phone_number}",
                "message": "Vapi credentials not fully configured. Running in simulated mode."
            }

        # Format number with international prefix if needed
        clean_number = phone_number.strip()
        if not clean_number.startswith("+"):
            digits = "".join(filter(str.isdigit, clean_number))
            clean_number = f"+91{digits}" if len(digits) == 10 else f"+{digits}"

        variable_values = {
            "customer_name": customer_name or "Customer",
            "preferred_language": preferred_language,
            "company_name": company_name or "Our Company",
            "service_name": service_name or "Our Services",
            "service_description": service_description or "",
            "qualification_questions": qualification_questions or "",
            "call_id": str(call_id or ""),
        }

        payload: Dict[str, Any] = {
            "assistantId": self.assistant_id,
            "phoneNumberId": self.phone_number_id,
            "customer": {
                "number": clean_number,
                "name": customer_name or "Customer"
            },
            "assistantOverrides": {
                "variableValues": variable_values
            }
        }

        if server_url:
            payload["serverUrl"] = server_url

        try:
            response = requests.post(
                f"{self.BASE_URL}/call/phone",
                json=payload,
                headers=self.headers,
                timeout=15
            )
            if response.status_code in [200, 201]:
                data = response.json()
                vapi_call_id = data.get("id")
                logger.info(f"Vapi outbound call placed successfully: {vapi_call_id}")
                return {
                    "status": "success",
                    "sid": vapi_call_id,
                    "data": data
                }
            else:
                logger.error(f"Vapi API returned {response.status_code}: {response.text}")
                return {
                    "status": "failed",
                    "sid": None,
                    "reason": f"Vapi API Error ({response.status_code}): {response.text[:200]}"
                }
        except Exception as e:
            logger.error(f"Failed to connect to Vapi API: {e}")
            return {
                "status": "failed",
                "sid": None,
                "reason": f"Vapi network error: {str(e)}"
            }

    def get_call(self, call_id: str) -> Dict[str, Any]:
        """
        Retrieves details and status of an active or completed Vapi call.
        """
        if not self.configured:
            return {"status": "simulated", "id": call_id}

        try:
            response = requests.get(
                f"{self.BASE_URL}/call/{call_id}",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Vapi call {call_id}: {e}")
            return {"error": str(e)}
