import requests
from typing import Dict, Any

class CRMService:
    @staticmethod
    def sync_qualified_lead(lead_details: Dict[str, Any], webhook_url: str) -> bool:
        """
        Sends qualified lead credentials to a target CRM webhook endpoint.
        """
        if not webhook_url:
            return False
            
        payload = {
            "source": "AI Voice Calling Platform",
            "timestamp": lead_details.get("timestamp"),
            "lead": {
                "name": lead_details.get("name"),
                "phone": lead_details.get("mobile"),
                "company": lead_details.get("company_name", "N/A"),
                "language": lead_details.get("preferred_language"),
                "status": "Qualified - Hot Lead",
            },
            "call_analysis": {
                "transcript": lead_details.get("transcript"),
                "summary": lead_details.get("summary"),
                "score": lead_details.get("lead_score"),
                "sentiment": lead_details.get("sentiment"),
                "callback_time": lead_details.get("preferred_callback_time"),
                "ai_notes": lead_details.get("ai_notes")
            }
        }
        
        try:
            # POST request to CRM Webhook
            response = requests.post(webhook_url, json=payload, timeout=5)
            return response.status_code in [200, 201]
        except Exception:
            return False

    @staticmethod
    def format_for_salesforce(lead_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Helper representing standard Salesforce Lead Object format.
        """
        return {
            "LastName": lead_details.get("name"),
            "Phone": lead_details.get("mobile"),
            "Company": lead_details.get("company_name", "N/A"),
            "LeadSource": "AI Voice Calling",
            "Description": f"Summary: {lead_details.get('summary')}\nLead Score: {lead_details.get('lead_score')}",
            "Status": "Working - Contacted"
        }

    @staticmethod
    def format_for_zoho(lead_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Helper representing standard Zoho CRM Leads format.
        """
        return {
            "Last_Name": lead_details.get("name"),
            "Phone": lead_details.get("mobile"),
            "Company": lead_details.get("company_name", "N/A"),
            "Lead_Source": "AI Voice Call Engine",
            "Description": lead_details.get("summary"),
            "Lead_Status": "Pre-Qualified"
        }
