from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import pandas as pd
import io
import datetime
from app.database import get_db
from app.models.models import Call, Customer, Campaign, AISummary, User, campaign_customers
from app.schemas.schemas import DashboardMetrics
from app.core.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Base counts
    total_customers = db.query(Customer).count()
    total_calls = db.query(Call).count()
    calls_in_progress = db.query(Call).filter(Call.status == "In-Progress").count()
    
    interested_leads = db.query(Customer).filter(Customer.status == "Interested").count()
    follow_up_required = db.query(Customer).filter(Customer.status.in_(["Maybe Interested", "Callback Scheduled"])).count()
    
    # 2. Conversion rate (percentage of called customers who ended up Interested)
    called_customers_count = db.query(func.count(func.distinct(Call.customer_id))).scalar() or 0
    conversion_rate = (interested_leads / called_customers_count * 100.0) if called_customers_count > 0 else 0.0

    # 3. Daily trends (Last 7 days)
    daily_analytics = []
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)
        
        call_count = db.query(Call).filter(Call.created_at.between(day_start, day_end)).count()
        interested_count = db.query(AISummary).filter(
            AISummary.created_at.between(day_start, day_end),
            AISummary.interest_status == "Interested"
        ).count()
        
        daily_analytics.append({
            "date": day.strftime("%b %d"),
            "Calls": call_count,
            "Leads": interested_count
        })

    # 4. Weekly trends (Last 4 weeks)
    weekly_analytics = []
    for w in range(3, -1, -1):
        start_date = today - datetime.timedelta(weeks=w+1)
        end_date = today - datetime.timedelta(weeks=w)
        start_dt = datetime.datetime.combine(start_date, datetime.time.min)
        end_dt = datetime.datetime.combine(end_date, datetime.time.max)
        
        call_count = db.query(Call).filter(Call.created_at.between(start_dt, end_dt)).count()
        weekly_analytics.append({
            "week": f"Wk {4-w}",
            "Calls": call_count
        })

    # 5. Campaign performance
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).limit(5).all()
    campaign_performance = []
    for camp in campaigns:
        total_camp_customers = db.query(campaign_customers).filter(campaign_customers.c.campaign_id == camp.id).count()
        if total_camp_customers > 0:
            # Qualified in this campaign
            camp_cust_ids = db.query(campaign_customers.c.customer_id).filter(campaign_customers.c.campaign_id == camp.id).all()
            ids = [i[0] for i in camp_cust_ids]
            qualified_camp = db.query(Customer).filter(Customer.id.in_(ids), Customer.status == "Interested").count()
            rate = (qualified_camp / total_camp_customers) * 100.0
        else:
            rate = 0.0
            
        campaign_performance.append({
            "name": camp.name,
            "rate": round(rate, 2)
        })

    # 6. Languages distribution
    langs = db.query(Customer.preferred_language, func.count(Customer.id))\
              .group_by(Customer.preferred_language).all()
    language_distribution = [{"name": lang, "value": count} for lang, count in langs]

    # AI Campaign & Lead Qualification metrics
    calls_queued = db.query(Customer).filter(Customer.call_status == "QUEUED").count()
    calls_completed = db.query(Call).filter(Call.status.in_(["Answered", "Completed"])).count()
    calls_no_answer = db.query(Call).filter(Call.status.in_(["No-Answer", "Busy"])).count()
    calls_failed = db.query(Call).filter(Call.status == "Failed").count()

    high_interest_leads = db.query(Customer).filter(Customer.interest_level == "HIGH").count()
    medium_interest_leads = db.query(Customer).filter(Customer.interest_level == "MEDIUM").count()
    low_interest_leads = db.query(Customer).filter(Customer.interest_level == "LOW").count()
    not_interested_leads = db.query(Customer).filter(Customer.interest_level == "NOT_INTERESTED").count()

    return {
        "total_customers": total_customers,
        "total_calls": total_calls,
        "calls_in_progress": calls_in_progress,
        "interested_leads": interested_leads,
        "follow_up_required": follow_up_required,
        "conversion_rate": round(conversion_rate, 2),
        "calls_queued": calls_queued,
        "calls_completed": calls_completed,
        "calls_no_answer": calls_no_answer,
        "calls_failed": calls_failed,
        "high_interest_leads": high_interest_leads,
        "medium_interest_leads": medium_interest_leads,
        "low_interest_leads": low_interest_leads,
        "not_interested_leads": not_interested_leads,
        "daily_analytics": daily_analytics,
        "weekly_analytics": weekly_analytics,
        "campaign_performance": campaign_performance,
        "language_distribution": language_distribution
    }

@router.get("/export/csv")
def export_leads_csv(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Exports qualified leads to a CSV streaming response including structured requirements.
    """
    customers = db.query(Customer).filter(
        (Customer.status.in_(["Interested", "Maybe Interested"])) |
        (Customer.interest_level.in_(["HIGH", "MEDIUM", "CALL_BACK"])) |
        (Customer.follow_up_required == True)
    ).all()
    
    data = []
    for c in customers:
        # Get last call and summary if exists
        last_call = db.query(Call).filter(Call.customer_id == c.id).order_by(Call.created_at.desc()).first()
        summary = last_call.ai_summary if (last_call and last_call.ai_summary) else None
        
        data.append({
            "Name": c.name,
            "Mobile": c.mobile,
            "Company Name": c.company_name or "",
            "Preferred Language": c.preferred_language,
            "Service of Interest": c.service_of_interest or (summary.service_required if summary else ""),
            "Customer Requirement": c.customer_requirement or (summary.customer_requirement if summary else ""),
            "Interest Level": c.interest_level or "NEW",
            "Interest Status": c.status,
            "Follow-up Required": "YES" if c.follow_up_required else "NO",
            "Lead Score": summary.lead_score if summary else "N/A",
            "Sentiment": summary.sentiment if summary else "N/A",
            "Call Duration (sec)": c.call_duration or (last_call.duration if last_call else 0),
            "Callback Time": c.preferred_callback_time or (summary.preferred_callback_time if summary else "N/A"),
            "AI Notes": summary.ai_notes if summary else "",
            "Summary": c.call_summary or (summary.summary if summary else "")
        })
        
    df = pd.DataFrame(data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=leadsense_qualified_leads.csv"
    return response
