from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
from app.database import engine, Base, get_db
from app.routers import auth, customers, campaigns, calls, analytics, settings
from app.ws.ws_manager import manager

# Create database tables
Base.metadata.create_all(bind=engine)
try:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from migrate_db import migrate
    migrate()
except Exception as e:
    print(f"Startup schema migration note: {e}")

try:
    from app.database import SessionLocal
    from app.routers.settings import seed_default_settings
    db = SessionLocal()
    seed_default_settings(db)
    db.close()
except Exception as e:
    print(f"Default settings seed note: {e}")

app = FastAPI(
    title="Voice Calling Agent API",
    description="Backend services for the AI Voice Lead Qualification Platform",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(campaigns.router)
app.include_router(calls.router)
app.include_router(analytics.router)
app.include_router(settings.router)

# WebSocket endpoint for real-time browser call simulation
@app.websocket("/api/ws/call/{call_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str, db: Session = Depends(get_db)):
    await manager.connect(websocket, call_id)
    try:
        await manager.handle_call_simulation(websocket, call_id, db)
    except WebSocketDisconnect:
        manager.disconnect(call_id)
    except Exception:
        manager.disconnect(call_id)


# WebSocket endpoint for live transcript streaming during real Twilio calls.
# The TwiML loop pushes each conversation turn here so the frontend
# can display the transcript in real time without waiting for the call to end.
@app.websocket("/api/ws/transcript/{call_id}")
async def websocket_transcript_endpoint(websocket: WebSocket, call_id: str):
    session_key = f"transcript_{call_id}"
    await websocket.accept()
    manager.active_connections[session_key] = websocket
    try:
        # Keep connection alive — the TwiML route pushes messages here
        while True:
            # We only need to receive to detect client disconnect
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if session_key in manager.active_connections:
            del manager.active_connections[session_key]

@app.get("/")
def read_root():
    return {"name": "Multi Lingual Generative Voice Calling Agent API", "status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
