from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text, Float
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

# Many-to-many relationship table for campaigns and customers
campaign_customers = Table(
    'campaign_customers',
    Base.metadata,
    Column('campaign_id', Integer, ForeignKey('campaigns.id', ondelete="CASCADE"), primary_key=True),
    Column('customer_id', Integer, ForeignKey('customers.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Agent")  # Admin, Sales Manager, Agent
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    logs = relationship("ActivityLog", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    mobile = Column(String, index=True, nullable=False)
    preferred_language = Column(String, default="English")  # English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Spanish, French, German, Arabic, Japanese
    company_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="New")  # New, Interested, Maybe Interested, Not Interested, DND, Failed, Callback Scheduled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Lead qualification & AI outbound calling fields
    service_of_interest = Column(String, nullable=True)
    customer_requirement = Column(Text, nullable=True)
    interest_level = Column(String, default="NEW")  # HIGH, MEDIUM, LOW, NOT_INTERESTED, CALL_BACK, NEW
    call_status = Column(String, default="PENDING")  # PENDING, QUEUED, CALLING, IN_PROGRESS, COMPLETED, NO_ANSWER, BUSY, FAILED, CALL_BACK_REQUESTED
    call_duration = Column(Integer, default=0)
    call_summary = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    preferred_callback_time = Column(String, nullable=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    campaigns = relationship("Campaign", secondary=campaign_customers, back_populates="customers")
    calls = relationship("Call", back_populates="customer", cascade="all, delete-orphan", foreign_keys="[Call.customer_id]")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="Draft")  # Draft, Running, Paused, Stopped, Completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Retry configurations
    retry_count = Column(Integer, default=2)
    retry_delay_minutes = Column(Integer, default=60)
    
    # Relationships
    customers = relationship("Customer", secondary=campaign_customers, back_populates="campaigns")
    calls = relationship("Call", back_populates="campaign", cascade="all, delete-orphan")

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    sid = Column(String, unique=True, index=True, nullable=True)  # Telephony Call SID (Vapi/Twilio/Exotel)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True)
    status = Column(String, default="Pending")  # Pending, Ringing, In-Progress, Answered, No-Answer, Busy, Failed, Completed
    duration = Column(Integer, default=0)  # in seconds
    recording_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="calls", foreign_keys=[customer_id])
    campaign = relationship("Campaign", back_populates="calls")
    ai_summary = relationship("AISummary", uselist=False, back_populates="call", cascade="all, delete-orphan")

class AISummary(Base):
    __tablename__ = "ai_summaries"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id", ondelete="CASCADE"), unique=True, nullable=False)
    transcript = Column(Text, nullable=True)  # Store call transcript
    summary = Column(Text, nullable=True)     # Store call summary
    interest_status = Column(String, default="Not Interested")  # Interested, Maybe Interested, Not Interested
    lead_score = Column(Integer, default=0)    # 0 to 100
    sentiment = Column(String, default="Neutral")  # Positive, Neutral, Negative, Angry
    preferred_callback_time = Column(String, nullable=True)
    language_used = Column(String, default="English")
    ai_notes = Column(Text, nullable=True)
    
    # Structured Lead Qualification Fields
    service_required = Column(String, nullable=True)
    customer_requirement = Column(Text, nullable=True)
    timeline = Column(String, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    interest_level = Column(String, nullable=True)  # HIGH, MEDIUM, LOW, NOT_INTERESTED, CALL_BACK
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    call = relationship("Call", back_populates="ai_summary")

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="logs")
