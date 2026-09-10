from fastapi import WebSocket
from typing import Dict, List, Any
import json
from app.services.openai_service import OpenAIService
from app.models.models import Call, Customer, AISummary, Setting
from app.services.crm_service import CRMService
from app.services.email_service import send_lead_alert
from sqlalchemy.orm import Session
import datetime

class ConnectionManager:
    def __init__(self):
        # Maps active call_id or session to WebSocket connections
        self.active_connections: Dict[str, WebSocket] = {}
        # Stores conversation history per call session
        self.chat_histories: Dict[str, List[Dict[str, str]]] = {}
        self.openai = OpenAIService()

    async def connect(self, websocket: WebSocket, call_id: str):
        await websocket.accept()
        self.active_connections[call_id] = websocket
        self.chat_histories[call_id] = []

    def disconnect(self, call_id: str):
        if call_id in self.active_connections:
            del self.active_connections[call_id]
        if call_id in self.chat_histories:
            del self.chat_histories[call_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def handle_call_simulation(self, websocket: WebSocket, call_id: str, db: Session):
        """
        Coordinates a single simulated call dialog.
        """
        # Load the Call and Customer from DB
        call_rec = db.query(Call).filter(Call.id == int(call_id)).first()
        if not call_rec:
            await self.send_personal_message({"type": "error", "message": "Call not found"}, websocket)
            return

        customer = db.query(Customer).filter(Customer.id == call_rec.customer_id).first()
        lang = customer.preferred_language if customer else "English"
        
        # Load company context from settings
        company_info = (company_setting.value.strip() if company_setting and company_setting.value.strip()
                        else "Amazon Business & Seller Services. We are reaching out to prospective clients and sellers who recently visited, registered, or logged into our Amazon website to explore our services. We help businesses launch, scale, and deliver their products to millions of active customers. We are calling to check if you are interested in getting started with Amazon, answer any questions, and connect you with an Amazon Onboarding Specialist.")

        # 1. Trigger Initial Greeting
        greeting = self.openai.get_voice_agent_response([], lang, company_info)
        self.chat_histories[call_id].append({"role": "assistant", "content": greeting})
        
        # Update call record status to In-Progress
        call_rec.status = "In-Progress"
        db.commit()

        # Send initial message to client
        await self.send_personal_message({
            "type": "agent_speech",
            "text": greeting,
            "sentiment": "Neutral",
            "score_estimate": 10
        }, websocket)

        try:
            # 2. Main loop: Receive messages from client
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                if message_data.get("type") == "customer_speech":
                    customer_text = message_data.get("text", "")
                    
                    # Log message
                    self.chat_histories[call_id].append({"role": "user", "content": customer_text})
                    
                    # Generate agent reply
                    reply = self.openai.get_voice_agent_response(
                        self.chat_histories[call_id],
                        lang,
                        company_info
                    )
                    self.chat_histories[call_id].append({"role": "assistant", "content": reply})

                    # Sentiment estimation from customer text
                    estimated_sentiment = "Neutral"
                    pos_words = ["yes", "yeah", "interested", "sure", "great", "ok", "want", "हाँ", "అవును", "சரி", "ಹೌದು"]
                    neg_words = ["no", "not", "stop", "busy", "later", "don't", "नहीं", "నో", "வேண்டாம்", "ಬೇಡ"]
                    if any(w in customer_text.lower() for w in pos_words):
                        estimated_sentiment = "Positive"
                    elif any(w in customer_text.lower() for w in neg_words):
                        estimated_sentiment = "Negative"

                    await self.send_personal_message({
                        "type": "agent_speech",
                        "text": reply,
                        "sentiment": estimated_sentiment,
                        "score_estimate": 50 if estimated_sentiment == "Neutral" else (82 if estimated_sentiment == "Positive" else 18)
                    }, websocket)

                    # End call only if AI said a clear closing phrase
                    # AND we have had at least 2 user turns (prevents premature end)
                    user_turn_count = sum(1 for m in self.chat_histories[call_id] if m["role"] == "user")
                    closing_phrases = [
                        "goodbye", "have a great day", "have a nice day",
                        "thank you for your time",
                        "धन्यवाद, अलविदा", "अलविदा",
                        "ధన్యవాదాలు, సెలవు", "సెలవు",
                        "நன்றி, வணக்கம்", "வணக்கம்",
                        "ಧನ್ಯವಾದಗಳು, ಹೋಗಿ ಬನ್ನಿ",
                    ]
                    reply_lower = reply.lower()
                    call_should_end = (
                        user_turn_count >= 2 and
                        any(phrase in reply_lower for phrase in closing_phrases)
                    )
                    if call_should_end:
                        break
                    
                elif message_data.get("type") == "hang_up":
                    break
                    
        except Exception as e:
            print(f"Error in handle_call_simulation: {e}")
        finally:
            # 3. Call Completed: Run AI analysis
            chat_history = self.chat_histories.get(call_id, [])
            
            # If call was answered, analyze. Otherwise set status to No-Answer
            if len(chat_history) > 1:
                analysis = self.openai.analyze_completed_call(chat_history, lang)
                
                # Update call details
                call_rec.status = "Answered"
                call_rec.duration = len(chat_history) * 6  # Estimating 6 seconds per conversation turn
                
                # Update customer status based on interest
                interest = analysis.get("interest_status", "Not Interested")
                
                # Fail-safe override: If user spoke any positive keywords, force status to Interested
                user_replies = [m["content"].lower() for m in chat_history if m["role"] == "user"]
                positive_keywords = [
                    "yes", "yeah", "interested", "ok", "sure", "fine", "yep", "good", "great", "want",
                    "అవును", "ఆసక్తి", "సరే", "ఓకే", "కావాలి", "ఇంట్రెస్ట్",
                    "हाँ", "हा", "रुचि", "ठीक है", "ओके", "चाहिए"
                ]
                if any(any(word in reply for word in positive_keywords) for reply in user_replies):
                    interest = "Interested"
                    analysis["interest_status"] = "Interested"
                    analysis["lead_score"] = 95
                    analysis["sentiment"] = "Positive"

                call_rec.customer.status = interest
                if analysis.get("preferred_callback_time"):
                    call_rec.customer.status = "Callback Scheduled"
                
                # Create AISummary row
                ai_sum = AISummary(
                    call_id=call_rec.id,
                    transcript=analysis.get("transcript"),
                    summary=analysis.get("summary"),
                    interest_status=interest,
                    lead_score=analysis.get("lead_score", 0),
                    sentiment=analysis.get("sentiment", "Neutral"),
                    preferred_callback_time=analysis.get("preferred_callback_time"),
                    language_used=analysis.get("language_used", lang),
                    ai_notes=analysis.get("ai_notes")
                )
                db.add(ai_sum)
                db.commit()

                # Trigger Sales Manager Alerts if lead is Interested (Simulation Mode)
                if interest == "Interested":
                    alert_phone = db.query(Setting).filter(Setting.key == "alert_phone").first()
                    alert_email = db.query(Setting).filter(Setting.key == "alert_email").first()
                    
                    alert_msg = (
                        f"🚨 [HOT LEAD QUALIFIED] 🚨\n"
                        f"Name: {customer.name}\n"
                        f"Mobile: {customer.mobile}\n"
                        f"Company: {customer.company_name or 'N/A'}\n"
                        f"Language: {customer.preferred_language}\n"
                        f"Lead Score: {analysis.get('lead_score', 0)}/100\n"
                        f"Summary: {analysis.get('summary', '')}"
                    )
                    
                    from app.services.telephony_service import TelephonyService
                    telephony = TelephonyService()
                    if alert_phone and alert_phone.value.strip():
                        telephony.send_sms_alert(alert_phone.value.strip(), alert_msg)
                    else:
                        print(f"[SIMULATED SMS ALERT] to configured manager:\n{alert_msg}")

                    # Send real HTML email alert to the Sales Manager
                    if alert_email and alert_email.value.strip():
                        send_lead_alert(
                            to_email=alert_email.value.strip(),
                            customer_name=customer.name,
                            mobile=customer.mobile,
                            company=customer.company_name or "N/A",
                            language=customer.preferred_language,
                            lead_score=analysis.get("lead_score", 0),
                            sentiment=analysis.get("sentiment", "Neutral"),
                            summary=analysis.get("summary", ""),
                            callback_time=analysis.get("preferred_callback_time"),
                            ai_notes=analysis.get("ai_notes"),
                            transcript=analysis.get("transcript"),
                        )

                # Sync to external CRM if webhook is set
                crm_webhook = db.query(Setting).filter(Setting.key == "crm_webhook_url").first()
                if crm_webhook and crm_webhook.value:
                    lead_payload = {
                        "name": customer.name,
                        "mobile": customer.mobile,
                        "company_name": customer.company_name,
                        "preferred_language": customer.preferred_language,
                        "timestamp": datetime.datetime.utcnow().isoformat(),
                        "transcript": analysis.get("transcript"),
                        "summary": analysis.get("summary"),
                        "lead_score": analysis.get("lead_score"),
                        "sentiment": analysis.get("sentiment"),
                        "preferred_callback_time": analysis.get("preferred_callback_time"),
                        "ai_notes": analysis.get("ai_notes")
                    }
                    CRMService.sync_qualified_lead(lead_payload, crm_webhook.value)
                
                await self.send_personal_message({
                    "type": "call_ended",
                    "status": "Answered",
                    "analysis": {
                        "summary": analysis.get("summary"),
                        "interest_status": interest,
                        "lead_score": analysis.get("lead_score"),
                        "sentiment": analysis.get("sentiment")
                    }
                }, websocket)
            else:
                call_rec.status = "No-Answer"
                db.commit()
                await self.send_personal_message({
                    "type": "call_ended",
                    "status": "No-Answer",
                    "analysis": None
                }, websocket)
            
            self.disconnect(call_id)

manager = ConnectionManager()
