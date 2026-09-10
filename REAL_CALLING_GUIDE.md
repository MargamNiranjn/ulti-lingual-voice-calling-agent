# LeadSense Outbound Calling & Lead Qualification System Guide

This guide details the end-to-end architecture, configuration instructions for **Vapi.ai** and **Twilio**, and step-by-step instructions for live presentations and college demonstrations.

---

## 1. System Architecture Overview

LeadSense extends traditional lead management with an AI-driven, asynchronous outbound calling and structured qualification engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LeadSense Frontend (Next.js)                    │
│    Dashboard  •  Customers  •  Campaigns (Start AI)  •  Settings       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Application                     │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   Campaigns Router    │  │            Calls Router                 │ │
│  │  POST /start-ai       │  │  POST /vapi/webhook • /manual           │ │
│  │  (Background Tasks)   │  │  POST /auto-simulate • WS /simulate     │ │
│  └───────────┬───────────┘  └───────────────────┬────────────────────┘ │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Telephony Orchestration Layer                   │  │
│  │  VapiService ──▶ Twilio Voice ──▶ Exotel ──▶ Simulator Engine    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 AI Natural Dialogue & Qualification              │  │
│  │  Groq (Llama 3.3-70B) / OpenAI ──▶ Structured Heuristic Analyzer  │  │
│  │  • English • Hindi • Telugu (Native scripts & vocabulary)        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
             ┌────────────────────────────────────────────────┐
             │      SQLite / PostgreSQL Database              │
             │  • Customers (qualification fields)            │
             │  • AI Summary (timeline, requirements, notes)  │
             │  • System Settings & Audit Logs                │
             └────────────────────────────────────────────────┘
```

---

## 2. Telephony Hierarchy & Fallback System

LeadSense is engineered so that **no call ever crashes or hard-fails**:

1. **Tier 1: Vapi.ai (Production Voice Agent)**
   - Used when `vapi_api_key`, `vapi_phone_number_id`, and `vapi_assistant_id` are configured.
   - Triggers dynamic variable injection:
     - `{{customer_name}}`
     - `{{company_name}}`
     - `{{service_name}}`
     - `{{service_description}}`
     - `{{qualification_questions}}`
     - `{{preferred_language}}`
   - Receives end-of-call webhooks at `POST /api/calls/vapi/webhook`.

2. **Tier 2: Exotel (Indian Telephony)**
   - Used for Indian virtual numbers when Exotel credentials are set in `.env`.

3. **Tier 3: Twilio Voice**
   - Outbound calling with TwiML speech gather and dynamic webhook loops.

4. **Tier 4: Built-in Simulation Engine (Zero Cost & Offline Demo Safe)**
   - Automatically activates if no API keys are supplied or if network calls fail.
   - Generates multi-turn realistic dialogues tailored to the lead's preferred language (**Telugu**, **Hindi**, or **English**).
   - Generates genuine, structured lead qualification analysis without mocking fake results.

---

## 3. Real Vapi.ai Setup Instructions

To connect LeadSense to real telephone lines using Vapi:

### Step 1: Obtain Vapi Credentials
1. Register at [https://vapi.ai](https://vapi.ai).
2. Go to **Settings > API Keys** and copy your **Private API Key**.
3. Under **Phone Numbers**, buy or import a phone number (Twilio or Vonage SIP) and note the **Phone Number ID**.
4. Create an **Assistant**:
   - Set Model: `gpt-4o` or `llama-3.3-70b-versatile`.
   - Set Voice: Multilingual voice supporting Indian accents (e.g. 11labs or Azure Indian English/Hindi/Telugu).
   - In **Server URL**, set your backend webhook URL:
     ```
     https://<your-public-domain-or-ngrok>/api/calls/vapi/webhook
     ```
   - Copy the **Assistant ID**.

### Step 2: Configure in LeadSense
You can configure Vapi in two ways:

#### Option A: LeadSense UI (Recommended)
1. Log in to LeadSense at `http://localhost:3000`.
2. Navigate to **System Settings** (`/settings`).
3. Under **Vapi.ai Live Outbound Calling Integration**:
   - Paste your **Vapi Private API Key**
   - Paste your **Phone Number ID**
   - Paste your **Assistant ID**
   - Set **Active Outbound Dialer Engine** to `Vapi.ai Voice Agent`.
4. Click **Save System Config**.

#### Option B: Environment Variables (`backend/.env`)
Add to `backend/.env`:
```env
TELEPHONY_PROVIDER=vapi
VAPI_API_KEY=your_vapi_private_key
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

---

## 4. Setting Up Twilio Voice (Alternative)

If using Twilio Voice instead of Vapi:
1. In `backend/.env`, set:
   ```env
   TELEPHONY_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   APP_BASE_URL=https://your-public-url.ngrok-free.app
   ```
2. Twilio will call the prospect's mobile and stream the automated voice loop using `POST /api/calls/twilio/voice-loop`.

---

## 5. College / Viva Demonstration Walkthrough

Follow this 5-minute presentation script to demonstrate the system:

### Phase 1: Company Profile & Qualification Questions (1 min)
1. Navigate to **Settings** (`http://localhost:3000/settings`).
2. Show the **Company Name** (`ABC Digital Solutions`), **Services Offered** (`Website Development, E-commerce Stores`), and the **Lead Qualification Questions**.
3. Point out the **TRAI Compliance** rules (calling restricted between 9 AM and 8 PM IST, DND blocklist, mandatory AI disclosures).
4. Save the configuration.

### Phase 2: Multilingual Leads (1 min)
1. Navigate to **Customers** (`http://localhost:3000/customers`).
2. Demonstrate multilingual prospects:
   - **Rahul Sharma** (Language: **Telugu**)
   - **Priya Patel** (Language: **Hindi**)
   - **Amit Kumar** (Language: **English**)
3. Add a new lead using the **Add Lead** button, entering their service of interest and initial requirement.

### Phase 3: AI Campaign Execution (1.5 min)
1. Navigate to **Campaigns** (`http://localhost:3000/campaigns`).
2. Click **Create Campaign** (e.g. `Q1 Retail Web Onboarding`).
3. Click the purple **Start AI** button.
4. Explain to the evaluator:
   > *"The AI campaign runs asynchronously via a background queue. It dials out non-blockingly, streams dialogue in native Telugu, Hindi, or English, and evaluates whether the prospect has genuine commercial interest."*
5. Watch the campaign status progress and view the call queue update in real-time.

### Phase 4: Structured Qualification & Analytics (1.5 min)
1. Navigate to **Call History** (`http://localhost:3000/calls`).
2. Click **View Transcript** for any completed call.
3. Show the **Structured Lead Qualification Output**:
   - **Interest Level**: `HIGH`, `MEDIUM`, `CALL_BACK`, or `NOT_INTERESTED`
   - **Lead Score**: (e.g. `85/100`)
   - **Extracted Customer Requirements**: Specific needs mentioned by the prospect
   - **Estimated Timeline**: When the prospect wants to start
   - **Callback Scheduling**: Automatic callback flags if requested
4. Return to the **Dashboard** (`http://localhost:3000/dashboard`) to show the updated **Executive Overview**, high/medium/low interest counters, and language distribution charts.
