from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal

scheduler = AsyncIOScheduler()


def schedule_reminder(booking_id: int, reminder_time: datetime):
    scheduler.add_job(
        send_reminder,
        trigger=DateTrigger(run_date=reminder_time),
        args=[booking_id],
        id=f"reminder_{booking_id}",
        replace_existing=True
    )


def start_scheduler():
    scheduler.start()


def shutdown_scheduler():
    scheduler.shutdown()