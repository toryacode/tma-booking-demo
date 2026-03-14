import socket
original_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4_only(host, port, *args, **kwargs):
    return [ai for ai in original_getaddrinfo(host, port, *args, **kwargs) if ai[0] == socket.AF_INET]
socket.getaddrinfo = getaddrinfo_ipv4_only

from aiogram import Bot, Dispatcher
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
import asyncio
import logging

from config import BOT_TOKEN, WEBAPP_URL

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def start_command(message: Message):
    login_url = f"{WEBAPP_URL}?telegram_user_id={message.from_user.id}"
   
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Open Booking App",
                    web_app=WebAppInfo(
                        url=login_url,
                        request_fullscreen=True
                    )
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
