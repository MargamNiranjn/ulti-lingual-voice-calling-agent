import os
import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class BolnaService:
    """
    Service adapter for Bolna AI Voice Calling Engine (bolna-ai/bolna).
    Supports both Bolna Hosted API (https://api.bolna.dev) and local self-hosted engine.
    """
    DEFAULT_BASE_URL = "https://api.bolna.dev"

    def __init__(self):
        self.api_key = os.getenv("BOLNA_API_KEY", "").strip()
        self.agent_id = os.getenv("BOLNA_AGENT_ID", "").strip()
        self.base_url = os.getenv("BOLNA_SERVER_URL", "").strip() or self.DEFAULT_BASE_URL
        # Configured if agent_id is provided or api_key is available
        self.configured = bool(self.agent_id or self.api_key)

    @property
    def headers(self) -> Dict[str, str]:
        h = {"Content-Type": "application/json"}
        if self.api_key:
            h["Authorization"] = f"Bearer {self.api_key}"
        return h

    def create_or_update_agent(
        self,
        company_name: str,
        service_name: str,
        service_description: str,
        qualification_questions: str,
        language: str = "en"
    ) -> Optional[str]:
        """
        Creates a new Bolna Voice Agent configured with company pitch,
        target language, and qualification prompts.
        """
        prompt = (
            f"You are a friendly, highly professional sales calling agent from {company_name}.\n"
            f"Your service: {service_name}. {service_description}\n"
            f"Questions to ask:\n{qualification_questions}\n"
            f"Converse naturally in {language}. Qualify their requirements and timeline."
        )

        agent_payload = {
            "agent_config": {
                "agent_name": f"{company_name} Lead Qualifier",
                "agent_type": "sales",
                "tasks": [
                    {
                        "task_type": "conversation",
                        "toolchain": {
                            "execution": "parallel",
                            "pipelines": [["transcriber", "llm", "synthesizer"]]
                        },
                        "tools_config": {
                            "input": {"format": "wav", "provider": "twilio"},
                            "output": {"format": "wav", "provider": "twilio"},
                            "transcriber": {
                                "encoding": "linear16",
                                "language": "te" if language == "Telugu" else ("hi" if language == "Hindi" else "en"),
                                "provider": "deepgram",
                                "stream": True
                            },
                            "llm_agent": {
                                "agent_type": "simple_llm_agent",
                                "agent_flow_type": "streaming",
                                "llm_config": {
                                    "provider": "openai",
                                    "model": "gpt-4o-mini",
                                    "temperature": 0.3
                                }
                            },
                            "synthesizer": {
                                "audio_format": "wav",
                                "provider": "elevenlabs",
                                "stream": True,
                                "provider_config": {
                                    "voice": "George",
                                    "model": "eleven_turbo_v2_5"
                                }
                            }
                        }
                    }
                ],
                "agent_welcome_message": f"Hello! I am calling on behalf of {company_name} regarding {service_name}."
            },
            "agent_prompts": {
                "task_1": {
                    "system_prompt": prompt
                }
            }
        }

        try:
            resp = requests.post(
                f"{self.base_url.rstrip('/')}/agent",
                json=agent_payload,
                headers=self.headers,
                timeout=15
            )
            if resp.status_code in [200, 201]:
                data = resp.json()
                self.agent_id = data.get("agent_id")
                logger.info(f"[Bolna] Successfully created voice agent: {self.agent_id}")
                return self.agent_id
            else:
                logger.error(f"[Bolna] Failed to create agent ({resp.status_code}): {resp.text}")
                return None
        except Exception as e:
            logger.error(f"[Bolna] Agent creation request failed: {e}")
            return None

    def place_outbound_call(
        self,
        recipient_phone: str,
        customer_name: Optional[str] = None,
        preferred_language: str = "English",
        company_name: Optional[str] = None,
        service_name: Optional[str] = None,
        service_description: Optional[str] = None,
        qualification_questions: Optional[str] = None,
        call_id: Optional[str] = None,
        webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiates an outbound voice call via Bolna engine.
        Dispatches telephony connection through Twilio.
        """
        clean_number = recipient_phone.strip()
        if not clean_number.startswith("+"):
            digits = "".join(filter(str.isdigit, clean_number))
            clean_number = f"+91{digits}" if len(digits) == 10 else f"+{digits}"

        # If not configured, gracefully return simulated status
        if not self.configured:
            return {
                "status": "simulated",
                "sid": f"bolna-sim-{call_id or clean_number}",
                "message": "Bolna credentials/agent not configured. Running in simulated mode."
            }

        payload: Dict[str, Any] = {
            "agent_id": self.agent_id,
            "recipient_phone_number": clean_number,
            "user_data": {
                "customer_name": customer_name or "Customer",
                "preferred_language": preferred_language,
                "company_name": company_name or "Our Company",
                "service_name": service_name or "Our Services",
                "service_description": service_description or "",
                "qualification_questions": qualification_questions or "",
                "call_id": str(call_id or "")
            }
        }

        if webhook_url:
            payload["webhook_url"] = webhook_url

        try:
            logger.info(f"[Bolna] Dispatching outbound call to {clean_number} (Language: {preferred_language})")
            resp = requests.post(
                f"{self.base_url.rstrip('/')}/call",
                json=payload,
                headers=self.headers,
                timeout=15
            )

            if resp.status_code in [200, 201]:
                data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                call_sid = data.get("call_id") or data.get("sid") or f"bolna-{call_id or clean_number}"
                logger.info(f"[Bolna] Outbound call placed successfully: {call_sid}")
                return {
                    "status": "success",
                    "sid": call_sid,
                    "provider": "bolna",
                    "data": data
                }
            else:
                logger.error(f"[Bolna] API error {resp.status_code}: {resp.text}")
                return {
                    "status": "failed",
                    "sid": None,
                    "reason": f"Bolna API Error ({resp.status_code}): {resp.text[:200]}"
                }
        except Exception as e:
            logger.error(f"[Bolna] Call request error: {e}")
            return {
                "status": "failed",
                "sid": None,
                "reason": f"Bolna connection failed: {str(e)}"
            }
