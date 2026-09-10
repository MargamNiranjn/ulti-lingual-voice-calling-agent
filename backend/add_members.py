import os
import sys

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.models import Customer

def main():
    db = SessionLocal()
    try:
        new_leads = [
            Customer(
                name="Aditya Verma",
                mobile="9876543201",
                preferred_language="Hindi",
                company_name="Verma Logistics",
                notes="Interested in automating logistics inquiries",
                status="New"
            ),
            Customer(
                name="Karthik Venkat",
                mobile="9876543202",
                preferred_language="Telugu",
                company_name="Venkat AgriTech",
                notes="Interested in lead generation solutions",
                status="New"
            ),
            Customer(
                name="Anjali Nair",
                mobile="9876543203",
                preferred_language="Malayalam",
                company_name="Nair Wellness",
                notes="Wants to filter outbound calls for wellness packages",
                status="New"
            )
        ]
        
        added_count = 0
        for lead in new_leads:
            existing = db.query(Customer).filter(Customer.mobile == lead.mobile).first()
            if not existing:
                db.add(lead)
                added_count += 1
                print(f"Added customer: {lead.name} ({lead.mobile}) - {lead.preferred_language}")
            else:
                print(f"Customer with mobile {lead.mobile} ({lead.name}) already exists.")
        
        if added_count > 0:
            db.commit()
            print(f"Successfully committed {added_count} new customers to the database.")
        else:
            print("No new customers were added.")
            
    except Exception as e:
        print(f"Error adding customers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
