import os
from urllib.parse import parse_qs, unquote, urlparse

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://tma.triniss.ru")


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
    direct = os.getenv("TELEGRAM_PROXY_URL")
    if direct:
        return direct

    tg_socks_link = os.getenv("TELEGRAM_SOCKS_LINK")
    return _proxy_url_from_tg_socks_link(tg_socks_link)


TELEGRAM_PROXY_URL = _resolve_proxy_url()