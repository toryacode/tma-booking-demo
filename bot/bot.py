from aiogram import Bot, Dispatcher
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
import asyncio
import logging
import aiohttp
from aiogram.client.session.aiohttp import AiohttpSession

from config import BOT_TOKEN, WEBAPP_URL

logging.basicConfig(level=logging.INFO)

session = AiohttpSession(
    timeout=aiohttp.ClientTimeout(total=60)
)

bot = Bot(token=BOT_TOKEN, session=session)

dp = Dispatcher()


@dp.message(Command("start"))
async def start_command(message: Message):
    login_url = f"{WEBAPP_URL}?telegram_user_id={message.from_user.id}"

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Open Booking App", web_app=WebAppInfo(url=login_url))]
        ]
    )

    await message.answer(
        "Welcome to Beauty Salon Booking!",
        reply_markup=keyboard
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
