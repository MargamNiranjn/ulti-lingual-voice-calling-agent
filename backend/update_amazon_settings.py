import sqlite3

def update_to_amazon():
    conn = sqlite3.connect('leadsense.db')
    cursor = conn.cursor()

    amazon_pitch = (
        "Amazon Business & Seller Services. We are reaching out to prospective clients and sellers "
        "who recently visited, registered, or logged into our Amazon platform to explore our services. "
        "We help businesses launch, scale, and deliver their products to millions of active customers. "
        "We are calling to check if you are interested in getting started with Amazon, understand your requirements, "
        "and connect you with an Amazon Onboarding Specialist."
    )

    try:
        # Update or insert company_name
        cursor.execute("SELECT id FROM settings WHERE key = 'company_name'")
        if cursor.fetchone():
            cursor.execute("UPDATE settings SET value = 'Amazon' WHERE key = 'company_name'")
        else:
            cursor.execute("INSERT INTO settings (key, value, description) VALUES ('company_name', 'Amazon', 'Your company or brand name.')")

        # Update or insert company_description
        cursor.execute("SELECT id FROM settings WHERE key = 'company_description'")
        if cursor.fetchone():
            cursor.execute("UPDATE settings SET value = ? WHERE key = 'company_description'", (amazon_pitch,))
        else:
            cursor.execute("INSERT INTO settings (key, value, description) VALUES ('company_description', ?, 'Full company pitch read by the AI caller.')", (amazon_pitch,))

        conn.commit()
        print("SUCCESS: Database settings updated to Amazon successfully!")
    except Exception as e:
        print(f"Error updating settings: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_to_amazon()
