import requests
from app.core.config import settings


def send_message(chat_id: str, text: str):
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    data = {"chat_id": chat_id, "text": text}
    requests.post(url, data=data)