import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


def _get_smtp_config() -> dict:
    """
    Reads SMTP credentials from environment variables.
    Falls back to DB-stored smtp_* settings if env vars are blank,
    so the user can configure email from the Settings UI without
    touching the .env file.
    """
    config = {
        "host":     os.getenv("SMTP_HOST", "").strip(),
        "port":     int(os.getenv("SMTP_PORT", "587")),
        "user":     os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "").strip(),
        "from":     os.getenv("SMTP_FROM", "").strip(),
    }

    # If env vars are missing, try the DB-stored settings
    if not config["host"] or not config["user"] or not config["password"]:
        try:
            from app.database import SessionLocal
            from app.models.models import Setting
            db = SessionLocal()
            try:
                keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from"]
                rows = {
                    row.key: row.value
                    for row in db.query(Setting).filter(Setting.key.in_(keys)).all()
                }
                if rows.get("smtp_host"):
                    config["host"]     = rows.get("smtp_host", config["host"])
                    config["port"]     = int(rows.get("smtp_port", config["port"]))
                    config["user"]     = rows.get("smtp_user", config["user"])
                    config["password"] = rows.get("smtp_password", config["password"])
                    config["from"]     = rows.get("smtp_from", config["from"]) or config["user"]
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"[EmailService] Could not read SMTP settings from DB: {e}")

    # Default from address to user if still blank
    if not config["from"] and config["user"]:
        config["from"] = config["user"]

    return config


def _build_html(
    customer_name: str,
    mobile: str,
    company: str,
    language: str,
    lead_score: int,
    sentiment: str,
    summary: str,
    callback_time: Optional[str],
    ai_notes: Optional[str],
    transcript: Optional[str],
) -> str:
    """Returns a nicely formatted HTML email body."""

    score_color = "#10b981" if lead_score >= 75 else "#f59e0b" if lead_score >= 40 else "#ef4444"
    callback_row = f"""
        <tr>
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Callback Time</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;font-weight:600;">
            {callback_time}
          </td>
        </tr>""" if callback_time else ""

    transcript_section = ""
    if transcript:
        lines = transcript.strip().split("\n")
        bubbles = ""
        for line in lines:
            if ":" in line:
                parts = line.split(":", 1)
                role = parts[0].strip().upper()
                content = parts[1].strip()
                bg = "#1e293b" if role in ("ASSISTANT", "AGENT") else "#7c3aed"
                label = "AI Agent" if role in ("ASSISTANT", "AGENT") else "Customer"
                bubbles += f"""
                <div style="margin-bottom:10px;">
                  <div style="font-size:9px;color:#94a3b8;margin-bottom:3px;text-transform:uppercase;
                              letter-spacing:0.05em;">{label}</div>
                  <div style="background:{bg};color:#f1f5f9;padding:10px 14px;border-radius:10px;
                              font-size:12px;line-height:1.5;max-width:90%;display:inline-block;">
                    {content}
                  </div>
                </div>"""
        transcript_section = f"""
        <div style="margin-top:28px;">
          <h3 style="font-size:13px;color:#8b5cf6;margin-bottom:14px;
                     text-transform:uppercase;letter-spacing:0.05em;">
            Conversation Transcript
          </h3>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;
                      padding:16px;max-height:400px;overflow:auto;">
            {bubbles}
          </div>
        </div>"""

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:640px;margin:32px auto;background:#1e293b;border-radius:16px;
              border:1px solid #334155;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;">
      <div style="font-size:11px;color:#c4b5fd;text-transform:uppercase;
                  letter-spacing:0.08em;margin-bottom:6px;">
        AI Lead Qualifier — Hot Lead Alert
      </div>
      <h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700;">
        🚨 New Qualified Lead Detected
      </h1>
      <p style="margin:6px 0 0;color:#ddd6fe;font-size:13px;">
        A prospect just expressed genuine interest during an AI call.
      </p>
    </div>

    <!-- Lead Details -->
    <div style="padding:28px 32px;">
      <h2 style="font-size:13px;color:#8b5cf6;text-transform:uppercase;
                 letter-spacing:0.05em;margin:0 0 14px;">Lead Details</h2>
      <table style="width:100%;border-collapse:collapse;background:#0f172a;
                    border-radius:10px;overflow:hidden;">
        <tr style="background:#1e293b;">
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Name</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;font-weight:600;">
            {customer_name}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Mobile</td>
          <td style="padding:8px 12px;font-size:12px;">
            <a href="tel:{mobile}" style="color:#818cf8;text-decoration:none;font-weight:600;">
              {mobile}
            </a>
          </td>
        </tr>
        <tr style="background:#1e293b;">
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Company</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;">{company}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Language</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;">{language}</td>
        </tr>
        <tr style="background:#1e293b;">
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Lead Score</td>
          <td style="padding:8px 12px;font-size:14px;font-weight:700;color:{score_color};">
            {lead_score} / 100
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;color:#94a3b8;font-size:12px;">Sentiment</td>
          <td style="padding:8px 12px;color:#f1f5f9;font-size:12px;">{sentiment}</td>
        </tr>
        {callback_row}
      </table>

      <!-- Summary -->
      <div style="margin-top:24px;">
        <h3 style="font-size:13px;color:#8b5cf6;margin-bottom:10px;
                   text-transform:uppercase;letter-spacing:0.05em;">AI Summary</h3>
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;
                    padding:14px 16px;font-size:12px;color:#cbd5e1;line-height:1.6;">
          {summary or "No summary generated."}
        </div>
      </div>

      <!-- AI Notes -->
      {f'''
      <div style="margin-top:20px;">
        <h3 style="font-size:13px;color:#8b5cf6;margin-bottom:10px;
                   text-transform:uppercase;letter-spacing:0.05em;">Action Items</h3>
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;
                    padding:14px 16px;font-size:12px;color:#cbd5e1;line-height:1.6;">
          {ai_notes}
        </div>
      </div>''' if ai_notes else ""}

      {transcript_section}

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center;">
        <a href="tel:{mobile}"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);
                  color:#ffffff;padding:13px 32px;border-radius:10px;font-size:13px;
                  font-weight:700;text-decoration:none;letter-spacing:0.03em;">
          📞 Call This Lead Now
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:16px 32px;text-align:center;
                border-top:1px solid #1e293b;">
      <p style="margin:0;font-size:10px;color:#475569;">
        This alert was sent automatically by the AI Lead Qualifier platform.<br>
        The lead was qualified during a live AI outbound call.
      </p>
    </div>
  </div>
</body>
</html>"""


def send_lead_alert(
    to_email: str,
    customer_name: str,
    mobile: str,
    company: str,
    language: str,
    lead_score: int,
    sentiment: str,
    summary: str,
    callback_time: Optional[str] = None,
    ai_notes: Optional[str] = None,
    transcript: Optional[str] = None,
) -> bool:
    """
    Sends a rich HTML email alert to the sales manager when a lead is
    marked 'Interested'. Returns True on success, False on any failure.

    SMTP credentials are read from environment variables first, then from
    the DB smtp_* settings (configured on the Settings page).
    """
    if not to_email or not to_email.strip():
        logger.info("[EmailService] No alert_email configured — skipping email alert.")
        return False

    cfg = _get_smtp_config()

    if not cfg["host"] or not cfg["user"] or not cfg["password"]:
        logger.warning(
            "[EmailService] SMTP not configured (missing SMTP_HOST / SMTP_USER / SMTP_PASSWORD). "
            "Set these in .env or on the Settings page to enable email alerts."
        )
        return False

    subject = f"🚨 Hot Lead: {customer_name} ({mobile}) — Score {lead_score}/100"

    html_body = _build_html(
        customer_name=customer_name,
        mobile=mobile,
        company=company or "N/A",
        language=language,
        lead_score=lead_score,
        sentiment=sentiment,
        summary=summary,
        callback_time=callback_time,
        ai_notes=ai_notes,
        transcript=transcript,
    )

    # Plain-text fallback for email clients that don't render HTML
    plain_body = (
        f"HOT LEAD QUALIFIED\n\n"
        f"Name:        {customer_name}\n"
        f"Mobile:      {mobile}\n"
        f"Company:     {company or 'N/A'}\n"
        f"Language:    {language}\n"
        f"Lead Score:  {lead_score}/100\n"
        f"Sentiment:   {sentiment}\n"
        f"Callback:    {callback_time or 'Not requested'}\n\n"
        f"Summary:\n{summary or 'N/A'}\n\n"
        f"Action Items:\n{ai_notes or 'N/A'}\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = cfg["from"]
    msg["To"]      = to_email.strip()
    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body,  "html",  "utf-8"))

    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg["user"], cfg["password"])
            server.sendmail(cfg["from"], to_email.strip(), msg.as_string())

        logger.info(f"[EmailService] Hot lead alert sent to {to_email} for {customer_name} ({mobile})")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error(
            "[EmailService] SMTP authentication failed. "
            "For Gmail, use an App Password (not your account password): "
            "https://myaccount.google.com/apppasswords"
        )
        return False
    except smtplib.SMTPException as e:
        logger.error(f"[EmailService] SMTP error sending alert: {e}")
        return False
    except Exception as e:
        logger.error(f"[EmailService] Unexpected error sending email alert: {e}")
        return False
