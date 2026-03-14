import requests
from app.core.config import settings


def send_message(chat_id: str, text: str):
    effective_chat = chat_id or settings.telegram_default_chat_id
    if not effective_chat:
        print("Telegram send skipped: no chat_id available")
        return

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    data = {"chat_id": effective_chat, "text": text}
    try:
        response = requests.post(url, data=data, timeout=5)
        if not response.ok:
            print(f"Telegram send failed {response.status_code}: {response.text}")
            if "chat not found" in response.text.lower() and settings.telegram_default_chat_id:
                print(f"Telegram default chat fallback trigger: {settings.telegram_default_chat_id}")
    except Exception as exc:
        print(f"Telegram send error: {exc}")