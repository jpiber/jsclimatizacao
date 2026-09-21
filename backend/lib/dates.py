"""Server-side date helpers. The pod clock is UTC — anchor "today" here, never in the browser."""

import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


def _zone(tz: str | None = None) -> ZoneInfo:
    return ZoneInfo(tz or os.environ.get("APP_TZ", "UTC"))


def today_iso(tz: str | None = None) -> str:
    """Today's date as YYYY-MM-DD in `tz` (default: APP_TZ env, else UTC)."""
    return datetime.now(_zone(tz)).strftime("%Y-%m-%d")


def tomorrow_iso(tz: str | None = None) -> str:
    """Tomorrow's date as YYYY-MM-DD in `tz` (default: APP_TZ env, else UTC)."""
    return (datetime.now(_zone(tz)).date() + timedelta(days=1)).strftime("%Y-%m-%d")


def format_date_br(iso: str) -> str:
    """'2026-09-21' -> '21/09/2026'. Display only — never used for date math."""
    try:
        y, m, d = iso.split("-")
        return f"{d}/{m}/{y}"
    except Exception:
        return iso
