from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import settings


APP_TIMEZONE = ZoneInfo(settings.tz)


def now_local_naive() -> datetime:
    return datetime.now(APP_TIMEZONE).replace(tzinfo=None)


def today_local() -> date:
    return now_local_naive().date()


def to_local_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(APP_TIMEZONE).replace(tzinfo=None)
