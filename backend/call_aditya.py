import os
import sys
import random
from datetime import datetime

# Add path so imports work correctly
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.models import Customer, Call, AISummary
from app.services.openai_service import OpenAIService

def main():
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    db = SessionLocal()
    try:
        # 1. Find Aditya Verma in database
        customer = db.query(Customer).filter(Customer.name == "Aditya Verma").first()
        if not customer:
            print("ERROR: Customer 'Aditya Verma' not found in database.")
            return
        
        print(f"Target Customer: {customer.name}")
        print(f"Mobile Number: {customer.mobile}")
        print(f"Preferred Language: {customer.preferred_language}")
        print("-" * 50)

        # 2. Create the Call Log
        new_call = Call(
            customer_id=customer.id,
            status="In-Progress"
        )
        db.add(new_call)
        db.commit()
        db.refresh(new_call)

        # 3. Conversational Dialogue in Hindi (Amazon Website Login / Follow-up Scenario)
        conversations = [
            {"role": "assistant", "content": "नमस्ते! क्या मेरी बात आदित्य वर्मा जी से हो रही है?"},
            {"role": "user", "content": "हाँ, मैं आदित्य बोल रहा हूँ। आप कौन बात कर रहे हैं?"},
            {"role": "assistant", "content": "नमस्ते आदित्य जी! मैं अमेज़न (Amazon) से एआई सहायक बात कर रही हूँ। हमने देखा कि आपने हाल ही में हमारी वेबसाइट पर लॉगिन करके हमारी सेलर और बिज़नेस सेवाओं में रुचि दिखाई थी। क्या मैं आपकी २ मिनट ले सकती हूँ?"},
            {"role": "user", "content": "हाँ, यह दिलचस्प लग रहा है। मैं अमेज़न पर अपने प्रोडक्ट्स बेचना चाहता हूँ। इसमें कितना खर्च और कमीशन लगता है?"},
            {"role": "assistant", "content": "आदित्य जी, हमारे पास नए सेलर्स के लिए बहुत आसान और आकर्षक योजनाएं हैं। आपकी ज़रूरतों के हिसाब से ऑनबोर्डिंग में मदद करने के लिए, क्या मैं हमारे अमेज़न ऑनबोर्डिंग स्पेशलिस्ट के साथ कल सुबह ११ बजे एक छोटी कॉल रख सकती हूँ?"},
            {"role": "user", "content": "ठीक है, कल सुबह ११ बजे मुझे कॉल करवा दीजिए।"},
            {"role": "assistant", "content": "बहुत-बहुत धन्यवाद आदित्य जी! मैंने कल सुबह ११ बजे के लिए कॉल तय कर दिया है। हमारे अमेज़न स्पेशलिस्ट आपसे संपर्क करेंगे। आपका दिन शुभ हो, अलविदा!"}
        ]

        print("--- AI Voice Call Dialogue ---")
        for message in conversations:
            speaker = "AI Assistant" if message["role"] == "assistant" else f"Customer ({customer.name})"
            print(f"{speaker}: {message['content']}")
        print("-" * 50)

        # 4. Analyze Call using AI Qualification Service
        print("Qualifying lead and performing post-call analysis...")
        openai_srv = OpenAIService()
        analysis = openai_srv.analyze_completed_call(conversations, customer.preferred_language)

        # 5. Update Database Records
        new_call.status = "Answered"
        new_call.duration = random.randint(45, 90)
        
        interest = analysis.get("interest_status", "Interested")
        customer.status = interest
        if analysis.get("preferred_callback_time"):
            customer.status = "Callback Scheduled"
            
        ai_sum = AISummary(
            call_id=new_call.id,
            transcript=analysis.get("transcript"),
            summary=analysis.get("summary"),
            interest_status=interest,
            lead_score=analysis.get("lead_score", 92),
            sentiment=analysis.get("sentiment", "Positive"),
            preferred_callback_time=analysis.get("preferred_callback_time", "Tomorrow at 11:00 AM"),
            language_used=analysis.get("language_used", customer.preferred_language),
            ai_notes=analysis.get("ai_notes", "Wants to automate B2B logistics cold calls. Callback scheduled.")
        )
        db.add(ai_sum)
        db.commit()

        print("\n--- AI Qualification Results Saved ---")
        print(f"Interest Status: {interest}")
        print(f"Lead Score: {ai_sum.lead_score}/100")
        print(f"Customer Sentiment: {ai_sum.sentiment}")
        print(f"Preferred Callback Time: {ai_sum.preferred_callback_time}")
        print(f"AI Notes: {ai_sum.ai_notes}")
        print(f"Call Summary: {ai_sum.summary}")
        
    except Exception as e:
        print(f"Error running simulation: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
