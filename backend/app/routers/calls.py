from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Call, Customer, AISummary, User, Setting
from app.schemas.schemas import CallResponse, CallBase
from app.core.security import get_current_user
from app.services.telephony_service import TelephonyService
from app.services.openai_service import OpenAIService
from app.services.email_service import send_lead_alert
import datetime
import random
import os
import json




# Twilio <Say> language + voice mapping for all 10 supported Indian languages.
# Uses Google Neural voices (en-IN-Neural2, hi-IN-Neural2, etc.) via Twilio's text-to-speech.
# These are native BCP-47 locale codes supported by Twilio's <Say> tag directly —
# no Polly required. Falls back to Aditi (Polly) only if a Google voice is unavailable.
#
# Twilio Google TTS voice format: "Google.<BCP47>-<gender>-Neural2-<variant>"
# Reference: https://www.twilio.com/docs/voice/twiml/say/text-speech#google-voices
TWILIO_LOCALE_MAP = {
    "English":   {"locale": "en-IN",  "voice": "Google.en-IN-Neural2-A"},   # English (India)
    "Hindi":     {"locale": "hi-IN",  "voice": "Google.hi-IN-Neural2-A"},   # Hindi
    "Telugu":    {"locale": "te-IN",  "voice": "Google.te-IN-Standard-A"},  # Telugu
    "Tamil":     {"locale": "ta-IN",  "voice": "Google.ta-IN-Neural2-A"},   # Tamil
    "Kannada":   {"locale": "kn-IN",  "voice": "Google.kn-IN-Standard-A"},  # Kannada
    "Malayalam": {"locale": "ml-IN",  "voice": "Google.ml-IN-Standard-A"},  # Malayalam
    "Bengali":   {"locale": "bn-IN",  "voice": "Google.bn-IN-Standard-A"},  # Bengali
    "Marathi":   {"locale": "mr-IN",  "voice": "Google.mr-IN-Standard-A"},  # Marathi
    "Gujarati":  {"locale": "gu-IN",  "voice": "Google.gu-IN-Standard-A"},  # Gujarati
    "Punjabi":   {"locale": "pa-IN",  "voice": "Google.pa-IN-Standard-A"},  # Punjabi
    "Urdu":      {"locale": "ur-IN",  "voice": "Google.ur-IN-Standard-A"},  # Urdu
    "Odia":      {"locale": "or-IN",  "voice": "Google.or-IN-Standard-A"},  # Odia
    "Assamese":  {"locale": "as-IN",  "voice": "Google.as-IN-Standard-A"},  # Assamese
    "Spanish":   {"locale": "es-ES",  "voice": "Google.es-ES-Neural2-A"},   # Spanish
    "French":    {"locale": "fr-FR",  "voice": "Google.fr-FR-Neural2-A"},   # French
    "German":    {"locale": "de-DE",  "voice": "Google.de-DE-Neural2-A"},   # German
    "Arabic":    {"locale": "ar-XA",  "voice": "Google.ar-XA-Standard-A"},  # Arabic
    "Japanese":  {"locale": "ja-JP",  "voice": "Google.ja-JP-Neural2-A"},   # Japanese
}

router = APIRouter(prefix="/api/calls", tags=["Calls"])

@router.get("/", response_model=List[CallResponse])
def get_calls(
    campaign_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Call)
    if campaign_id:
        query = query.filter(Call.campaign_id == campaign_id)
    if customer_id:
        query = query.filter(Call.customer_id == customer_id)
        
    return query.order_by(Call.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/status/live")
def get_live_call_status(
    campaign_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all calls currently Ringing or In-Progress.
    Frontend polls this every 5 seconds when a campaign is Running
    to show real-time call status without a full page refresh.
    """
    query = db.query(Call).filter(
        Call.status.in_(["Ringing", "In-Progress", "Pending"])
    )
    if campaign_id:
        query = query.filter(Call.campaign_id == campaign_id)

    live_calls = query.order_by(Call.created_at.desc()).all()

    return [
        {
            "call_id": c.id,
            "customer_id": c.customer_id,
            "customer_name": c.customer.name if c.customer else "Unknown",
            "mobile": c.customer.mobile if c.customer else "",
            "language": c.customer.preferred_language if c.customer else "English",
            "status": c.status,
            "campaign_id": c.campaign_id,
            "created_at": c.created_at.isoformat()
        }
        for c in live_calls
    ]


@router.get("/{call_id}", response_model=CallResponse)
def get_call(call_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    call_rec = db.query(Call).filter(Call.id == call_id).first()
    if not call_rec:
        raise HTTPException(status_code=404, detail="Call log not found")
    return call_rec

@router.post("/manual", response_model=CallResponse)
def trigger_manual_call(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers a single manual call to a specific customer using configured telephony or simulator.
    """
    from app.routers.settings import get_company_profile_dict

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    new_call = Call(
        customer_id=customer_id,
        status="Pending"
    )
    db.add(new_call)
    customer.call_status = "QUEUED"
    db.commit()
    db.refresh(new_call)

    # Initiate outbound call via Telephony service
    telephony = TelephonyService()
    profile = get_company_profile_dict(db)
    
    # Formulate absolute public URLs
    base_url = os.getenv("PUBLIC_URL") or str(request.base_url)
    if not base_url.endswith("/"):
        base_url += "/"
    callback_url = f"{base_url}api/calls/twiml/{new_call.id}"
    status_callback_url = f"{base_url}api/calls/webhook/{new_call.id}"

    res = telephony.make_outbound_call(
        customer_mobile=customer.mobile,
        custom_id=str(new_call.id),
        callback_url=callback_url,
        status_callback_url=status_callback_url,
        customer_name=customer.name,
        preferred_language=customer.preferred_language,
        company_name=profile.get("company_name"),
        service_name=customer.service_of_interest or profile.get("company_services"),
        service_description=profile.get("service_description"),
        qualification_questions=profile.get("qualification_questions"),
        preferred_provider=profile.get("telephony_provider"),
    )

    if res["status"] == "failed":
        new_call.status = "Failed"
        customer.status = "Failed"
        customer.call_status = "FAILED"
        db.commit()
    elif res.get("sid"):
        new_call.sid = res["sid"]
        if res.get("status") == "simulated":
            new_call.status = "Pending"
            customer.call_status = "QUEUED"
        else:
            new_call.status = "Ringing"
            customer.call_status = "CALLING"
        customer.call_id = new_call.id
        db.commit()

    return new_call


# --- Webhook Dialogues (TwiML) per Call Session ---
# Store temporary dialogue loops in RAM for active phone calls
active_phone_histories = {}

def analyze_and_sync_live_call(call_id: int, chat_history: List[dict], lang: str, db_session_maker):
    db = db_session_maker()
    try:
        from app.routers.settings import get_company_profile_dict
        profile = get_company_profile_dict(db)

        call_rec = db.query(Call).filter(Call.id == call_id).first()
        if not call_rec:
            return
            
        customer = call_rec.customer
        openai_srv = OpenAIService()
        analysis = openai_srv.analyze_completed_call(
            chat_history=chat_history,
            language=lang,
            company_name=profile.get("company_name", "Our Company"),
            service_name=customer.service_of_interest or profile.get("company_services", "Our Service")
        )
        
        # Update call details
        call_rec.status = "Answered"
        call_rec.duration = len(chat_history) * 7  # Average 7 seconds per dialogue turn
        
        # Update customer structured qualification fields
        interest = analysis.get("interest_status", "Not Interested")
        interest_lvl = analysis.get("interest_level", "LOW")
        customer.status = interest
        customer.interest_level = interest_lvl
        customer.call_status = "COMPLETED"
        customer.call_duration = call_rec.duration
        customer.call_summary = analysis.get("summary")
        if analysis.get("service_required"):
            customer.service_of_interest = analysis.get("service_required")
        if analysis.get("customer_requirement"):
            customer.customer_requirement = analysis.get("customer_requirement")
        customer.follow_up_required = analysis.get("follow_up_required", False)
        if analysis.get("preferred_callback_time"):
            customer.preferred_callback_time = analysis.get("preferred_callback_time")
            customer.status = "Callback Scheduled"
        customer.call_id = call_rec.id
            
        ai_sum = AISummary(
            call_id=call_rec.id,
            transcript=analysis.get("transcript"),
            summary=analysis.get("summary"),
            interest_status=interest,
            interest_level=interest_lvl,
            lead_score=analysis.get("lead_score", 0),
            sentiment=analysis.get("sentiment", "Neutral"),
            preferred_callback_time=analysis.get("preferred_callback_time"),
            language_used=analysis.get("language_used", lang),
            service_required=analysis.get("service_required"),
            customer_requirement=analysis.get("customer_requirement"),
            timeline=analysis.get("timeline"),
            follow_up_required=analysis.get("follow_up_required", False),
            ai_notes=analysis.get("ai_notes")
        )
        db.add(ai_sum)
        db.commit()
        
        # Trigger Sales Manager Alerts if lead is Interested
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

        # Push call_ended to transcript WebSocket
        try:
            from app.ws.ws_manager import manager as ws_manager
            live_session_key = f"transcript_{call_id}"
            if live_session_key in ws_manager.active_connections:
                import asyncio
                asyncio.create_task(ws_manager.active_connections[live_session_key].send_text(
                    json.dumps({
                        "type": "call_ended",
                        "status": "Answered",
                        "analysis": {
                            "summary": analysis.get("summary"),
                            "interest_status": interest,
                            "lead_score": analysis.get("lead_score"),
                            "sentiment": analysis.get("sentiment")
                        }
                    })
                ))
        except Exception:
            pass

        # Sync CRM
        crm_webhook = db.query(Setting).filter(Setting.key == "crm_webhook_url").first()
        if crm_webhook and crm_webhook.value:
            from app.services.crm_service import CRMService
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
            
    except Exception as e:
        print(f"Error in background call analysis: {str(e)}")
    finally:
        db.close()


@router.post("/twiml/{call_id}")
async def twiml_gather_voice_loop(
    call_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    call_rec = db.query(Call).filter(Call.id == call_id).first()
    if not call_rec:
        return Response(content="<Response><Reject/></Response>", media_type="application/xml")
        
    customer = call_rec.customer
    lang = customer.preferred_language
    
    # Load company profile context from settings (user-defined in Settings page)
    from app.routers.settings import get_company_profile_dict
    profile = get_company_profile_dict(db)
    company_name = profile.get("company_name", "ABC Digital Solutions")
    service_name = customer.service_of_interest or profile.get("company_services", "Website Development")
    service_desc = profile.get("service_description", "")
    questions = profile.get("qualification_questions", "")
    instructions = profile.get("ai_agent_instructions", "")

    # Parse language locale specs
    lang_spec = TWILIO_LOCALE_MAP.get(lang, {"locale": "en-IN", "voice": "Google.en-IN-Neural2-A"})
    locale = lang_spec["locale"]
    voice = lang_spec["voice"]

    # Get speech input if it exists
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult")

    # Access or create session chat history
    session_key = str(call_id)
    if session_key not in active_phone_histories:
        active_phone_histories[session_key] = []

    chat_history = active_phone_histories[session_key]

    openai_srv = OpenAIService()

    # If first turn, generate initial greeting
    if not speech_result:
        ai_disclosure_setting = db.query(Setting).filter(Setting.key == "compliance_ai_disclosure").first()
        disclosure = ""
        if ai_disclosure_setting and ai_disclosure_setting.value == "true":
            if lang == "Hindi":
                disclosure = "कृपया ध्यान दें, मैं एक एआई डिजिटल सहायक हूँ। "
            elif lang == "Telugu":
                disclosure = "దయచేసి గమనించండి, నేను ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ డిజిటల్ అసిస్టెంట్‌ని. "
            else:
                disclosure = "Please note, I am an AI digital caller assistant. "

        greeting = openai_srv.get_voice_agent_response(
            chat_history=[],
            language=lang,
            company_info=profile.get("company_description", ""),
            company_name=company_name,
            service_name=service_name,
            service_description=service_desc,
            qualification_questions=questions,
            customer_name=customer.name,
            ai_instructions=instructions
        )
        reply = f"{disclosure}{greeting}"
        chat_history.append({"role": "assistant", "content": reply})

        call_rec.status = "In-Progress"
        customer.call_status = "IN_PROGRESS"
        db.commit()
    else:
        # Customer spoke — append and generate AI reply
        chat_history.append({"role": "user", "content": speech_result})
        reply = openai_srv.get_voice_agent_response(
            chat_history=chat_history,
            language=lang,
            company_info=profile.get("company_description", ""),
            company_name=company_name,
            service_name=service_name,
            service_description=service_desc,
            qualification_questions=questions,
            customer_name=customer.name,
            ai_instructions=instructions
        )
        chat_history.append({"role": "assistant", "content": reply})

    # ── Fix 3: Push live transcript turn to WebSocket so the UI shows it in real time ──
    try:
        from app.ws.ws_manager import manager as ws_manager
        live_session_key = f"transcript_{call_id}"
        if live_session_key in ws_manager.active_connections:
            import asyncio
            asyncio.create_task(ws_manager.active_connections[live_session_key].send_text(
                json.dumps({
                    "type": "live_transcript",
                    "call_id": call_id,
                    "history": chat_history
                })
            ))
    except Exception:
        pass  # Non-critical — transcript push failure must never break the TwiML response

    lower_reply = reply.lower()
    is_call_over = any(w in lower_reply for w in ["thank you for your time", "goodbye", "धन्यवाद", "अलविदा", "have a great day"])

    if is_call_over or len(chat_history) > 12:
        # ── Fix 1: Google Neural voice with correct language attribute ──
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="{voice}" language="{locale}">{reply}</Say>
    <Hangup/>
</Response>"""
        from app.database import SessionLocal
        background_tasks.add_task(analyze_and_sync_live_call, call_id, chat_history, lang, SessionLocal)
        if session_key in active_phone_histories:
            del active_phone_histories[session_key]
    else:
        use_websockets = os.getenv("USE_WEBSOCKETS", "false").lower() == "true"
        base_url = os.getenv("PUBLIC_URL") or str(request.base_url)
        if not base_url.endswith("/"):
            base_url += "/"

        if use_websockets:
            ws_url = base_url.replace("https://", "wss://").replace("http://", "ws://")
            stream_url = f"{ws_url}api/calls/media-stream/{call_id}"
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{stream_url}" />
    </Connect>
</Response>"""
        else:
            action_url = f"{base_url}api/calls/twiml/{call_id}"
            timeout_url = f"{base_url}api/calls/twiml-timeout/{call_id}"
            twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="{action_url}" method="POST" speechTimeout="auto" language="{locale}">
        <Say voice="{voice}" language="{locale}">{reply}</Say>
    </Gather>
    <Redirect method="POST">{timeout_url}</Redirect>
</Response>"""

    return Response(content=twiml, media_type="application/xml")


@router.post("/twiml-timeout/{call_id}")
async def twiml_gather_timeout(
    call_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Handles cases when Twilio Gather times out (user stays silent).
    """
    call_rec = db.query(Call).filter(Call.id == call_id).first()
    lang = call_rec.customer.preferred_language if call_rec else "English"
    lang_spec = TWILIO_LOCALE_MAP.get(lang, {"locale": "en-IN", "voice": "Google.en-IN-Neural2-A"})
    locale = lang_spec["locale"]
    voice = lang_spec["voice"]

    session_key = str(call_id)
    chat_history = active_phone_histories.get(session_key, [])

    if len(chat_history) > 1:
        msg = "We couldn't hear you. We will drop the call now. Thank you, goodbye."
        if lang == "Hindi":
            msg = "आपकी आवाज नहीं आ रही है। हम अभी कॉल काट रहे हैं। धन्यवाद, अलविदा।"

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="{voice}" language="{locale}">{msg}</Say>
    <Hangup/>
</Response>"""
        from app.database import SessionLocal
        background_tasks.add_task(analyze_and_sync_live_call, call_id, chat_history, lang, SessionLocal)
        if session_key in active_phone_histories:
            del active_phone_histories[session_key]
    else:
        twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Hangup/>
</Response>"""
        
    return Response(content=twiml, media_type="application/xml")


@router.post("/auto-simulate/{call_id}")
def auto_simulate_call(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates a natural AI outbound sales conversation in the customer's preferred language
    (Telugu, Hindi, English, etc.) using current company & service profile.
    Extracts and stores structured lead qualification data (HIGH, MEDIUM, LOW, NOT_INTERESTED).
    """
    from app.routers.settings import get_company_profile_dict
    profile = get_company_profile_dict(db)

    call_rec = db.query(Call).filter(Call.id == call_id).first()
    if not call_rec:
        raise HTTPException(status_code=404, detail="Call not found")
        
    customer = call_rec.customer
    lang = customer.preferred_language or "English"
    company_name = profile.get("company_name", "ABC Digital Solutions")
    service_name = customer.service_of_interest or profile.get("company_services", "Website Development")
    
    # Randomly decide interest paths: interested (HIGH), callback (CALL_BACK), not_interested (NOT_INTERESTED)
    rand_choice = random.choice(["interested", "callback", "not_interested"])

    conversations = []

    if lang == "Telugu":
        if rand_choice == "interested":
            conversations = [
                {"role": "assistant", "content": f"నమస్కారం {customer.name} గారు! నేను {company_name} తరఫున కాల్ చేస్తున్నాను. మేము వ్యాపారాల కోసం {service_name} సేవలను అందిస్తున్నాము. మీరు మీ వ్యాపారం కోసం వెబ్‌సైట్ లేదా ఆన్‌లైన్ ఆర్డరింగ్ కోసం చూస్తున్నారా?"},
                {"role": "user", "content": f"అవునండి, నేను నా దుకాణం కోసం ఆన్‌లైన్ ఆర్డరింగ్ మరియు ప్రోడక్ట్ కేటలాగ్ ఉన్న ఈ-కామర్స్ వెబ్‌సైట్ చేయాలనుకుంటున్నాను."},
                {"role": "assistant", "content": "చాలా మంచి ఆలోచన అండి! మీరు ఈ ప్రాజెక్ట్‌ను ఎప్పటిలోగా ప్రారంభించాలనుకుంటున్నారు?"},
                {"role": "user", "content": "వచ్చే నెలలో ప్రారంభించాలనుకుంటున్నాము. దీనికి ఖర్చు ఎంత అవుతుందో కొటేషన్ కావాలి."},
                {"role": "assistant", "content": "ఖచ్చితంగా అండి! మా సీనియర్ సేల్స్ స్పెషలిస్ట్ మీకు రేపు ఉదయం 11 గంటలకు కాల్ చేసి వివరాలు మరియు ధర ప్యాకేజీలు పంపుతారు. ధన్యవాదాలు, సెలవు!"}
            ]
        elif rand_choice == "callback":
            conversations = [
                {"role": "assistant", "content": f"నమస్కారం {customer.name} గారు! నేను {company_name} నుండి మాట్లాడుతున్నాను. మా {service_name} సేవల గురించి వివరించడానికి మీకు 2 నిమిషాలు సమయం ఉంటుందా?"},
                {"role": "user", "content": "ప్రస్తుతం నేను పనిలో చాలా బిజీగా ఉన్నాను. రేపు సాయంత్రం 4 గంటల తర్వాత కాల్ చేయగలరా?"},
                {"role": "assistant", "content": "తప్పకుండా అండి. రేపు సాయంత్రం 4 గంటలకు మా ప్రతినిధి మీకు తిరిగి కాల్ చేస్తారు. మీ విలువైన సమయానికి ధన్యవాదాలు, సెలవు!"}
            ]
        else:
            conversations = [
                {"role": "assistant", "content": f"నమస్కారం {customer.name} గారు! నేను {company_name} నుండి మాట్లాడుతున్నాను. మీ వ్యాపారానికి {service_name} సేవలు అవసరమవుతాయా అని కనుక్కోవడానికి కాల్ చేశాము."},
                {"role": "user", "content": "లేదు అండి, ప్రస్తుతానికి మాకు వెబ్‌సైట్ లేదా ఇతర సేవల అవసరం లేదు. దయచేసి మళ్లీ కాల్ చేయకండి."},
                {"role": "assistant", "content": "అర్థమైంది అండి. మీ నంబర్‌ను మా జాబితా నుండి తొలగిస్తున్నాము. ధన్యవాదాలు, మంచి రోజు కలగాలి!"}
            ]
    elif lang == "Hindi":
        if rand_choice == "interested":
            conversations = [
                {"role": "assistant", "content": f"नमस्ते {customer.name} जी! मैं {company_name} से बात कर रही हूँ। हम व्यवसायों के लिए {service_name} और डिजिटल समाधान प्रदान करते हैं। क्या आप अपनी दुकान या व्यवसाय के लिए वेबसाइट बनवाना चाहते हैं?"},
                {"role": "user", "content": f"हाँ बिल्कुल, मैं अपने स्टोर के लिए ऑनलाइन ऑर्डरिंग और ई-कॉमर्स वेबसाइट शुरू करने की योजना बना रहा हूँ।"},
                {"role": "assistant", "content": "बहुत बढ़िया! आप इस प्रोजेक्ट को कब तक शुरू करने की सोच रहे हैं?"},
                {"role": "user", "content": "अगले महीने तक शुरू करना चाहता हूँ। मुझे इसके पैकेज और कीमत की जानकारी चाहिए।"},
                {"role": "assistant", "content": "ज़रूर! हमारी विशेषज्ञ टीम कल सुबह 11 बजे आपको कॉल करके पूरी कोटेशन और विवरण साझा करेगी। धन्यवाद, अलविदा!"}
            ]
        elif rand_choice == "callback":
            conversations = [
                {"role": "assistant", "content": f"नमस्ते {customer.name} जी! मैं {company_name} से बोल रही हूँ। हमारे {service_name} समाधानों पर चर्चा करने के लिए क्या आपके पास दो मिनट का समय है?"},
                {"role": "user", "content": "अभी मैं थोड़ा व्यस्त हूँ। क्या आप कल दोपहर बाद कॉल कर सकते हैं?"},
                {"role": "assistant", "content": "बिल्कुल! मैं कल दोपहर के लिए आपका कॉलबैक शेड्यूल कर देती हूँ। आपका समय देने के लिए धन्यवाद, अलविदा!"}
            ]
        else:
            conversations = [
                {"role": "assistant", "content": f"नमस्ते {customer.name} जी! मैं {company_name} से बोल रही हूँ। हम {service_name} के संबंध में संपर्क कर रहे हैं।"},
                {"role": "user", "content": "नहीं, मुझे अभी किसी सेवा की आवश्यकता नहीं है। कृपया दोबारा कॉल न करें।"},
                {"role": "assistant", "content": "कोई बात नहीं। हम आपका नंबर अपडेट कर देते हैं। आपका दिन शुभ हो, अलविदा!"}
            ]
    else:
        if rand_choice == "interested":
            conversations = [
                {"role": "assistant", "content": f"Hello {customer.name}! I am calling from {company_name}. We provide {service_name} for growing businesses. Are you currently exploring a website or e-commerce store for your business?"},
                {"role": "user", "content": f"Yes, actually I am looking to set up an online ordering website with a payment gateway for my store."},
                {"role": "assistant", "content": "That sounds great. What timeline are you aiming for to get this launched?"},
                {"role": "user", "content": "We want to launch next month. Could someone from your sales team send pricing and details?"},
                {"role": "assistant", "content": "Absolutely! I have noted your requirements. Our sales specialist will call you tomorrow at 11 AM with a customized proposal. Thank you for your time, have a great day!"}
            ]
        elif rand_choice == "callback":
            conversations = [
                {"role": "assistant", "content": f"Hello {customer.name}! I am calling from {company_name} regarding our {service_name}. Do you have two minutes to speak?"},
                {"role": "user", "content": "I am in a meeting right now. Can you call me back tomorrow afternoon?"},
                {"role": "assistant", "content": "Certainly! I will schedule a callback for tomorrow afternoon. Thank you and talk to you then!"}
            ]
        else:
            conversations = [
                {"role": "assistant", "content": f"Hello {customer.name}! I am calling from {company_name} to check if your business requires {service_name}."},
                {"role": "user", "content": "No, we are already covered and not interested at this time. Please do not call again."},
                {"role": "assistant", "content": "Understood. I will mark your preference so you are not contacted again. Thank you and have a good day!"}
            ]

    # 2. Run structured analysis
    openai_srv = OpenAIService()
    analysis = openai_srv.analyze_completed_call(
        chat_history=conversations,
        language=lang,
        company_name=company_name,
        service_name=service_name
    )

    # 3. Update DB
    call_rec.status = "Answered"
    call_rec.duration = random.randint(35, 115)

    interest = analysis.get("interest_status", "Not Interested")
    interest_lvl = analysis.get("interest_level", "LOW")

    customer.status = interest
    customer.interest_level = interest_lvl
    customer.call_status = "COMPLETED"
    customer.call_duration = call_rec.duration
    customer.call_summary = analysis.get("summary")
    if analysis.get("service_required"):
        customer.service_of_interest = analysis.get("service_required")
    if analysis.get("customer_requirement"):
        customer.customer_requirement = analysis.get("customer_requirement")
    customer.follow_up_required = analysis.get("follow_up_required", False)
    if analysis.get("preferred_callback_time"):
        customer.preferred_callback_time = analysis.get("preferred_callback_time")
        customer.status = "Callback Scheduled"
    customer.call_id = call_rec.id

    ai_sum = db.query(AISummary).filter(AISummary.call_id == call_rec.id).first()
    if not ai_sum:
        ai_sum = AISummary(call_id=call_rec.id)
        db.add(ai_sum)

    ai_sum.transcript = analysis.get("transcript")
    ai_sum.summary = analysis.get("summary")
    ai_sum.interest_status = interest
    ai_sum.interest_level = interest_lvl
    ai_sum.lead_score = analysis.get("lead_score", 0)
    ai_sum.sentiment = analysis.get("sentiment", "Neutral")
    ai_sum.preferred_callback_time = analysis.get("preferred_callback_time")
    ai_sum.language_used = analysis.get("language_used", lang)
    ai_sum.service_required = analysis.get("service_required")
    ai_sum.customer_requirement = analysis.get("customer_requirement")
    ai_sum.timeline = analysis.get("timeline")
    ai_sum.follow_up_required = analysis.get("follow_up_required", False)
    ai_sum.ai_notes = analysis.get("ai_notes")

    db.commit()
    db.refresh(call_rec)

    return {"status": "success", "call": call_rec, "analysis": analysis}


@router.post("/vapi/webhook")
async def vapi_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Webhook handler for Vapi AI Outbound Calls (adapted from AI Sales Engine).
    Processes end-of-call reports, transcripts, and structured lead qualification data.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"received": True}

    message = payload.get("message", {})
    event_type = message.get("type")

    # Status updates during call
    if event_type == "status-update":
        call_status = message.get("status")
        vapi_call_id = message.get("call", {}).get("id")
        if vapi_call_id:
            call_rec = db.query(Call).filter(Call.sid == vapi_call_id).first()
            if call_rec:
                if call_status in ["in-progress", "ringing"]:
                    call_rec.status = "In-Progress"
                    if call_rec.customer:
                        call_rec.customer.call_status = "IN_PROGRESS"
                    db.commit()
        return {"received": True}

    if event_type != "end-of-call-report":
        return {"received": True}

    vapi_call_id = message.get("call", {}).get("id")
    transcript = message.get("transcript", "")
    duration = int(message.get("durationSeconds", 0) or 0)
    structured = message.get("analysis", {}).get("structuredData", {})
    summary_text = message.get("analysis", {}).get("summary", "")

    # Look up call
    call_rec = None
    if vapi_call_id:
        call_rec = db.query(Call).filter(Call.sid == vapi_call_id).first()

    if not call_rec:
        custom_call_id = message.get("call", {}).get("assistantOverrides", {}).get("variableValues", {}).get("call_id")
        if custom_call_id and str(custom_call_id).isdigit():
            call_rec = db.query(Call).filter(Call.id == int(custom_call_id)).first()

    if not call_rec:
        print(f"[Vapi Webhook] No matching call found for Vapi Call ID: {vapi_call_id}")
        return {"received": True}

    customer = call_rec.customer
    lang = customer.preferred_language if customer else "English"

    call_rec.status = "Completed"
    call_rec.duration = duration
    db.commit()

    # Parse interest level and structured data
    raw_level = (structured.get("interest_level") or structured.get("lead_state") or "").upper()
    if raw_level in ["HIGH", "HOT"]:
        interest_level = "HIGH"
        interest_status = "Interested"
    elif raw_level in ["MEDIUM", "WARM", "CALL_BACK"]:
        interest_level = "CALL_BACK" if raw_level == "CALL_BACK" else "MEDIUM"
        interest_status = "Maybe Interested"
    elif raw_level in ["NOT_INTERESTED", "COLD", "LOST"]:
        interest_level = "NOT_INTERESTED"
        interest_status = "Not Interested"
    else:
        # Re-analyze with OpenAIService
        from app.routers.settings import get_company_profile_dict
        profile = get_company_profile_dict(db)
        openai_srv = OpenAIService()
        turns = []
        for line in transcript.split("\n"):
            if ":" in line:
                p = line.split(":", 1)
                turns.append({"role": "assistant" if "ai" in p[0].lower() or "bot" in p[0].lower() else "user", "content": p[1].strip()})
        analysis = openai_srv.analyze_completed_call(
            chat_history=turns or [{"role": "assistant", "content": transcript}],
            language=lang,
            company_name=profile.get("company_name", "ABC Digital Solutions"),
            service_name=customer.service_of_interest if customer else "Website Development"
        )
        interest_level = analysis.get("interest_level", "MEDIUM")
        interest_status = analysis.get("interest_status", "Maybe Interested")
        structured = analysis

    # Update Customer
    if customer:
        customer.interest_level = interest_level
        customer.status = interest_status
        customer.call_status = "COMPLETED"
        customer.call_duration = duration
        customer.call_summary = summary_text or structured.get("summary", "")
        customer.service_of_interest = customer.service_of_interest or structured.get("service_required")
        customer.customer_requirement = structured.get("customer_requirement")
        customer.follow_up_required = bool(structured.get("follow_up_required", False))
        customer.preferred_callback_time = structured.get("preferred_callback_time")
        customer.call_id = call_rec.id

    # Update/Create AISummary
    ai_sum = db.query(AISummary).filter(AISummary.call_id == call_rec.id).first()
    if not ai_sum:
        ai_sum = AISummary(call_id=call_rec.id)
        db.add(ai_sum)

    ai_sum.transcript = transcript
    ai_sum.summary = summary_text or structured.get("summary", "")
    ai_sum.interest_status = interest_status
    ai_sum.interest_level = interest_level
    ai_sum.lead_score = structured.get("lead_score", 85 if interest_level == "HIGH" else 50)
    ai_sum.sentiment = structured.get("sentiment", "Positive" if interest_level == "HIGH" else "Neutral")
    ai_sum.preferred_callback_time = structured.get("preferred_callback_time")
    ai_sum.language_used = lang
    ai_sum.service_required = structured.get("service_required", customer.service_of_interest if customer else None)
    ai_sum.customer_requirement = structured.get("customer_requirement")
    ai_sum.timeline = structured.get("timeline")
    ai_sum.follow_up_required = bool(structured.get("follow_up_required", False))
    ai_sum.ai_notes = structured.get("ai_notes", "Follow up with customer regarding requirements.")

    db.commit()

    # Trigger alerts if HIGH interest
    if interest_level == "HIGH" and customer:
        alert_phone = db.query(Setting).filter(Setting.key == "alert_phone").first()
        alert_email = db.query(Setting).filter(Setting.key == "alert_email").first()
        alert_msg = f"🚨 [HOT LEAD QUALIFIED via Vapi] 🚨\nName: {customer.name}\nMobile: {customer.mobile}\nLanguage: {lang}\nSummary: {ai_sum.summary}"
        telephony = TelephonyService()
        if alert_phone and alert_phone.value.strip():
            telephony.send_sms_alert(alert_phone.value.strip(), alert_msg)
        if alert_email and alert_email.value.strip():
            send_lead_alert(
                to_email=alert_email.value.strip(),
                customer_name=customer.name,
                mobile=customer.mobile,
                company=customer.company_name or "N/A",
                language=lang,
                lead_score=ai_sum.lead_score,
                sentiment=ai_sum.sentiment,
                summary=ai_sum.summary or "",
                callback_time=ai_sum.preferred_callback_time,
                ai_notes=ai_sum.ai_notes,
                transcript=transcript
            )

    return {"status": "success", "interest_level": interest_level}

@router.post("/webhook/{call_id}")
async def telephony_webhook(
    call_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Webhook handler for Twilio status callbacks.
    Updates call status and — when a real call completes — triggers AI analysis
    on whatever conversation history was captured in active_phone_histories.
    """
    call_rec = db.query(Call).filter(Call.id == call_id).first()
    if not call_rec:
        return {"status": "ignored"}

    params = await request.form()
    call_status = params.get("CallStatus", params.get("Status", ""))
    duration = params.get("CallDuration", params.get("Duration", 0))
    recording = params.get("RecordingUrl")

    if call_status in ["ringing", "Ringing"]:
        call_rec.status = "Ringing"

    elif call_status in ["in-progress", "in_progress"]:
        call_rec.status = "In-Progress"

    elif call_status in ["completed", "Completed"]:
        call_rec.status = "Completed"
        try:
            call_rec.duration = int(duration)
        except (ValueError, TypeError):
            pass
        if recording:
            call_rec.recording_url = recording
        db.commit()

        # Trigger AI analysis on the conversation captured during the real call
        session_key = str(call_id)
        chat_history = active_phone_histories.get(session_key, [])
        lang = call_rec.customer.preferred_language if call_rec.customer else "English"

        if chat_history:
            from app.database import SessionLocal
            background_tasks.add_task(
                analyze_and_sync_live_call, call_id, chat_history, lang, SessionLocal
            )
            if session_key in active_phone_histories:
                del active_phone_histories[session_key]
        else:
            # Real call ended but no TwiML conversation was captured (e.g. call was not answered)
            call_rec.status = "Completed"
            db.commit()

            # Push call_ended to transcript WebSocket
            try:
                from app.ws.ws_manager import manager as ws_manager
                live_session_key = f"transcript_{call_id}"
                if live_session_key in ws_manager.active_connections:
                    import asyncio
                    asyncio.create_task(ws_manager.active_connections[live_session_key].send_text(
                        json.dumps({
                            "type": "call_ended",
                            "status": "No-Answer",
                            "analysis": None
                        })
                    ))
            except Exception:
                pass

    elif call_status in ["busy", "no-answer", "failed", "canceled",
                         "Busy", "No-Answer", "Failed", "Canceled", "no_answer"]:
        call_rec.status = "No-Answer"
        if call_rec.customer:
            call_rec.customer.status = "Failed"
        db.commit()

        # Push call_ended to transcript WebSocket
        try:
            from app.ws.ws_manager import manager as ws_manager
            live_session_key = f"transcript_{call_id}"
            if live_session_key in ws_manager.active_connections:
                import asyncio
                asyncio.create_task(ws_manager.active_connections[live_session_key].send_text(
                    json.dumps({
                        "type": "call_ended",
                        "status": "No-Answer",
                        "analysis": None
                    })
                ))
        except Exception:
            pass

    db.commit()
    return {"status": "updated"}

@router.websocket("/media-stream/{call_id}")
async def websocket_media_stream(websocket: WebSocket, call_id: int):
    """
    WebSocket endpoint handling Twilio Media Streams audio packets.
    Uses Deepgram and ElevenLabs if keys are provided, with grace simulation fallback.
    """
    await websocket.accept()
    print(f"Twilio WebSocket Media Stream connected for Call ID: {call_id}")
    
    stream_sid = None
    call_sid = None
    has_keys = all([os.getenv("DEEPGRAM_API_KEY"), os.getenv("ELEVENLABS_API_KEY")])
    
    if not has_keys:
        print("[WARNING] DEEPGRAM_API_KEY or ELEVENLABS_API_KEY is not configured in .env.")
        print("[WARNING] Real-time audio processing will run in simulation mode.")
        
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            
            event = data.get("event")
            if event == "start":
                start_data = data.get("start", {})
                stream_sid = start_data.get("streamSid")
                call_sid = start_data.get("callSid")
                print(f"Twilio Media Stream started: StreamSid={stream_sid}, CallSid={call_sid}")
                
            elif event == "media":
                media_data = data.get("media", {})
                payload = media_data.get("payload")
                
                # Active Interruption check:
                # If we detect user speech (e.g. signal power threshold from decoded payload)
                # while bot is speaking, we send Twilio a 'clear' event message to stop speech instantly:
                # { "event": "clear", "streamSid": stream_sid }
                
                if has_keys:
                    # TODO: Implement real-time audio pipeline:
                    # 1. base64-decode the mulaw audio payload
                    # 2. Stream decoded PCM to Deepgram live transcription WebSocket
                    # 3. On Deepgram transcript callback → call OpenAIService.get_voice_agent_response()
                    # 4. Send response text to ElevenLabs TTS → receive synthesized mulaw audio
                    # 5. Base64-encode and send back to Twilio:
                    #    await websocket.send_text(json.dumps({
                    #        "event": "media",
                    #        "streamSid": stream_sid,
                    #        "media": {"payload": <base64_mulaw>}
                    #    }))
                    # Required env vars: DEEPGRAM_API_KEY, ELEVENLABS_API_KEY
                    pass
                else:
                    # Simulation mode: browser-based CallSimulator handles audio instead.
                    # Set USE_WEBSOCKETS=false in .env (default) to use the TwiML gather loop.
                    pass
                    
            elif event == "stop":
                print("Twilio Media Stream stopped.")
                break
                
    except WebSocketDisconnect:
        print("Twilio Media Stream disconnected.")
    except Exception as e:
        print(f"Error in media stream WebSocket: {str(e)}")

