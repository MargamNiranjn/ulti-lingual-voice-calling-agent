# Lead Sense – AI Voice Lead Qualification Platform

**Smarter Calls. Better Leads.**

Lead Sense is a production-ready, full-stack SaaS platform that automates outbound sales calls using AI. It contacts leads, speaks in their preferred Indian language, qualifies them based on conversational context, and delivers structured lead reports and CRM updates.

Since you are running this locally without Docker, this guide explains how to configure it with your local **PostgreSQL** database and run it directly using Node.js and Python.

---

## Core Features

- **Multi-Lingual AI Calling**: Speaks naturally in Indian languages (English, Hindi, Telugu, and more) with genuine vocabulary and native script understanding.
- **Production Telephony (Vapi.ai & Twilio)**: Integrated with Vapi.ai for real phone calling with dynamic variable overrides (`{{customer_name}}`, `{{service_name}}`, `{{qualification_questions}}`).
- **Graceful Simulation Fallback**: Built-in dynamic multi-turn dialogue engine that works offline and zero-cost for college and viva presentations without crashing.
- **Asynchronous AI Calling Queue**: Non-blocking background dialing pipeline supporting bulk lead campaigns.
- **Structured Lead Qualification**: Outputs clear commercial metrics: `interest_level` (`HIGH`, `MEDIUM`, `LOW`, `NOT_INTERESTED`, `CALL_BACK`), `lead_score` (0-100), `service_required`, `customer_requirement`, `timeline`, `follow_up_required`, and `preferred_callback_time`.
- **Interactive Call Simulator**: WebSockets-driven simulator allows testing calling dialogs, speech synthesis, and sentiment analysis directly in the browser.
- **Compliance Guard**: Enforces Indian TRAI regulations, including business hour locks (9 AM - 8 PM IST), Do-Not-Disturb (DND) status lookup, and mandatory AI disclosures.
- **CRM Syncing & Notifications**: Instant SMTP email alerts for hot leads, and automated webhooks to sync qualified leads directly into Zoho and Salesforce.
- **Full Documentation**: See [REAL_CALLING_GUIDE.md](REAL_CALLING_GUIDE.md) for live Vapi setup and presentation steps.

---

## Local Setup Instructions (Without Docker)

Follow these steps to run both the FastAPI backend and Next.js frontend on your laptop.

### Step 1: Set up your local PostgreSQL database

1. Open your PostgreSQL terminal (psql) or pgAdmin.
2. Create a new database named `leadsense`:
   ```sql
   CREATE DATABASE leadsense;
   ```

### Step 2: Configure the Backend Environment

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Open the `.env` file in your editor. Update the `DATABASE_URL` to point to your local PostgreSQL database. Replace `postgres` and `password` with your local PostgreSQL username and password:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/leadsense
   JWT_SECRET=super-secret-jwt-key-replace-in-production
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   
   # Optional: Add your OpenAI API key for live AI voice generation (mock fallbacks are used if empty)
   OPENAI_API_KEY=
   ```
   *(Note: If you leave `DATABASE_URL` commented out or empty, the backend will automatically fall back to a local SQLite file database `leadsense.db` at startup, which requires zero setup!)*

### Step 3: Run the Backend (FastAPI)

1. Create a Python virtual environment and activate it:
   ```bash
   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install the backend requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend documentation will be accessible at `http://localhost:8000/docs`.*

### Step 4: Run the Frontend (Next.js)

1. Open a new terminal window/tab and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the Node.js packages:
   ```bash
   npm install
   ```
3. Run the Next.js frontend development server:
   ```bash
   npm run dev
   ```
   *The client dashboard will be live at `http://localhost:3000`.*

---

## Verifying the Flow

1. **Register**: Go to `http://localhost:3000` and click the **Sign Up** tab. Create an Administrator or Sales Manager account.
2. **Add Leads**: Click the **Customers** page. Add a manual customer (e.g. `Rahul Sharma`, mobile `9876543210`, preferred language `Hindi`) or upload a CSV file.
3. **Dial Out Call**: 
   - On the **Dashboard** or **Customers** page, click the **Call AI** button next to a customer.
   - A phone interface will popup. Click **Dial Outward Call** to establish the WebSocket connection.
   - Speak/Type answers: *"Yes, I am interested, how much is it?"* or *"No, do not call again."*
   - Click the red **Hang Up** button. The call closes, and a complete post-call summary is instantly generated (Interest status, AI score, callback times, transcript log).
4. **Campaign Running**:
   - Go to **Campaigns**, click **Create Campaign**, choose criteria (e.g. all leads in "New" status), and save.
   - Click the green **Start** icon. It queues all leads.
   - Expand the campaign. You can auto-simulate individual calls to quickly populate dashboards, or simulate them live.
   - View visual conversion rates on the dashboard.
