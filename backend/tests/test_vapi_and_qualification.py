import pytest
from app.services.vapi_service import VapiService
from app.services.openai_service import OpenAIService
from app.schemas.schemas import CustomerCreate, StructuredLeadQualification, DashboardMetrics

def test_vapi_service_simulated_mode():
    vapi = VapiService()
    # Without external credentials, place_call should return a simulated status cleanly
    res = vapi.place_call(
        phone_number="9876543210",
        customer_name="Rahul",
        preferred_language="Telugu",
        company_name="ABC Digital Solutions",
        service_name="Website Development",
        service_description="E-commerce store",
        qualification_questions="When do you plan to start?",
        call_id="101"
    )
    assert res["status"] in ["simulated", "success"]
    assert "sid" in res
    assert res["sid"] is not None

def test_structured_lead_qualification_telugu():
    openai_srv = OpenAIService()
    telugu_dialogue = [
        {"role": "assistant", "content": "నమస్కారం Rahul గారు! నేను ABC Digital Solutions నుండి మాట్లాడుతున్నాను. మీరు వెబ్‌సైట్ డెవలప్‌మెంట్ కోసం చూస్తున్నారా?"},
        {"role": "user", "content": "అవును, నేను నా బట్టల దుకాణం కోసం ఆన్‌లైన్ ఆర్డరింగ్ వెబ్‌సైట్ ప్రారంభించాలనుకుంటున్నాను. వచ్చే నెలలో మొదలుపెట్టాలి. ఖర్చు ఎంత అవుతుంది?"},
        {"role": "assistant", "content": "ఖచ్చితంగా అండి! మా సేల్స్ టీమ్ మీకు రేపు ఉదయం కాల్ చేసి పూర్తి వివరాలు ఇస్తారు."}
    ]
    analysis = openai_srv.analyze_completed_call(
        chat_history=telugu_dialogue,
        language="Telugu",
        company_name="ABC Digital Solutions",
        service_name="Website Development"
    )

    assert analysis["interest_level"] in ["HIGH", "MEDIUM", "LOW", "NOT_INTERESTED", "CALL_BACK"]
    assert analysis["interest_status"] in ["Interested", "Maybe Interested", "Not Interested"]
    assert analysis["follow_up_required"] is True
    assert analysis["summary"] != ""
    assert "lead_score" in analysis
    assert analysis["lead_score"] >= 70

def test_structured_lead_qualification_hindi():
    openai_srv = OpenAIService()
    hindi_dialogue = [
        {"role": "assistant", "content": "नमस्ते Priya जी! मैं ABC Digital Solutions से बोल रही हूँ। क्या आप वेबसाइट सेवा में रुचि रखते हैं?"},
        {"role": "user", "content": "नहीं, मुझे अभी कोई सेवा नहीं चाहिए। कृपया दोबारा कॉल न करें।"}
    ]
    analysis = openai_srv.analyze_completed_call(
        chat_history=hindi_dialogue,
        language="Hindi",
        company_name="ABC Digital Solutions",
        service_name="Website Development"
    )

    assert analysis["interest_level"] == "NOT_INTERESTED"
    assert analysis["interest_status"] == "Not Interested"
    assert analysis["follow_up_required"] is False
    assert analysis["lead_score"] < 40

def test_customer_schema_qualification_fields():
    lead = CustomerCreate(
        name="Amit Kumar",
        mobile="+919876543212",
        preferred_language="Hindi",
        service_of_interest="Website Development",
        customer_requirement="E-commerce store with UPI payment",
        interest_level="HIGH",
        call_status="COMPLETED",
        call_duration=85,
        follow_up_required=True,
        preferred_callback_time="Tomorrow 11 AM"
    )
    assert lead.service_of_interest == "Website Development"
    assert lead.interest_level == "HIGH"
    assert lead.follow_up_required is True

def test_dashboard_metrics_schema():
    metrics = DashboardMetrics(
        total_customers=10,
        total_calls=8,
        calls_in_progress=1,
        interested_leads=4,
        follow_up_required=2,
        conversion_rate=50.0,
        calls_queued=2,
        calls_completed=5,
        calls_no_answer=1,
        calls_failed=0,
        high_interest_leads=3,
        medium_interest_leads=1,
        low_interest_leads=1,
        not_interested_leads=2,
        daily_analytics=[],
        weekly_analytics=[],
        campaign_performance=[],
        language_distribution=[]
    )
    assert metrics.high_interest_leads == 3
    assert metrics.calls_queued == 2
