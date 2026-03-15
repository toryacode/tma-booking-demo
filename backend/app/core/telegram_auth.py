import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from urllib.parse import parse_qsl

from app.core.config import settings


class TelegramInitDataError(ValueError):
    pass


def _build_data_check_string(init_data: str) -> tuple[str, str]:
    pairs = parse_qsl(init_data, keep_blank_values=True)
    if not pairs:
        raise TelegramInitDataError("init_data is empty")

    received_hash = None
    prepared: list[str] = []
    for key, value in pairs:
        if key == "hash":
            received_hash = value
            continue
        prepared.append(f"{key}={value}")

    if not received_hash:
        raise TelegramInitDataError("hash is missing in init_data")

    prepared.sort()
    data_check_string = "\n".join(prepared)
    return data_check_string, received_hash


def validate_and_extract_user(init_data: str) -> dict[str, Any]:
    if not settings.telegram_bot_token:
        raise TelegramInitDataError("telegram_bot_token is not configured")

    data_check_string, received_hash = _build_data_check_string(init_data)

    secret_key = hmac.new(
        key=b"WebAppData",
        msg=settings.telegram_bot_token.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()

    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise TelegramInitDataError("invalid init_data signature")

    params = dict(parse_qsl(init_data, keep_blank_values=True))

    auth_date_raw = params.get("auth_date")
    if not auth_date_raw:
        raise TelegramInitDataError("auth_date is missing in init_data")

    try:
        auth_date = int(auth_date_raw)
    except ValueError as exc:
        raise TelegramInitDataError("auth_date is invalid") from exc

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if now_ts - auth_date > settings.telegram_init_data_ttl_seconds:
        raise TelegramInitDataError("init_data is expired")

    user_raw = params.get("user")
    if not user_raw:
        raise TelegramInitDataError("user is missing in init_data")

    try:
        user = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise TelegramInitDataError("user payload is invalid") from exc

    if "id" not in user:
        raise TelegramInitDataError("user.id is missing in init_data")

    return {
        "user": user,
        "auth_date": auth_date,
        "query_id": params.get("query_id"),
    }
