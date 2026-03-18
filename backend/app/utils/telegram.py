import requests
from urllib.parse import parse_qs, urlencode, unquote, urlparse, urlunparse
from app.core.config import settings


def _proxy_url_from_tg_socks_link(link: str | None) -> str | None:
    if not link:
        return None

    parsed = urlparse(link)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != "t.me" or parsed.path != "/socks":
        return None

    params = parse_qs(parsed.query)
    server = params.get("server", [None])[0]
    port = params.get("port", [None])[0]
    user = params.get("user", [None])[0]
    password = params.get("pass", [None])[0]

    if not server or not port:
        return None

    if user and password:
        return f"socks5://{unquote(user)}:{unquote(password)}@{server}:{port}"

    return f"socks5://{server}:{port}"


def _resolve_proxy_url() -> str | None:
    if settings.telegram_proxy_url:
        return settings.telegram_proxy_url
    return _proxy_url_from_tg_socks_link(settings.telegram_socks_link)


def _build_booking_webapp_url(booking_id: int) -> str | None:
    base_url = settings.webapp_url
    if not base_url:
        return None

    parsed = urlparse(base_url)
    existing_params = dict(parse_qs(parsed.query, keep_blank_values=True))
    existing_params["booking_id"] = [str(booking_id)]
    query = urlencode(existing_params, doseq=True)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, query, parsed.fragment))


def send_message(chat_id: str, text: str, booking_id: int | None = None, button_text: str | None = None):
    effective_chat = chat_id or settings.telegram_default_chat_id
    if not effective_chat:
        print("Telegram send skipped: no chat_id available")
        return

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    data = {"chat_id": effective_chat, "text": text}
    webapp_url = _build_booking_webapp_url(booking_id) if booking_id is not None else None
    if webapp_url:
        data["reply_markup"] = {
            "inline_keyboard": [[{
                "text": button_text or "Open booking",
                "web_app": {"url": webapp_url},
            }]]
        }
    proxy_url = _resolve_proxy_url()
    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    try:
        response = requests.post(
            url,
            json=data,
            timeout=settings.telegram_request_timeout_seconds,
            proxies=proxies,
        )
        if not response.ok:
            print(f"Telegram send failed {response.status_code}: {response.text}")
            if "chat not found" in response.text.lower() and settings.telegram_default_chat_id:
                print(f"Telegram default chat fallback trigger: {settings.telegram_default_chat_id}")
    except Exception as exc:
        print(f"Telegram send error: {exc}")