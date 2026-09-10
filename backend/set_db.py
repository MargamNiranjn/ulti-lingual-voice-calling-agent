"""
Database setup script.
Run once to create the 'leadsense' PostgreSQL database and update backend/.env.

Usage:
    Set DB_PASSWORD, DB_PORT, DB_USER, DB_NAME in your environment or .env before running:
        python set_db.py

    Or pass them directly as environment variables:
        DB_PASSWORD=yourpassword python set_db.py
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import urllib.parse
import os
from dotenv import load_dotenv

# Load .env so credentials can be stored there instead of hardcoded here
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

password = os.getenv("DB_PASSWORD", "")
port     = os.getenv("DB_PORT", "5432")
username = os.getenv("DB_USER", "postgres")
dbname   = os.getenv("DB_NAME", "leadsense")

if not password:
    raise SystemExit(
        "ERROR: DB_PASSWORD is not set.\n"
        "Add DB_PASSWORD=yourpassword to backend/.env or set it as an environment variable."
    )


def setup_postgres():
    try:
        # Connect to default 'postgres' database to create the app database
        conn = psycopg2.connect(
            dbname="postgres",
            user=username,
            host="localhost",
            password=password,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database already exists
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (dbname,)
        )
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f'CREATE DATABASE "{dbname}"')
            print(f"SUCCESS: Database '{dbname}' created.")
        else:
            print(f"SUCCESS: Database '{dbname}' already exists.")

        cursor.close()
        conn.close()

        # Build connection URL and update DATABASE_URL in backend/.env
        encoded_password = urllib.parse.quote_plus(password)
        db_url = f"postgresql://{username}:{encoded_password}@localhost:{port}/{dbname}"

        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()

            with open(env_path, "w") as f:
                for line in lines:
                    if line.startswith("DATABASE_URL="):
                        f.write(f"DATABASE_URL={db_url}\n")
                    else:
                        f.write(line)
            print("SUCCESS: Updated DATABASE_URL in backend/.env")
        else:
            print(f"INFO: No .env found — DATABASE_URL would be:\n  {db_url}")

        return True

    except Exception as e:
        print(f"ERROR: Database setup failed: {e}")
        return False


if __name__ == "__main__":
    setup_postgres()
