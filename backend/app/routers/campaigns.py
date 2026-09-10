from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import Campaign, Customer, Call, User, campaign_customers
from app.schemas.schemas import CampaignCreate, CampaignUpdate, CampaignResponse, CampaignDetailResponse
from app.core.security import get_current_user
from app.services.telephony_service import TelephonyService
import datetime
import random
import os
import csv
import io
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)



router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])

def calculate_campaign_metrics(campaign: Campaign, db: Session) -> dict:
    total_customers = db.query(campaign_customers).filter(campaign_customers.c.campaign_id == campaign.id).count()
    calls = db.query(Call).filter(Call.campaign_id == campaign.id).all()
    
    total_calls = len(calls)
    answered_calls = sum(1 for c in calls if c.status == "Answered")
    missed_calls = sum(1 for c in calls if c.status in ["No-Answer", "Busy", "Failed"])
    
    # Qualified leads (status Interested in customer)
    customers_in_campaign = db.query(Customer).join(
        campaign_customers, Customer.id == campaign_customers.c.customer_id
    ).filter(campaign_customers.c.campaign_id == campaign.id).all()
    
    qualified_leads = sum(1 for cust in customers_in_campaign if cust.status == "Interested")
    
    # Conversion rate
    conversion_rate = (qualified_leads / total_customers * 100.0) if total_customers > 0 else 0.0
    
    # Average duration
    answered_durations = [c.duration for c in calls if c.status == "Answered" and c.duration > 0]
    average_duration = (sum(answered_durations) / len(answered_durations)) if answered_durations else 0.0
    
    return {
        "total_customers": total_customers,
        "total_calls": total_calls,
        "answered_calls": answered_calls,
        "missed_calls": missed_calls,
        "qualified_leads": qualified_leads,
        "conversion_rate": round(conversion_rate, 2),
        "average_duration": round(average_duration, 2)
    }

@router.get("/", response_model=List[CampaignDetailResponse])
def get_campaigns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    res = []
    for camp in campaigns:
        metrics = calculate_campaign_metrics(camp, db)
        data = CampaignDetailResponse.model_validate(camp)
        # Populate metrics
        for k, v in metrics.items():
            setattr(data, k, v)
        res.append(data)
    return res

@router.post("/", response_model=CampaignResponse)
def create_campaign(
    campaign_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_camp = Campaign(
        name=campaign_in.name,
        status="Draft",
        retry_count=campaign_in.retry_count,
        retry_delay_minutes=campaign_in.retry_delay_minutes
    )
    db.add(new_camp)
    db.commit()
    db.refresh(new_camp)
    
    # Assign customers if provided
    if campaign_in.customer_ids:
        customers = db.query(Customer).filter(Customer.id.in_(campaign_in.customer_ids)).all()
        new_camp.customers.extend(customers)
        db.commit()
        
    return new_camp

@router.get("/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    metrics = calculate_campaign_metrics(camp, db)
    data = CampaignDetailResponse.model_validate(camp)
    for k, v in metrics.items():
        setattr(data, k, v)
    return data

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    campaign_in: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    update_data = campaign_in.model_dump(exclude_unset=True)
    
    # Handle customer reassignment if provided
    if "customer_ids" in update_data:
        cust_ids = update_data.pop("customer_ids")
        if cust_ids is not None:
            # Clear old and set new
            camp.customers.clear()
            customers = db.query(Customer).filter(Customer.id.in_(cust_ids)).all()
            camp.customers.extend(customers)
            
    for key, value in update_data.items():
        setattr(camp, key, value)
        
    db.commit()
    db.refresh(camp)
    return camp

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(camp)
    db.commit()
    return {"message": "Campaign deleted successfully"}


def _dial_single_customer(
    customer_id: int,
    campaign_id: int,
    retry_count: int,
    retry_delay_minutes: int,
    db_session_maker,
    base_url: str
):
    """
    Dials a single customer with retry logic.
    Each attempt waits retry_delay_minutes before retrying on No-Answer/Busy/Failed.
    Runs in its own thread so multiple customers can be dialled concurrently.
    """
    db = db_session_maker()
    try:
        telephony = TelephonyService()

        for attempt in range(1, retry_count + 2):  # attempt 1 = first dial; attempts 2..N = retries
            # Check campaign is still running before each attempt
            camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not camp or camp.status != "Running":
                logger.info(f"Campaign {campaign_id} is no longer running — stopping dial for customer {customer_id}")
                return

            customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if not customer:
                return

            # Find or create call record for this attempt
            existing_call = db.query(Call).filter(
                Call.campaign_id == campaign_id,
                Call.customer_id == customer_id,
                Call.status.in_(["Answered", "In-Progress"])
            ).first()
            if existing_call:
                # Already answered — no need to retry
                logger.info(f"Customer {customer_id} already answered — skipping further retries")
                return

            # Look for a pending call record from a previous attempt we can reuse,
            # or create a fresh one for this attempt
            pending_call = db.query(Call).filter(
                Call.campaign_id == campaign_id,
                Call.customer_id == customer_id,
                Call.status == "Pending"
            ).first()

            if not pending_call:
                pending_call = Call(
                    customer_id=customer_id,
                    campaign_id=campaign_id,
                    status="Pending"
                )
                db.add(pending_call)
                db.commit()
                db.refresh(pending_call)

            from app.routers.settings import get_company_profile_dict
            profile = get_company_profile_dict(db)

            customer.call_status = "CALLING"
            customer.call_id = pending_call.id
            db.commit()

            callback_url = f"{base_url}api/calls/twiml/{pending_call.id}"
            status_callback_url = f"{base_url}api/calls/webhook/{pending_call.id}"

            logger.info(f"Dialling customer {customer_id} ({customer.name}, {customer.preferred_language}) — attempt {attempt}/{retry_count + 1}")

            res = telephony.make_outbound_call(
                customer_mobile=customer.mobile,
                custom_id=str(pending_call.id),
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

            if res.get("status") == "failed":
                reason = res.get("reason", "Unknown failure")
                logger.warning(f"Call failed for customer {customer_id}: {reason}")

                # DND or permanent failure — do not retry
                if "DND" in reason or "Compliance" in reason:
                    pending_call.status = "Failed"
                    customer.status = "Failed"
                    customer.call_status = "FAILED"
                    db.commit()
                    return

                pending_call.status = "Failed"
                customer.call_status = "FAILED"
                db.commit()

                # Retry if attempts remain
                if attempt <= retry_count:
                    logger.info(f"Retrying customer {customer_id} in {retry_delay_minutes} minute(s)...")
                    time.sleep(retry_delay_minutes * 60)
                    pending_call = None
                    continue

                # All retries exhausted
                customer.status = "Failed"
                customer.call_status = "FAILED"
                db.commit()
                return

            elif res.get("sid"):
                pending_call.sid = res["sid"]
                if res.get("status") == "simulated":
                    pending_call.status = "In-Progress"
                    customer.call_status = "CALLING"
                    db.commit()
                    logger.info(f"Simulating AI outbound call for customer {customer_id} in {customer.preferred_language}...")
                    time.sleep(random.uniform(2.0, 4.0))  # Realistic delay for demonstration
                    
                    from app.routers.calls import auto_simulate_call
                    auto_simulate_call(call_id=pending_call.id, db=db, current_user=None)
                    logger.info(f"Simulated AI call completed for customer {customer_id}")
                else:
                    pending_call.status = "Ringing"
                    customer.call_status = "CALLING"
                    db.commit()
                    logger.info(f"Call placed for customer {customer_id} via {res.get('provider', 'telephony')} — SID: {res['sid']}")
                return

    except Exception as e:
        logger.error(f"Unhandled error dialling customer {customer_id}: {e}")
    finally:
        db.close()


def run_campaign_dialer(
    campaign_id: int, 
    db_session_maker, 
    base_url: str, 
    target_customer_ids: Optional[List[int]] = None
):
    """
    Concurrent background campaign dialer.

    - Fetches customers assigned to this campaign (or targeted customer IDs).
    - Skips customers already answered in this campaign.
    - Dials customers simultaneously using a thread pool.
    - Each thread handles its own retry loop.
    - Stops all work if the campaign is paused or stopped mid-run.
    """
    db = db_session_maker()
    try:
        camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not camp or camp.status != "Running":
            return

        retry_count = camp.retry_count or 2
        retry_delay_minutes = camp.retry_delay_minutes or 60

        # Collect customers that have NOT yet been answered in this campaign
        all_customers = camp.customers
        if target_customer_ids:
            all_customers = [c for c in all_customers if c.id in target_customer_ids]

        answered_ids = {
            row.customer_id
            for row in db.query(Call).filter(
                Call.campaign_id == campaign_id,
                Call.status.in_(["Answered", "In-Progress", "Completed"])
            ).all()
        }
        pending_customers = [c for c in all_customers if c.id not in answered_ids]
        customer_ids = [c.id for c in pending_customers]

        logger.info(
            f"Campaign {campaign_id} starting: {len(customer_ids)} customers to dial, "
            f"retry_count={retry_count}, retry_delay={retry_delay_minutes}m"
        )

    except Exception as e:
        logger.error(f"Failed to initialise campaign {campaign_id}: {e}")
        return
    finally:
        db.close()

    # Dial concurrently — max 10 simultaneous calls to avoid flooding the carrier
    MAX_CONCURRENT_CALLS = int(os.getenv("MAX_CONCURRENT_CALLS", "10"))

    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_CALLS) as executor:
        futures = {
            executor.submit(
                _dial_single_customer,
                cid,
                campaign_id,
                retry_count,
                retry_delay_minutes,
                db_session_maker,
                base_url
            ): cid
            for cid in customer_ids
        }

        for future in as_completed(futures):
            cid = futures[future]
            try:
                future.result()
            except Exception as e:
                logger.error(f"Thread error for customer {cid} in campaign {campaign_id}: {e}")

    # Mark campaign Completed if it's still Running (not manually stopped/paused)
    db = db_session_maker()
    try:
        camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if camp and camp.status == "Running":
            camp.status = "Completed"
            db.commit()
            logger.info(f"Campaign {campaign_id} completed — all customers dialled.")
    except Exception as e:
        logger.error(f"Failed to mark campaign {campaign_id} as Completed: {e}")
    finally:
        db.close()


from pydantic import BaseModel
class StartAICampaignRequest(BaseModel):
    customer_ids: Optional[List[int]] = None


@router.post("/{campaign_id}/start-ai")
def start_ai_campaign(
    campaign_id: int, 
    background_tasks: BackgroundTasks,
    request: Request,
    body: Optional[StartAICampaignRequest] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Dedicated endpoint for starting an AI outbound campaign.
    Allows selecting a specific set of customer IDs or targeting all campaign customers.
    Processes calls asynchronously without blocking the HTTP response.
    """
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    selected_ids = body.customer_ids if body and body.customer_ids else [c.id for c in camp.customers]
    if not selected_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Campaign cannot start without customers."
        )

    camp.status = "Running"
    # Mark selected customers as QUEUED
    for cid in selected_ids:
        cust = db.query(Customer).filter(Customer.id == cid).first()
        if cust:
            cust.call_status = "QUEUED"
    db.commit()

    from app.database import SessionLocal
    base_url = os.getenv("PUBLIC_URL") or str(request.base_url)
    if not base_url.endswith("/"):
        base_url += "/"
    background_tasks.add_task(run_campaign_dialer, campaign_id, SessionLocal, base_url, selected_ids)

    return {
        "message": f"AI Outbound Campaign started for {len(selected_ids)} customer(s)",
        "status": "Running",
        "total_queued": len(selected_ids)
    }


@router.post("/{campaign_id}/start")
def start_campaign(
    campaign_id: int, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if not camp.customers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Campaign cannot start without assigned customers."
        )

    if camp.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign has already completed. Create a new campaign to re-dial."
        )

    camp.status = "Running"
    for cust in camp.customers:
        cust.call_status = "QUEUED"
    db.commit()
    
    # Run the background dialing engine
    from app.database import SessionLocal
    base_url = os.getenv("PUBLIC_URL") or str(request.base_url)
    if not base_url.endswith("/"):
        base_url += "/"
    background_tasks.add_task(run_campaign_dialer, campaign_id, SessionLocal, base_url)
    
    return {"message": "Campaign started", "status": "Running"}


@router.post("/{campaign_id}/pause")
def pause_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    camp.status = "Paused"
    db.commit()
    return {"message": "Campaign paused", "status": "Paused"}

@router.post("/{campaign_id}/stop")
def stop_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    camp.status = "Stopped"
    db.commit()
    return {"message": "Campaign stopped", "status": "Stopped"}

@router.post("/create-from-csv")
def create_campaign_from_csv(
    name: str = Form(...),
    retry_count: int = Form(2),
    retry_delay_minutes: int = Form(60),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        content = file.file.read().decode("utf-8")
        csv_reader = csv.reader(io.StringIO(content))
        
        # Read headers
        headers = next(csv_reader, None)
        
        customers_assigned = []
        for row in csv_reader:
            if len(row) < 2:
                continue
            cust_name = row[0].strip()
            cust_mobile = row[1].strip()
            cust_lang = row[2].strip() if len(row) > 2 else "English"
            
            if not cust_name or not cust_mobile:
                continue
                
            # Normalize/clean number
            if not cust_mobile.startswith("+"):
                # Clean characters first
                digits = "".join(filter(str.isdigit, cust_mobile))
                if len(digits) == 10:
                    cust_mobile = "+91" + digits
                elif len(digits) > 10:
                    cust_mobile = "+" + digits
                else:
                    cust_mobile = "+" + digits
            
            # Find or create customer
            cust = db.query(Customer).filter(Customer.mobile == cust_mobile).first()
            if not cust:
                cust = Customer(
                    name=cust_name,
                    mobile=cust_mobile,
                    preferred_language=cust_lang,
                    status="New"
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)
            else:
                cust.status = "New"
                db.commit()
                
            customers_assigned.append(cust)
            
        if not customers_assigned:
            raise HTTPException(status_code=400, detail="No valid customer rows found in CSV.")
            
        # Create the campaign
        campaign = Campaign(
            name=name,
            retry_count=retry_count,
            retry_delay_minutes=retry_delay_minutes,
            status="Draft"
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        # Associate
        for c in customers_assigned:
            if c not in campaign.customers:
                campaign.customers.append(c)
        db.commit()
        
        return {
            "message": "Campaign created from CSV", 
            "campaign_id": campaign.id, 
            "total_leads": len(customers_assigned)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

