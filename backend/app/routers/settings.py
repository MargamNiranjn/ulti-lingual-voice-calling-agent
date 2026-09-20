from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Setting, ActivityLog, User
from app.schemas.schemas import SettingResponse, SettingUpdate, ActivityLogResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

DEFAULT_SETTINGS = [
    {
        "key": "company_name",
        "value": "ABC Digital Solutions",
        "description": "Your company or brand name. Used by the AI caller when introducing itself to prospects."
    },
    {
        "key": "company_description",
        "value": "We provide website and e-commerce development services for small and medium businesses to grow their online sales.",
        "description": "Full company pitch read by the AI caller. Describe your services, key benefits, and what makes you different."
    },
    {
        "key": "company_services",
        "value": "Website Development, E-commerce Stores, Custom Web Apps",
        "description": "Comma-separated list of services or packages offered by your business."
    },
    {
        "key": "service_description",
        "value": "We design fast, mobile-friendly websites and online ordering e-commerce stores with payment gateway integration for retail shops and businesses.",
        "description": "Detailed explanation of the primary service to pitch to prospective customers."
    },
    {
        "key": "target_customer",
        "value": "Retail shop owners, small business founders, and local service providers looking to build an online presence.",
        "description": "Profile of your ideal customer to guide the AI caller's conversational framing."
    },
    {
        "key": "supported_languages",
        "value": "English, Hindi, Telugu",
        "description": "Primary languages supported for automated AI phone conversations."
    },
    {
        "key": "qualification_questions",
        "value": "1. Are you currently looking for website or e-commerce development for your business?\n2. What specific features or services do you need?\n3. When are you planning to start your project?\n4. Would you like our sales specialist to contact you with a customized pricing proposal?",
        "description": "Key qualification questions that the AI caller should naturally explore during conversation."
    },
    {
        "key": "ai_agent_instructions",
        "value": "Introduce yourself warmly from the company. Explain our services concisely. Converse naturally in the customer's preferred language. Ask relevant qualification questions one by one. Determine customer interest, collect requirements, and offer a consultation callback if interested.",
        "description": "Behavioral guidance for the AI voice agent."
    },
    # ── Telephony Provider Configuration ─────────────────────────────────────
    {
        "key": "telephony_provider",
        "value": "simulator",
        "description": "Active outbound dialer engine: 'bolna', 'twilio', 'vapi', 'exotel', or 'simulator'."
    },
    {
        "key": "vapi_api_key",
        "value": "",
        "description": "Vapi Private API Key (used for outbound calling)."
    },
    {
        "key": "vapi_phone_number_id",
        "value": "",
        "description": "Vapi registered Phone Number ID."
    },
    {
        "key": "vapi_assistant_id",
        "value": "",
        "description": "Vapi Assistant ID for outbound sales qualification."
    },
    {
        "key": "bolna_api_key",
        "value": "",
        "description": "Bolna API Key (bolna-ai/bolna)."
    },
    {
        "key": "bolna_agent_id",
        "value": "",
        "description": "Bolna Voice Agent ID for outbound calling."
    },
    {
        "key": "bolna_server_url",
        "value": "https://api.bolna.dev",
        "description": "Bolna Engine API Server URL (default: https://api.bolna.dev or local: http://localhost:5001)."
    },
    {
        "key": "crm_webhook_url",
        "value": "",
        "description": "Target endpoint to sync qualified client profiles (e.g. Zoho, Salesforce webhook trigger)."
    },
    {
        "key": "compliance_ai_disclosure",
        "value": "true",
        "description": "Enforce compliance by stating at the beginning of the call that the agent is an AI."
    },
    {
        "key": "compliance_max_dial_hour",
        "value": "20",
        "description": "Telecom policy: Latest time (in hours, e.g. 20 = 8 PM IST) that outbound dialing is allowed."
    },
    {
        "key": "dnd_blocklist",
        "value": "",
        "description": "Comma-separated list of mobile numbers that must never be called (DND / opt-out list). E.g. 9876543210,9000112233"
    },
    {
        "key": "alert_phone",
        "value": "",
        "description": "Mobile number of the Sales Manager to receive SMS/WhatsApp alerts for interested hot leads."
    },
    {
        "key": "alert_email",
        "value": "",
        "description": "Email address of the Sales Manager to receive email updates for interested hot leads."
    },
    # ── SMTP outgoing mail configuration ──────────────────────────────────────
    {
        "key": "smtp_host",
        "value": "",
        "description": "SMTP server hostname. Gmail: smtp.gmail.com | Outlook: smtp.office365.com"
    },
    {
        "key": "smtp_port",
        "value": "587",
        "description": "SMTP port. 587 (STARTTLS, recommended) or 465 (SSL)."
    },
    {
        "key": "smtp_user",
        "value": "",
        "description": "SMTP login username — usually the sender email address."
    },
    {
        "key": "smtp_password",
        "value": "",
        "description": "SMTP password. For Gmail use an App Password, NOT your account password."
    },
    {
        "key": "smtp_from",
        "value": "",
        "description": "From address shown in the recipient's inbox. Leave blank to use smtp_user."
    },
]

def seed_default_settings(db: Session):
    for ds in DEFAULT_SETTINGS:
        existing = db.query(Setting).filter(Setting.key == ds["key"]).first()
        if not existing:
            setting = Setting(**ds)
            db.add(setting)
    db.commit()

def get_company_profile_dict(db: Session) -> dict:
    seed_default_settings(db)
    all_settings = db.query(Setting).all()
    s_map = {s.key: s.value for s in all_settings}
    return {
        "company_name": s_map.get("company_name", "ABC Digital Solutions"),
        "company_description": s_map.get("company_description", ""),
        "company_services": s_map.get("company_services", "Website Development"),
        "service_description": s_map.get("service_description", ""),
        "target_customer": s_map.get("target_customer", ""),
        "supported_languages": s_map.get("supported_languages", "English, Hindi, Telugu"),
        "qualification_questions": s_map.get("qualification_questions", ""),
        "ai_agent_instructions": s_map.get("ai_agent_instructions", ""),
        "telephony_provider": s_map.get("telephony_provider", "simulator"),
    }

@router.get("/company-profile")
def get_company_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns unified company and AI agent configuration."""
    return get_company_profile_dict(db)

@router.get("/", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Make sure default settings exist
    seed_default_settings(db)
    return db.query(Setting).all()

@router.get("/logs", response_model=List[ActivityLogResponse])
def get_activity_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the most recent system activity logs for the audit trail panel.
    """
    logs = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    # Attach username from the related User relationship
    result = []
    for log in logs:
        entry = ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            details=log.details,
            created_at=log.created_at,
            username=log.user.username if log.user else None
        )
        result.append(entry)
    return result


@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    key: str,
    setting_in: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting key not found")
        
    setting.value = setting_in.value
    db.commit()
    db.refresh(setting)
    return setting


class TestEmailRequest(BaseModel):
    to_email: str


@router.post("/test-email")
def send_test_email(
    body: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends a test email to verify SMTP configuration is working.
    Called from the Settings page 'Send Test Email' button.
    """
    from app.services.email_service import send_lead_alert

    success = send_lead_alert(
        to_email=body.to_email,
        customer_name="Test Lead",
        mobile="+910000000000",
        company="Test Company",
        language="English",
        lead_score=92,
        sentiment="Positive",
        summary="This is a test alert from the AI Lead Qualifier platform. If you received this, your SMTP configuration is working correctly.",
        callback_time="Tomorrow at 10:00 AM",
        ai_notes="This is a test. No action required.",
        transcript="ASSISTANT: Hello, this is a test call.\nUSER: Yes, I am interested.\nASSISTANT: Great! Thank you for your time.",
    )

    if success:
        return {"success": True, "message": f"Test email delivered to {body.to_email}"}
    else:
        return {
            "success": False,
            "error": (
                "Email could not be sent. Check that SMTP_HOST, SMTP_PORT, SMTP_USER, "
                "and SMTP_PASSWORD are set correctly — either in .env or on this Settings page. "
                "For Gmail, use an App Password (not your real password)."
            )
        }
