from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io
from app.database import get_db
from app.models.models import Customer, User
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.core.security import get_current_user, RoleChecker

router = APIRouter(prefix="/api/customers", tags=["Customers"])

# Access control lists
manager_or_admin = RoleChecker(["Admin", "Sales Manager"])

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    language: Optional[str] = None,
    status_filter: Optional[str] = None,
    interest_level: Optional[str] = None,
    call_status: Optional[str] = None,
    follow_up_required: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Customer)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) | 
            (Customer.mobile.ilike(search_filter)) |
            (Customer.company_name.ilike(search_filter)) |
            (Customer.service_of_interest.ilike(search_filter))
        )
    
    if language:
        query = query.filter(Customer.preferred_language == language)
        
    if status_filter:
        query = query.filter(Customer.status == status_filter)

    if interest_level:
        query = query.filter(Customer.interest_level == interest_level)

    if call_status:
        query = query.filter(Customer.call_status == call_status)

    if follow_up_required is not None:
        query = query.filter(Customer.follow_up_required == follow_up_required)
        
    return query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify mobile duplication within campaign/general
    existing = db.query(Customer).filter(Customer.mobile == customer_in.mobile).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this mobile number already exists."
        )

    new_cust = Customer(**customer_in.model_dump())
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return new_cust

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cust, key, value)
        
    db.commit()
    db.refresh(cust)
    return cust

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(cust)
    db.commit()
    return {"message": "Customer deleted successfully"}

@router.post("/import", response_model=List[CustomerResponse])
async def import_customers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parses and imports leads from uploaded CSV/Excel.
    Expects headers: Name, Mobile, Preferred Language, Company Name, Notes
    """
    contents = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Invalid file type. Only CSV, XLS, and XLSX are supported.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Clean header spaces and case
    df.columns = [col.strip().lower() for col in df.columns]
    
    # Check required columns
    if 'name' not in df.columns or 'mobile' not in df.columns:
        raise HTTPException(
            status_code=400, 
            detail="File must contain at least 'Name' and 'Mobile' columns."
        )

    imported_customers = []
    skipped_count = 0

    for _, row in df.iterrows():
        name = str(row['name']).strip()
        mobile = str(row['mobile']).strip().split('.')[0]  # Avoid float formatting if read from Excel
        
        if not name or not mobile or mobile == 'nan':
            skipped_count += 1
            continue
            
        # Check database duplication
        existing = db.query(Customer).filter(Customer.mobile == mobile).first()
        if existing:
            skipped_count += 1
            continue
            
        lang = str(row.get('preferred language', row.get('preferred_language', 'English'))).strip()
        if lang == 'nan':
            lang = 'English'
            
        company = str(row.get('company name', row.get('company_name', ''))).strip()
        company = None if (not company or company == 'nan') else company
        
        notes = str(row.get('notes', '')).strip()
        notes = None if (not notes or notes == 'nan') else notes

        service = str(row.get('service of interest', row.get('service_of_interest', row.get('service', '')))).strip()
        service = None if (not service or service == 'nan') else service

        req = str(row.get('customer requirement', row.get('customer_requirement', row.get('requirement', '')))).strip()
        req = None if (not req or req == 'nan') else req
        
        customer = Customer(
            name=name,
            mobile=mobile,
            preferred_language=lang,
            company_name=company,
            notes=notes,
            service_of_interest=service,
            customer_requirement=req,
            interest_level="NEW",
            call_status="PENDING",
            status="New"
        )
        db.add(customer)
        imported_customers.append(customer)

    if imported_customers:
        db.commit()
        for cust in imported_customers:
            db.refresh(cust)
            
    return imported_customers
