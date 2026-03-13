from aiogram import Bot
from config import BOT_TOKEN

bot = Bot(token=BOT_TOKEN)

async def send_notification(chat_id: int, text: str):
    await bot.send_message(chat_id=chat_id, text=text)