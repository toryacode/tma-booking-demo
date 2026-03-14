import requests
from app.core.config import settings


def send_message(chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    data = {"chat_id": chat_id, "text": text}
    try:
        response = requests.post(url, data=data, timeout=5)
        if not response.ok:
            print(f"Telegram send failed {response.status_code}: {response.text}")
    except Exception as exc:
        print(f"Telegram send error: {exc}")