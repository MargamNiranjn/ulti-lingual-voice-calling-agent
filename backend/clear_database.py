import sqlite3

def clear_data():
    conn = sqlite3.connect('leadsense.db')
    cursor = conn.cursor()

    # Get list of all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Found tables:", tables)

    # Tables to clear
    tables_to_clear = ['calls', 'customers', 'campaigns', 'ai_summaries']

    for table in tables_to_clear:
        if table in tables:
            try:
                cursor.execute(f"DELETE FROM {table};")
                print(f"Cleared all records from table: {table}")
            except Exception as e:
                print(f"Error clearing {table}: {e}")

    conn.commit()
    conn.close()
    print("Database data cleared successfully (preserved users and settings).")

if __name__ == "__main__":
    clear_data()
