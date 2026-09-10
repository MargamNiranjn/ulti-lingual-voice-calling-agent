from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "Agent"  # Admin, Sales Manager, Agent

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    mobile: str
    preferred_language: str = "English"
    company_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "New"
    service_of_interest: Optional[str] = None
    customer_requirement: Optional[str] = None
    interest_level: Optional[str] = "NEW"
    call_status: Optional[str] = "PENDING"
    call_duration: Optional[int] = 0
    call_summary: Optional[str] = None
    follow_up_required: Optional[bool] = False
    preferred_callback_time: Optional[str] = None
    call_id: Optional[int] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    preferred_language: Optional[str] = None
    company_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    service_of_interest: Optional[str] = None
    customer_requirement: Optional[str] = None
    interest_level: Optional[str] = None
    call_status: Optional[str] = None
    call_duration: Optional[int] = None
    call_summary: Optional[str] = None
    follow_up_required: Optional[bool] = None
    preferred_callback_time: Optional[str] = None
    call_id: Optional[int] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Structured Lead Qualification Schema ---
class StructuredLeadQualification(BaseModel):
    interest_level: str = "NOT_INTERESTED"  # HIGH, MEDIUM, LOW, NOT_INTERESTED, CALL_BACK
    service_required: Optional[str] = None
    customer_requirement: Optional[str] = None
    timeline: Optional[str] = None
    follow_up_required: bool = False
    preferred_callback_time: Optional[str] = None
    summary: str = ""

# --- AISummary Schemas ---
class AISummaryBase(BaseModel):
    transcript: Optional[str] = None
    summary: Optional[str] = None
    interest_status: str = "Not Interested"
    lead_score: int = 0
    sentiment: str = "Neutral"
    preferred_callback_time: Optional[str] = None
    language_used: str = "English"
    ai_notes: Optional[str] = None
    service_required: Optional[str] = None
    customer_requirement: Optional[str] = None
    timeline: Optional[str] = None
    follow_up_required: bool = False
    interest_level: Optional[str] = None

class AISummaryResponse(AISummaryBase):
    id: int
    call_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Call Schemas ---
class CallBase(BaseModel):
    sid: Optional[str] = None
    customer_id: int
    campaign_id: Optional[int] = None
    status: str = "Pending"
    duration: int = 0
    recording_url: Optional[str] = None

class CallResponse(CallBase):
    id: int
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    ai_summary: Optional[AISummaryResponse] = None

    class Config:
        from_attributes = True

# --- Campaign Schemas ---
class CampaignBase(BaseModel):
    name: str
    status: str = "Draft"  # Draft, Running, Paused, Stopped, Completed
    retry_count: int = 2
    retry_delay_minutes: int = 60

class CampaignCreate(CampaignBase):
    customer_ids: Optional[List[int]] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    retry_count: Optional[int] = None
    retry_delay_minutes: Optional[int] = None
    customer_ids: Optional[List[int]] = None

class CampaignResponse(CampaignBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended response detailing campaign statistics
class CampaignDetailResponse(CampaignResponse):
    total_customers: int = 0
    total_calls: int = 0
    answered_calls: int = 0
    missed_calls: int = 0
    qualified_leads: int = 0
    conversion_rate: float = 0.0
    average_duration: float = 0.0

# --- Dashboard & Analytics Schemas ---
class DashboardMetrics(BaseModel):
    total_customers: int
    total_calls: int
    calls_in_progress: int
    interested_leads: int
    follow_up_required: int
    conversion_rate: float
    
    # AI Campaign & Qualification metrics
    calls_queued: int = 0
    calls_completed: int = 0
    calls_no_answer: int = 0
    calls_failed: int = 0
    high_interest_leads: int = 0
    medium_interest_leads: int = 0
    low_interest_leads: int = 0
    not_interested_leads: int = 0
    
    daily_analytics: List[Any]
    weekly_analytics: List[Any]
    campaign_performance: List[Any]
    language_distribution: List[Any]

# --- Settings Schemas ---
class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SettingUpdate(BaseModel):
    value: str

class SettingResponse(SettingBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Activity Log Schemas ---
class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    details: Optional[str]
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True
