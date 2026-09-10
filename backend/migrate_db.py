"""
Safe, non-destructive migration script for LeadSense.
Adds new columns to `customers` and `ai_summaries` tables if they don't already exist.
"""
import os
from app.database import DATABASE_URL, engine, Base
from sqlalchemy import inspect, text

def migrate():
    print(f"Checking database schema for: {DATABASE_URL}")
    
    # First create any newly defined tables
    Base.metadata.create_all(bind=engine)
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        
        # 1. Check customers table
        customer_cols = {col['name'] for col in inspector.get_columns('customers')}
        print("Current customer columns:", customer_cols)
        
        new_customer_cols = [
            ("service_of_interest", "VARCHAR"),
            ("customer_requirement", "TEXT"),
            ("interest_level", "VARCHAR DEFAULT 'NEW'"),
            ("call_status", "VARCHAR DEFAULT 'PENDING'"),
            ("call_duration", "INTEGER DEFAULT 0"),
            ("call_summary", "TEXT"),
            ("follow_up_required", "BOOLEAN DEFAULT 0"),
            ("preferred_callback_time", "VARCHAR"),
            ("call_id", "INTEGER"),
            ("updated_at", "DATETIME")
        ]
        
        for col_name, col_type in new_customer_cols:
            if col_name not in customer_cols:
                print(f"Adding column '{col_name}' to 'customers' table...")
                try:
                    conn.execute(text(f"ALTER TABLE customers ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Added '{col_name}' successfully.")
                except Exception as e:
                    print(f"Note on adding {col_name}: {e}")
        
        # 2. Check ai_summaries table
        if 'ai_summaries' in inspector.get_table_names():
            ai_summary_cols = {col['name'] for col in inspector.get_columns('ai_summaries')}
            print("Current ai_summaries columns:", ai_summary_cols)
            
            new_ai_cols = [
                ("service_required", "VARCHAR"),
                ("customer_requirement", "TEXT"),
                ("timeline", "VARCHAR"),
                ("follow_up_required", "BOOLEAN DEFAULT 0"),
                ("interest_level", "VARCHAR")
            ]
            
            for col_name, col_type in new_ai_cols:
                if col_name not in ai_summary_cols:
                    print(f"Adding column '{col_name}' to 'ai_summaries' table...")
                    try:
                        conn.execute(text(f"ALTER TABLE ai_summaries ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                        print(f"Added '{col_name}' successfully.")
                    except Exception as e:
                        print(f"Note on adding {col_name}: {e}")

    print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate()
