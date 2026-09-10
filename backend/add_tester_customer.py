import sqlite3
import datetime

def add_lead():
    conn = sqlite3.connect('leadsense.db')
    cursor = conn.cursor()

    name = "Niranjan"
    mobile = "+918639110218"
    preferred_language = "English"  # You can change language in dashboard settings
    company_name = "Test Enterprise"
    notes = "Verified tester mobile number"
    status = "New"
    created_at = datetime.datetime.utcnow().isoformat()

    try:
        # Check if customer already exists to avoid duplicates
        cursor.execute("SELECT id FROM customers WHERE mobile = ?;", (mobile,))
        exists = cursor.fetchone()
        if exists:
            print("Customer already exists in the database.")
            return

        cursor.execute("""
            INSERT INTO customers (name, mobile, preferred_language, company_name, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (name, mobile, preferred_language, company_name, notes, status, created_at))
        
        conn.commit()
        print(f"Successfully added customer: {name} ({mobile}) to the database!")
    except Exception as e:
        print(f"Error adding customer: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_lead()
