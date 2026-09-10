import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import Setting

def inspect_and_update():
    db = SessionLocal()
    try:
        # Check settings
        settings = db.query(Setting).all()
        print("--- Current Settings ---")
        for s in settings:
            print(f"{s.key}: {s.value}")

        print("\nUpdating company_name and company_description to Amazon...")
        
        amazon_pitch = (
            "Amazon Business & Seller Services. We are reaching out to prospective clients and sellers "
            "who recently visited, registered, or logged into our Amazon platform to explore our services. "
            "We help businesses launch, scale, and deliver their products to millions of active customers. "
            "We are calling to check if you are interested in getting started with Amazon, understand your requirements, "
            "and connect you with an Amazon Onboarding Specialist."
        )

        company_name = db.query(Setting).filter(Setting.key == "company_name").first()
        if company_name:
            company_name.value = "Amazon"
            print("Updated company_name to 'Amazon'")
        else:
            db.add(Setting(
                key="company_name",
                value="Amazon",
                description="Your company or brand name. Used by the AI caller when introducing itself to prospects."
            ))
            print("Added company_name setting as 'Amazon'")
            
        company_desc = db.query(Setting).filter(Setting.key == "company_description").first()
        if company_desc:
            company_desc.value = amazon_pitch
            print("Updated company_description to Amazon")
        else:
            db.add(Setting(
                key="company_description",
                value=amazon_pitch,
                description="Full company pitch read by the AI caller. Describe your services, key benefits, and what makes you different."
            ))
            print("Added company_description setting as Amazon")

        db.commit()
        print("Database updated with Amazon details successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inspect_and_update()
