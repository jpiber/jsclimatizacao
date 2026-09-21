"""Emergent managed email (Resend proxy) — owner notifications.

The sender address is owned by the platform; the visible sender name comes from
EMAIL_FROM_NAME (this app's own brand). Recipients and bodies are always
server-side values: the new-booking alert goes to OWNER_EMAIL from .env through a
fixed template with escaped interpolation — never caller-supplied markup (G4).
"""

import ipaddress
import logging
import os
import re
from datetime import datetime, timezone
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

from lib.dates import format_date_br

logger = logging.getLogger(__name__)

# Emergent managed email proxy. Constant on purpose — survives deployment.
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "JS Climatização")

# The booking form is public, so cap owner alerts as a light abuse guard.
_MAX_ALERTS_PER_HOUR = 10
_alert_timestamps: list[datetime] = []

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")  # G2 ask-back phrasing
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)   # host-looking text


def _host_ok(host: str) -> bool:
    """Reject empty, punycode, IP-literal (v4 AND v6), and shortener hosts.
    Shorteners match a full label (host == s or host.endswith('.'+s)) — substring
    matching would wrongly flag legit domains like contact.com or
    product.company.com (both contain 't.co')."""
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)     # any IPv4 or IPv6 literal (incl. [::1])
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    """Share a registrable domain by label-boundary suffix, so 'acme.com' shown /
    'www.acme.com' real is fine but 'paypal.com' / 'paypal.com.evil.ru' is not."""
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    """Real parsing, not regex: catches unquoted attrs, and collects each anchor's
    DECODED visible text (convert_charrefs resolves paypal&#46;com -> paypal.com and
    joins comment-split text) so misleading anchor text can't hide behind entities."""
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    """Best-effort structural check for G2 + G3 (defense in depth, NOT G1). The
    form/input and link-hygiene blocks are reliable; the credential-phrase scan is a
    tripwire, not exhaustive. If a legitimate email trips this, rewrite the copy —
    never weaken, wrap in try/except, or delete it."""
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:                      # every href AND src
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):     # also kills javascript:, data:, relative
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:            # decoded visible text vs the real host
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):      # EVERY host-like token, not just the first
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> str | None:
    """Send through the managed proxy. Returns the provider message id, or None on
    failure (logged, never raised — background callers must not crash)."""
    _assert_safe_email(subject, html)          # G2-G3 gate — never skip
    if not EMAIL_KEY:
        logger.error("Email send skipped: EMERGENT_EMAIL_KEY not configured")
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error("Email send failed: %s %s", e.response.status_code, e.response.text)
        return None
    except Exception as e:
        logger.error("Email send error: %s", str(e))
        return None


def _appointment_alert_html(
    nome: str,
    servico: str,
    data: str,
    periodo: str | None,
    endereco: str,
    numero: str,
    email: str,
) -> str:
    """Fixed server-side template for the owner's new-booking alert (no links)."""
    periodo_html = (
        f'<tr><td style="padding:4px 12px 4px 0;color:#64748b">Período</td>'
        f'<td style="padding:4px 0"><strong>{escape(periodo)}</strong></td></tr>'
        if periodo
        else ""
    )
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="padding:24px;font-family:Arial,sans-serif;background:#0B132B;color:#F8FAFC">
    <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#38BDF8">Novo agendamento recebido</p>
    <p style="margin:0 0 16px;font-size:20px;font-weight:bold">Um cliente solicitou {escape(servico)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Cliente</td><td style="padding:4px 0"><strong>{escape(nome)}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Serviço</td><td style="padding:4px 0">{escape(servico)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Data preferida</td><td style="padding:4px 0"><strong>{escape(format_date_br(data))}</strong></td></tr>
      {periodo_html}
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Endereço</td><td style="padding:4px 0">{escape(endereco)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Telefone</td><td style="padding:4px 0">{escape(numero)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">E-mail</td><td style="padding:4px 0">{escape(email)}</td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#94A3B8">Confirme a visita com o cliente pelo WhatsApp e marque o agendamento como atendido no painel.</p>
    <p style="margin:16px 0 0;font-size:12px;color:#64748b">Enviado por {escape(EMAIL_FROM_NAME)}. Nunca pedimos senha ou dados de cartão por e-mail.</p>
  </td></tr>
</table>"""


async def notify_owner_new_appointment(
    *, nome: str, servico: str, data: str, periodo: str | None,
    endereco: str, numero: str, email: str, appointment_id: str,
) -> None:
    """Fire-and-forget owner alert — must never break or slow the booking flow."""
    owner_email = os.environ.get("OWNER_EMAIL", "")
    if not owner_email:
        logger.warning("Owner email alert skipped: OWNER_EMAIL not set")
        return

    now = datetime.now(timezone.utc)
    _alert_timestamps[:] = [t for t in _alert_timestamps if (now - t).total_seconds() < 3600]
    if len(_alert_timestamps) >= _MAX_ALERTS_PER_HOUR:
        logger.warning("Owner email alert skipped: hourly cap reached (%s)", appointment_id)
        return
    _alert_timestamps.append(now)

    subject = f"Novo agendamento — {nome} ({format_date_br(data)})"
    html = _appointment_alert_html(nome, servico, data, periodo, endereco, numero, email)
    try:
        message_id = await send_email(to=owner_email, subject=subject, html=html)
        if message_id:
            logger.info("Owner email alert sent (%s): id=%s", appointment_id, message_id)
    except Exception:
        logger.exception("Owner email alert failed (booking unaffected) (%s)", appointment_id)
