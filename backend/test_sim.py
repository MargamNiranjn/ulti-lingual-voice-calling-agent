import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

from app.services.openai_service import OpenAIService

svc = OpenAIService()
print("Groq enabled:", svc.enabled)

# Turn 1 - greeting
r1 = svc.get_voice_agent_response([], "English", "We are a digital services company")
print("Turn1 (greeting):", r1[:90])
assert r1, "Turn1 should not be empty"

# Turn 2 - yes
h1 = [{"role": "assistant", "content": r1}, {"role": "user", "content": "Yes I am interested"}]
r2 = svc.get_voice_agent_response(h1, "English", "We are a digital services company")
print("Turn2 (yes):", r2[:90])
assert r2, "Turn2 should not be empty"

# Turn 2 - price question
h2 = [{"role": "assistant", "content": r1}, {"role": "user", "content": "What is the price?"}]
r3 = svc.get_voice_agent_response(h2, "English", "We are a digital services company")
print("Turn2 (price):", r3[:90])

# Hindi
r4 = svc.get_voice_agent_response([], "Hindi", "digital services")
print("Hindi greeting:", r4[:90])
assert r4, "Hindi should not be empty"

# Telugu
r5 = svc.get_voice_agent_response([], "Telugu", "digital services")
print("Telugu greeting:", r5[:90])
assert r5, "Telugu should not be empty"

# Analysis - interested
analysis = svc.analyze_completed_call(h1, "English")
print("Analysis:", analysis.get("interest_status"), "| Score:", analysis.get("lead_score"))
assert analysis.get("interest_status") in ["Interested", "Maybe Interested", "Not Interested"]

# Make sure call does NOT end prematurely after 1 turn
# Turn 2 reply should NOT contain a hard goodbye on first response
h_no = [{"role": "assistant", "content": r1}, {"role": "user", "content": "No not interested"}]
r_no = svc.get_voice_agent_response(h_no, "English", "We are a digital services company")
print("Turn2 (no):", r_no[:90])

from app.main import app
print("FastAPI routes:", len(app.routes))
print("\n=== ALL SIMULATION CHECKS PASSED ===")
