import os
import json
import random
from typing import Dict, Any, List

# NOTE: Do NOT read env vars at module level — they may not be loaded yet.
# Key is read inside __init__ so it picks up load_dotenv() from main.py.


class OpenAIService:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.enabled = bool(groq_key)
        self.groq_key = groq_key
        self.client = None  # not used — we call Groq REST API directly via requests

    # ── Fallback multi-turn replies when Groq key is not configured ──────────
    _FALLBACK_TURNS = {
        "English": {
            "greeting": "Hello! I am an AI calling on behalf of Amazon. We noticed you recently visited and logged into our website to explore our services. Are you interested in learning more or getting started?",
            "pitch":    "Amazon helps businesses and sellers scale rapidly to reach millions of customers with our logistics, cloud, and marketplace services. Would you like to see how it works?",
            "pricing":  "Our plans are very flexible and tailored to your needs. Can I schedule a quick callback with an Amazon Specialist to walk you through the details?",
            "callback": "No problem at all! What time works best for you? I will ensure our Amazon team calls you back then.",
            "close_yes":"That is wonderful! I will pass your details to our Amazon Onboarding Specialist who will contact you shortly. Thank you for your time, goodbye!",
            "close_no": "I completely understand. Thank you for your time today. Have a great day, goodbye!",
        },
        "Hindi": {
            "greeting": "नमस्ते! मैं अमेज़न (Amazon) की तरफ से कॉल कर रही हूँ। हमने देखा कि आपने हाल ही में हमारी वेबसाइट पर लॉगिन करके हमारी सेवाओं में रुचि दिखाई थी। क्या आप इसके बारे में और जानना चाहते हैं?",
            "pitch":    "अमेज़न के साथ जुड़कर आप लाखों ग्राहकों तक अपना व्यवसाय पहुँचा सकते हैं। क्या आप जानना चाहेंगे कि यह आपके लिए कैसे काम करेगा?",
            "pricing":  "हमारे प्लान्स बहुत ही किफायती और आसान हैं। क्या मैं हमारे अमेज़न विशेषज्ञ के साथ आपकी एक कॉल शेड्यूल करूँ?",
            "callback": "कोई बात नहीं! आपके लिए सबसे अच्छा समय कब होगा? हमारी टीम उसी समय आपको कॉल करेगी।",
            "close_yes":"बहुत बढ़िया! मैं आपकी जानकारी हमारे अमेज़न विशेषज्ञ को भेज रही हूँ जो जल्द ही आपसे संपर्क करेंगे। धन्यवाद, अलविदा!",
            "close_no": "बिल्कुल समझ में आता है। आपके समय के लिए बहुत-बहुत धन्यवाद। आपका दिन शुभ हो, अलविदा!",
        },
        "Telugu": {
            "greeting": "నమస్కారం! నేను అమెజాన్ (Amazon) తరఫున మాట్లాడుతున్నాను. మీరు ఇటీవల మా వెబ్‌సైట్‌ను సందర్శించి మా సేవలపై ఆసక్తి చూపించినట్లు చూశాము. మీరు మరింత సమాచారం తెలుసుకోవాలనుకుంటున్నారా?",
            "pitch":    "అమెజాన్‌తో మీరు మీ వ్యాపారాన్ని మిలియన్ల కొద్దీ కస్టమర్లకు సులభంగా విస్తరించవచ్చు. మీరు ప్రారంభించడానికి ఆసక్తిగా ఉన్నారా?",
            "pricing":  "మా ప్లాన్‌లు చాలా అనుకూలంగా ఉంటాయి. వివరాల కోసం మా అమెజాన్ స్పెషలిస్ట్‌తో కాల్ షెడ్యూల్ చేయనా?",
            "callback": "సమస్య లేదు! మీకు ఏ సమయం అనుకూలంగా ఉంటుంది? మేము అప్పుడు ఖచ్చితంగా కాల్ చేస్తాము.",
            "close_yes":"చాలా సంతోషం! మా అమెజాన్ ఆన్‌బోర్డింగ్ టీమ్ త్వరలోనే మీకు కాల్ చేస్తారు. ధన్యవాదాలు, సెలవు!",
            "close_no": "అర్థమైంది. మీ విలువైన సమయానికి ధన్యవాదాలు. మీకు శుభ దినం కలగాలి, సెలవు!",
        },
        "Tamil": {
            "greeting": "வணக்கம்! நான் அமேசான் (Amazon) சார்பாக அழைக்கிறேன். நீங்கள் சமீபத்தில் எங்கள் தளத்தில் உள்நுழைந்து எங்கள் சேவைகளைப் பார்வையிட்டதைக் கண்டோம். மேலும் விவரங்களை அறிய விரும்புகிறீர்களா?",
            "pitch":    "அமேசான் மூலம் உங்கள் வணிகத்தை லட்சக்கணக்கான வாடிக்கையாளர்களுக்கு எளிதாகக் கொண்டு செல்லலாம். நீங்கள் தொடங்க ஆர்வமாக உள்ளீர்களா?",
            "pricing":  "எங்கள் திட்டங்கள் மிகவும் எளிமையானவை. எங்கள் அமேசான் நிபுணருடன் ஒரு ஆலோசனைக் கூட்டத்தை திட்டமிடலாமா?",
            "callback": "பரவாயில்லை! உங்களுக்கு எந்த நேரம் வசதியாக இருக்கும்? அப்போது நாங்கள் அழைக்கிறோம்.",
            "close_yes":"மிக்க மகிழ்ச்சி! எங்கள் அமேசான் குழு விரைவில் உங்களைத் தொடர்பு கொள்ளும். நன்றி, வணக்கம்!",
            "close_no": "புரிந்தது. உங்கள் நேரத்திற்கு மிக்க நன்றி. நல்ல நாள் அமையட்டும், வணக்கம்!",
        },
        "Kannada": {
            "greeting": "ನಮಸ್ಕಾರ! ನಾನು ಅಮೆಜಾನ್ (Amazon) ಪರವಾಗಿ ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. ನೀವು ಇತ್ತೀಚೆಗೆ ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಭೇಟಿ ನೀಡಿ ಲಾಗಿನ್ ಆಗಿರುವುದನ್ನು ನಾವು ಗಮನಿಸಿದ್ದೇವೆ. ನಮ್ಮ ಸೇವೆಗಳ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?",
            "pitch":    "ಅಮೆಜಾನ್ ಮೂಲಕ ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಲಕ್ಷಾಂತರ ಗ್ರಾಹಕರಿಗೆ ಸುಲಭವಾಗಿ ವಿಸ್ತರಿಸಬಹುದು. ನೀವು ಪ್ರಾರಂಭಿಸಲು ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಾ?",
            "pricing":  "ನಮ್ಮ ಯೋಜನೆಗಳು ತುಂಬಾ ಸರಳವಾಗಿವೆ. ನಮ್ಮ ಅಮೆಜಾನ್ ತಜ್ಞರೊಂದಿಗೆ ಒಂದು ಕಾಲ್ ನಿಗದಿಪಡಿಸಲೇ?",
            "callback": "ಸಮಸ್ಯೆ ಇಲ್ಲ! ನಿಮಗೆ ಯಾವ ಸಮಯ ಅನುಕೂಲ? ನಾವು ಅದೇ ಸಮಯಕ್ಕೆ ಕರೆ ಮಾಡುತ್ತೇವೆ.",
            "close_yes":"ತುಂಬಾ ಸಂತೋಷ! ನಮ್ಮ ಅಮೆಜಾನ್ ತಂಡ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ. ಧನ್ಯವಾದಗಳು, ಹೋಗಿ ಬನ್ನಿ!",
            "close_no": "ಅರ್ಥವಾಯಿತು. ನಿಮ್ಮ ಅಮೂಲ್ಯ ಸಮಯಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ಶುಭ ದಿನ, ಹೋಗಿ ಬನ್ನಿ!",
        },
        "Urdu": {
            "greeting": "السلام علیکم! میں ایمیزون (Amazon) کی جانب سے بات کر رہی ہوں۔ ہم نے دیکھا کہ آپ نے حال ہی میں ہماری ویب سائٹ پر لاگ ان کیا تھا، کیا آپ مزید جاننا چاہتے ہیں؟",
            "pitch":    "ایمیزون آپ کے کاروبار کو لاکھوں صارفین تک پہنچانے میں مدد فراہم کرتا ہے۔ کیا آپ ہمارے ساتھ آغاز کرنے میں دلچسپی رکھتے ہیں؟",
            "pricing":  "ہمارے پاس بہت مناسب اور آسان پلانز ہیں۔ کیا میں ہمارے ایمیزون ایکسپرٹ کے ساتھ آپ کی کال شیڈول کر سکتی ہوں؟",
            "callback": "کوئی مسئلہ نہیں! آپ کے لیے کون سا وقت مناسب رہے گا؟ ہم اسی وقت کال کریں گے۔",
            "close_yes":"بہت خوب! میں آپ کی تفصیلات ہمارے آن بورڈنگ اسپیشلسٹ کو بھیج رہی ہوں۔ آپ کا وقت دینے کا شکریہ، خدا حافظ!",
            "close_no": "میں سمجھتی ہوں۔ آپ کے وقت کا بہت شکریہ۔ آپ کا دن اچھا گزرے، خدا حافظ!",
        },
        "Odia": {
            "greeting": "ନମସ୍କାର! ମୁଁ ଆମାଜନ (Amazon) ତରଫରୁ କହୁଛି। ଆପଣ ନିକଟରେ ଆମ ୱେବସାଇଟ୍ ପରିଦର୍ଶନ କରିଥିଲେ, ଆପଣ ଆମ ସେବା ବିଷୟରେ ଅଧିକ ଜାଣିବାକୁ ଚାହାଁନ୍ତି କି?",
            "pitch":    "ଆମାଜନ ସହିତ ଯୋଡି ହୋଇ ଆପଣ ଲକ୍ଷ ଲକ୍ଷ ଗ୍ରାହକଙ୍କ ନିକଟରେ ପହଞ୍ଚିପାରିବେ। ଆପଣ ଆରମ୍ଭ କରିବାକୁ ଆଗ୍ରହୀ କି?",
            "pricing":  "ଆମର ପ୍ୟାକେଜ୍ ବହୁତ ସୁବିଧାଜନକ। ଆପଣଙ୍କ ପାଇଁ ଆମ ବିଶେଷଜ୍ଞଙ୍କ ସହିତ ଏକ କଲ୍ ସିଡ୍ୟୁଲ୍ କରିବି କି?",
            "callback": "କୌଣସି ଅସୁବିଧା ନାହିଁ! ଆପଣଙ୍କ ପାଇଁ କେଉଁ ସମୟ ଭଲ ହେବ? ଆମେ ସେତେବେଳେ କଲ୍ କରିବୁ।",
            "close_yes":"ବହୁତ ଭଲ! ଆମ ଟିମ୍ ଖୁବ୍ ଶୀଘ୍ର ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବେ। ଧନ୍ୟବାଦ, ବିଦାୟ!",
            "close_no": "ବୁଝିପାରିଲି। ଆପଣଙ୍କ ସମୟ ପାଇଁ ଧନ୍ୟବାଦ। ଆପଣଙ୍କ ଦିନ ଶୁଭ ହେଉ, ବିଦାୟ!",
        },
        "Spanish": {
            "greeting": "¡Hola! Le llamo de parte de Amazon. Notamos que recientemente visitó e inició sesión en nuestro sitio web. ¿Le gustaría conocer más sobre nuestros servicios?",
            "pitch":    "Amazon ayuda a empresas y vendedores a escalar y llegar a millones de clientes. ¿Le interesa comenzar con nosotros?",
            "pricing":  "Nuestros planes son muy accesibles y flexibles. ¿Puedo programar una llamada con un especialista de Amazon para orientarle?",
            "callback": "¡Sin problema! ¿Qué horario le viene mejor? Le llamaremos exactamente en ese momento.",
            "close_yes":"¡Excelente! Pasaré sus datos a nuestro especialista de Amazon. ¡Muchas gracias por su tiempo, que tenga un excelente día!",
            "close_no": "Entiendo perfectamente. Muchas gracias por su tiempo hoy. ¡Hasta luego!",
        },
        "French": {
            "greeting": "Bonjour! Je vous appelle de la part d'Amazon. Nous avons remarqué que vous avez récemment visité notre site. Souhaitez-vous en savoir plus sur nos services?",
            "pitch":    "Amazon aide les entreprises et vendeurs à toucher des millions de clients. Seriez-vous intéressé à démarrer avec nous?",
            "pricing":  "Nos formules sont très avantageuses et flexibles. Puis-je planifier un court appel avec un spécialiste Amazon pour vous guider?",
            "callback": "Aucun problème! Quel moment vous conviendrait le mieux? Nous vous rappellerons à cette heure-là.",
            "close_yes":"Parfait! Je transmets vos coordonnées à notre spécialiste Amazon qui vous contactera rapidement. Merci et bonne journée!",
            "close_no": "C'est tout à fait compris. Merci pour votre temps. Bonne journée, au revoir!",
        },
        "German": {
            "greeting": "Guten Tag! Ich rufe im Namen von Amazon an. Wir haben bemerkt, dass Sie vor kurzem unsere Website besucht haben. Möchten Sie mehr über unsere Services erfahren?",
            "pitch":    "Amazon unterstützt Unternehmen und Händler dabei, Millionen von Kunden zu erreichen. Hätten Sie Interesse, mit uns zu starten?",
            "pricing":  "Unsere Pläne sind flexibel und maßgeschneidert. Darf ich ein kurzes Telefonat mit einem Amazon-Spezialisten für Sie einplanen?",
            "callback": "Kein Problem! Welche Uhrzeit passt Ihnen am besten? Wir rufen Sie gerne zu diesem Zeitpunkt zurück.",
            "close_yes":"Wunderbar! Ich leite Ihre Daten an unseren Amazon-Experten weiter. Vielen Dank für Ihre Zeit, auf Wiederhören!",
            "close_no": "Vollkommen verständlich. Vielen Dank für Ihre Zeit und einen schönen Tag, auf Wiederhören!",
        },
        "Arabic": {
            "greeting": "مرحباً! أتصل بكم نيابة عن أمازون (Amazon). لاحظنا زيارتكم وتسجيل دخولكم لموقعنا مؤخراً، هل تودون معرفة المزيد عن خدماتنا؟",
            "pitch":    "تساعد أمازون التجار والشركات في الوصول إلى ملايين العملاء بسهولة. هل يهمكم البدء معنا؟",
            "pricing":  "خططنا مرنة ومناسبة للغاية. هل يمكنني جدولة مكالمة مع أخصائي أمازون لمساعدتكم؟",
            "callback": "لا مشكلة على الإطلاق! ما هو الوقت الأنسب لكم لنعاود الاتصال بكم؟",
            "close_yes":"رائع جداً! سأقوم بتحويل بياناتكم إلى مسؤول أمازون للتواصل معكم قريباً. شكراً لوقتكم ومع السلامة!",
            "close_no": "أتفهم ذلك تماماً. شكراً جزيلاً لوقتكم ونتمنى لكم يوماً سعيداً!",
        },
    }

    def _groq_chat(self, messages: list, max_tokens: int = 150, temperature: float = 0.7) -> str:
        """Calls Groq REST API directly via requests — no openai package needed."""
        import requests as req
        try:
            resp = req.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=15
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            else:
                print(f"[Groq] API error {resp.status_code}: {resp.text[:200]}")
                return ""
        except Exception as e:
            print(f"[Groq] Request failed: {e}")
            return ""

    def get_voice_agent_response(
        self,
        chat_history: List[Dict[str, str]],
        language: str,
        company_info: str = "",
        company_name: str = "ABC Digital Solutions",
        service_name: str = "Website Development",
        service_description: str = "",
        qualification_questions: str = "",
        customer_name: str = "Customer",
        ai_instructions: str = ""
    ) -> str:
        """
        Generates the next AI voice agent reply.
        Uses Groq Llama 3.3-70B when GROQ_API_KEY is set,
        otherwise uses built-in multi-turn dynamic fallback.
        """
        if self.enabled:
            system_prompt = (
                f"You are a professional, polite, and friendly AI outbound sales calling assistant from {company_name}.\n"
                f"You are speaking with {customer_name}.\n"
                f"Company & Service Overview: {company_info or company_name}.\n"
                f"Primary Service Offered: {service_name}. {service_description}\n"
                f"Qualification Questions to naturally ask during the conversation:\n{qualification_questions or 'Are you looking for this service? When do you plan to start?'}\n"
                f"Specific Behavior Instructions: {ai_instructions or 'Be friendly, concise, and helpful.'}\n"
                f"Goal:\n"
                f"1. Introduce yourself warmly from {company_name}.\n"
                f"2. Explain your service ({service_name}) concisely.\n"
                f"3. Have a dynamic, natural conversation with {customer_name} instead of reciting a robotic script.\n"
                f"4. Understand the customer's answers and ask relevant qualification questions.\n"
                f"5. Identify their requirements, timeline, and whether they want a follow-up consultation.\n"
                f"Reply ONLY in {language} using its native script.\n"
                f"Keep each reply CONCISE — 1 to 2 sentences maximum for realistic spoken audio dialogue.\n"
                f"If the customer says they are not interested, thank them politely and close the call gracefully."
            )
            messages = [{"role": "system", "content": system_prompt}] + chat_history
            reply = self._groq_chat(messages, max_tokens=120, temperature=0.7)
            if reply:
                return reply
            print("[OpenAIService] Groq returned empty reply. Using fallback.")

        return self._fallback_reply(
            chat_history=chat_history,
            language=language,
            company_name=company_name,
            service_name=service_name,
            customer_name=customer_name
        )

    def synthesize_speech(self, text: str, language_code: str) -> str:
        return ""

    def analyze_completed_call(
        self,
        chat_history: List[Dict[str, str]],
        language: str,
        company_name: str = "Our Company",
        service_name: str = "Our Service"
    ) -> Dict[str, Any]:
        """
        Analyses the call transcript and outputs structured lead qualification data.
        Classifies interest into HIGH, MEDIUM, LOW, NOT_INTERESTED, CALL_BACK.
        Extracts service required, requirements, timeline, and follow-up necessity.
        """
        transcript_text = "\n".join(
            [f"{m['role'].upper()}: {m['content']}" for m in chat_history]
        )

        if self.enabled:
            prompt = (
                f"Analyze the following sales call transcript between an AI caller representing {company_name} and a prospect.\n"
                "Return a single, strictly valid JSON object with the following fields:\n"
                "- interest_level: exactly one of [\"HIGH\", \"MEDIUM\", \"LOW\", \"NOT_INTERESTED\", \"CALL_BACK\"].\n"
                "- service_required: specific service or package the customer inquired about, or null.\n"
                "- customer_requirement: specific needs, features, or details mentioned by customer, or null.\n"
                "- timeline: implementation timeline mentioned (e.g. \"Next month\", \"Immediate\", \"Next quarter\") or null.\n"
                "- follow_up_required: boolean true if customer is interested or requested callback, false otherwise.\n"
                "- preferred_callback_time: string date/time if requested, or null.\n"
                "- summary: concise 1-2 sentence executive summary of conversation outcome.\n"
                "- lead_score: integer 0-100 (HIGH: 75-100, MEDIUM/CALL_BACK: 40-74, LOW/NOT_INTERESTED: 0-39).\n"
                "- sentiment: exactly one of [\"Positive\", \"Neutral\", \"Negative\"].\n"
                "- language_used: primary language spoken by customer.\n"
                "- ai_notes: actionable next steps for the human sales team.\n\n"
                "Output ONLY valid JSON without markdown formatting or code blocks.\n\n"
                f"Transcript:\n{transcript_text}"
            )
            raw = self._groq_chat(
                [{"role": "user", "content": prompt}],
                max_tokens=450,
                temperature=0.2
            )
            if raw:
                try:
                    cleaned_raw = raw.strip()
                    if cleaned_raw.startswith("```"):
                        lines = cleaned_raw.split("\n")
                        cleaned_raw = "\n".join(lines[1:-1])
                    data = json.loads(cleaned_raw)
                    data["transcript"] = transcript_text
                    
                    # Backward compatibility mapping for interest_status
                    lvl = data.get("interest_level", "LOW").upper()
                    if lvl == "HIGH":
                        data["interest_status"] = "Interested"
                    elif lvl in ["MEDIUM", "CALL_BACK"]:
                        data["interest_status"] = "Maybe Interested"
                    else:
                        data["interest_status"] = "Not Interested"

                    return data
                except Exception as e:
                    print(f"[OpenAIService] JSON parse error: {e}. Falling back to structured heuristic analyzer.")

        # ── Smart Structured Fallback Analyzer ─────────────────────────────
        # Filter strictly for prospect/user statements so assistant prompts don't cross-contaminate
        user_statements = [
            m.get("content", "") for m in chat_history
            if m.get("role", "").lower() in ["user", "customer"]
        ]
        user_lower = " ".join(user_statements).lower() if user_statements else transcript_text.lower()

        not_interested_words = [
            "not interested", "no thanks", "don't call", "stop", "remove", "never", "cancel",
            "నో", "నాకు అవసరం లేదు", "వద్దు", "లేదు",
            "नहीं", "रुचि नहीं", "कॉल मत", "न करें", "नहीं चाहिए",
            "வேண்டாம்", "ಬೇಡ"
        ]
        interested_words = [
            "interested", "yes", "sure", "great", "want", "sounds good", "pricing",
            "tell me more", "cost", "price", "start", "quote", "proposal", "need",
            "అవును", "ఆసక్తి", "ధర", "ఖర్చు", "ప్రారంభించాలనుకుంటున్నాను", "కావాలి",
            "हाँ", "रुचि", "कीमत", "शुरू", "चाहिए", "बताइए",
            "சரி", "ஹೌదు"
        ]
        callback_words = [
            "call back", "later", "tomorrow", "busy", "another time", "evening", "next week",
            "తర్వాత", "తరువాత", "రేపు", "బిజీ",
            "बाद में", "कल", "व्यस्त", "फुर्सत",
            "பிறகு", "ನಂತರ"
        ]

        has_not_interested = any(w in user_lower for w in not_interested_words)
        has_callback = any(w in user_lower for w in callback_words)
        has_interested = any(w in user_lower for w in interested_words)

        # Rejection explicitly trumps anything else
        if has_not_interested:
            interest_level = "NOT_INTERESTED"
            interest_status = "Not Interested"
            score = random.randint(10, 30)
            sentiment = "Negative"
            follow_up = False
            summary = f"Customer was contacted regarding {service_name} but explicitly stated they are not interested."
            ai_notes = "Do not contact again. Marked as opt-out."
            callback_time = None
            req = None
            timeline = None

        elif has_callback and not has_interested:
            interest_level = "CALL_BACK"
            interest_status = "Maybe Interested"
            score = random.randint(55, 74)
            sentiment = "Neutral"
            follow_up = True
            callback_time = "Tomorrow" if any(w in user_lower for w in ["tomorrow", "రేపు", "कल"]) else "Later this week"
            summary = f"Customer expressed potential interest in {service_name} and requested a callback at {callback_time}."
            ai_notes = f"Follow up by phone call at {callback_time}."
            req = "Requested callback to discuss details"
            timeline = "Planning phase"

        elif has_interested:
            interest_level = "HIGH"
            interest_status = "Interested"
            score = random.randint(80, 96)
            sentiment = "Positive"
            follow_up = True
            callback_time = "Tomorrow 11 AM" if any(w in user_lower for w in ["tomorrow", "రేపు", "कल"]) else "Within 24-48 hours"
            req = f"Customer interested in {service_name} pricing and specifications"
            timeline = "Next month" if any(w in user_lower for w in ["next month", "వచ్చే నెల", "अगले महीने"]) else "Within next 2-4 weeks"
            summary = f"Customer is highly interested in {service_name} and requested follow-up on pricing and schedule."
            ai_notes = "Hot lead! Prioritize sales call follow-up immediately."

        else:
            interest_level = "MEDIUM"
            interest_status = "Maybe Interested"
            score = random.randint(45, 65)
            sentiment = "Neutral"
            follow_up = True
            callback_time = None
            req = "General service information requested"
            timeline = "Exploring options"
            summary = f"Customer engaged in discussion regarding {service_name} and showed moderate interest."
            ai_notes = "Send introductory portfolio/brochure and check back in a few days."

        return {
            "transcript": transcript_text,
            "summary": summary,
            "interest_level": interest_level,
            "interest_status": interest_status,
            "service_required": service_name,
            "customer_requirement": req,
            "timeline": timeline,
            "follow_up_required": follow_up,
            "preferred_callback_time": callback_time,
            "lead_score": score,
            "sentiment": sentiment,
            "language_used": language,
            "ai_notes": ai_notes
        }

    def _fallback_reply(
        self,
        chat_history: List[Dict[str, str]],
        language: str,
        company_name: str = "ABC Digital Solutions",
        service_name: str = "Website Development",
        customer_name: str = "there"
    ) -> str:
        """
        Multi-turn fallback conversation when Groq API key is not set.
        Handles a natural 4-5 turn flow: greeting → pitch → handle objection/price → close.
        """
        lang = language if language in self._FALLBACK_TURNS else "English"
        turns = self._FALLBACK_TURNS[lang]

        user_msgs = [m["content"].lower() for m in chat_history if m["role"] == "user"]
        assistant_count = sum(1 for m in chat_history if m["role"] == "assistant")

        # Dynamic replacement helper for localized fallbacks
        def format_text(txt: str) -> str:
            res = txt.replace("Amazon", company_name).replace("अमेज़न (Amazon)", company_name).replace("అమెజాన్ (Amazon)", company_name)
            if customer_name and customer_name != "Customer":
                if lang == "English":
                    res = res.replace("Hello!", f"Hello {customer_name}!")
                elif lang == "Telugu":
                    res = res.replace("నమస్కారం!", f"నమస్కారం {customer_name} గారు!")
                elif lang == "Hindi":
                    res = res.replace("नमस्ते!", f"नमस्ते {customer_name} जी!")
            return res

        # No user messages yet — send greeting
        if not user_msgs:
            return format_text(turns["greeting"])

        last = user_msgs[-1]

        positive = ["yes", "yeah", "ok", "sure", "interested", "want", "good", "great", "fine",
                    "tell me", "more", "అవును", "ఆసక్తి", "सरे", "हाँ", "हा", "சரி", "ಹೌದು"]
        negative = ["no", "not", "don't", "busy", "later", "stop", "uninterested",
                    "வேண்டாம்", "ಬೇಡ", "నో", "नहीं"]
        price_words = ["price", "cost", "how much", "pricing", "package", "rate",
                       "ధర", "ఎంత", "कीमत", "விலை", "ಬೆಲೆ"]
        callback_words = ["later", "busy", "call back", "another time", "tomorrow",
                          "తర్వాత", "తరువాత", "बाद में", "பிறகு", "ನಂತರ"]

        is_positive  = any(w in last for w in positive)
        is_negative  = any(w in last for w in negative)
        is_price     = any(w in last for w in price_words)
        is_callback  = any(w in last for w in callback_words)

        # First user reply
        if assistant_count == 1:
            if is_price:
                return turns["pricing"]
            if is_negative or is_callback:
                return turns["callback"]
            return turns["pitch"]

        # Second user reply
        if assistant_count == 2:
            if is_price:
                return turns["pricing"]
            if is_positive:
                return turns["close_yes"]
            if is_negative:
                return turns["close_no"]
            return turns["pricing"]

        # Third+ user reply
        if is_positive:
            return turns["close_yes"]
        if is_negative or is_callback:
            return turns["close_no"]
        # Default to closing
        return turns["close_yes"]



