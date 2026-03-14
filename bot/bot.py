import asyncio
import logging
import socket
import aiohttp

from aiogram import Bot, Dispatcher
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.client.session.aiohttp import AiohttpSession

from config import BOT_TOKEN, WEBAPP_URL

logging.basicConfig(level=logging.INFO)

# FIX Docker / Proxmox IPv6 timeout
connector = aiohttp.TCPConnector(family=socket.AF_INET)

session = AiohttpSession(
    connector=connector,
    timeout=aiohttp.ClientTimeout(total=60)
)

bot = Bot(
    token=BOT_TOKEN,
    session=session
)

dp = Dispatcher()


@dp.message(Command("start"))
async def start_command(message: Message):
    login_url = f"{WEBAPP_URL}?telegram_user_id={message.from_user.id}"

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Open Booking App",
                    web_app=WebAppInfo(url=login_url)
                )
            ]
        ]
    )

    await message.answer(
        "Welcome to Beauty Salon Booking!",
        reply_markup=keyboard
    )


async def main():
    backoff = 1

    try:
        while True:
            try:
                logging.info("Bot starting polling...")
                await dp.start_polling(bot)

            except Exception as exc:
                logging.error("Bot polling failed: %s", exc, exc_info=True)
                logging.info("Retrying polling in %s seconds", backoff)

                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60)

            else:
                logging.info("Bot polling ended cleanly; restarting")
                backoff = 1

    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
