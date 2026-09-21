"""WhatsApp reminders for the eve of each visit.

Two layers:
1. Automatic — if Twilio credentials are set in .env (TWILIO_ACCOUNT_SID,
   TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM), a background loop sends the reminder
   to every pendente client whose visit is tomorrow, then marks it sent.
2. Manual fallback — the dashboard lists tomorrow's visits with a pre-filled
   wa.me link (same fixed template), so the owner sends with one click even
   without Twilio configured.

Message bodies are fixed server-side templates; only appointment fields are
interpolated (never user-supplied markup).
"""

import asyncio
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import httpx

from lib.db import db
from lib.dates import format_date_br, tomorrow_iso

logger = logging.getLogger(__name__)

_TWILIO_API = "https://api.twilio.com/2010-04-01"
_REMINDER_INTERVAL_SECONDS = 15 * 60
_MAX_ATTEMPTS = 3

_TWILIO_ENV_KEYS = ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM")


def is_configured() -> bool:
    return all(os.environ.get(key) for key in _TWILIO_ENV_KEYS)


def client_e164(numero: str) -> str:
    """Stored digits (DDD + number) -> +55 E.164 for the WhatsApp API."""
    digits = re.sub(r"\D", "", numero)
    return "+55" + digits


def reminder_message(nome: str, servico: str, data: str, periodo: str | None) -> str:
    when = format_date_br(data) + (f", no período {periodo}" if periodo else "")
    return (
        f"Olá, {nome.split(' ')[0]}! Passando para lembrar da sua visita da JS Climatização "
        f"amanhã ({when}), para o serviço de {servico}. Se precisar remarcar ou tiver alguma "
        f"dúvida, responda esta mensagem. Até logo!"
    )


def wa_me_link(numero: str, message: str) -> str:
    """Pre-filled, click-to-send WhatsApp link (manual fallback / owner quick-send)."""
    digits = re.sub(r"\D", "", numero)
    return f"https://wa.me/55{digits}?text={quote(message)}"


async def _send_whatsapp(to_e164: str, body: str) -> bool:
    sid = os.environ["TWILIO_ACCOUNT_SID"]
    token = os.environ["TWILIO_AUTH_TOKEN"]
    from_number = os.environ["TWILIO_WHATSAPP_FROM"]
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{_TWILIO_API}/Accounts/{sid}/Messages.json",
                auth=(sid, token),
                data={
                    "From": f"whatsapp:{from_number}",
                    "To": f"whatsapp:{to_e164}",
                    "Body": body,
                },
            )
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.error("WhatsApp send failed to %s: %s", to_e164, exc)
        return False


async def send_due_reminders() -> int:
    """Send reminders for tomorrow's pendente visits. Returns how many were sent."""
    if not is_configured():
        logger.info("WhatsApp reminders skipped: Twilio not configured (painel quick-links still work)")
        return 0
    query = {
        "data": tomorrow_iso(),
        "status": "pendente",
        "reminder_sent": {"$ne": True},
        "reminder_attempts": {"$lt": _MAX_ATTEMPTS},
    }
    docs = await db.appointments.find(query).to_list(100)
    sent = 0
    for doc in docs:
        body = reminder_message(doc["nome"], doc["servico"], doc["data"], doc.get("periodo"))
        ok = await _send_whatsapp(client_e164(doc["numero"]), body)
        update: dict = {"$inc": {"reminder_attempts": 1}}
        if ok:
            update["$set"] = {
                "reminder_sent": True,
                "reminder_sent_at": datetime.now(timezone.utc),
            }
        await db.appointments.update_one({"id": doc["id"]}, update)
        if ok:
            sent += 1
    if sent:
        logger.info("WhatsApp reminders sent: %s", sent)
    return sent


async def reminder_loop() -> None:
    """Background loop — one cycle every 15 minutes, resilient to any error."""
    while True:
        try:
            await send_due_reminders()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Reminder cycle failed (will retry)")
        await asyncio.sleep(_REMINDER_INTERVAL_SECONDS)
