from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta, time
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal
from app.models.booking import Booking

scheduler = AsyncIOScheduler()
JOB_ID = "booking_status_reconcile"
UPCOMING_STATUSES = ["upcoming", "upcomming"]


def reconcile_booking_statuses():
    db = SessionLocal()
    try:
        now = datetime.now()
        day_start = datetime.combine(now.date(), time.min)
        next_day_start = day_start + timedelta(days=1)

        # Normalize legacy typo statuses so downstream filters are consistent.
        typo_upcoming = db.query(Booking).filter(Booking.status == "upcomming").all()
        for booking in typo_upcoming:
            booking.status = "upcoming"
        if typo_upcoming:
            db.commit()

        # 1) scheduled -> upcoming (today, starts within next 15 minutes, but not already started)
        upcoming_bookings = db.query(Booking).filter(
            Booking.status == "scheduled",
            Booking.start_time >= day_start,
            Booking.start_time < next_day_start,
            Booking.start_time > now,
            Booking.start_time <= now + timedelta(minutes=15),
        ).all()
        for booking in upcoming_bookings:
            booking.status = "upcoming"

        db.commit()

        for booking in upcoming_bookings:
            send_reminder(booking.id)

        # 2) scheduled/upcoming -> in_progress (booking already started)
        in_progress_bookings = db.query(Booking).filter(
            Booking.status.in_(["scheduled", *UPCOMING_STATUSES]),
            Booking.start_time <= now,
        ).all()
        for booking in in_progress_bookings:
            booking.status = "in_progress"

        db.commit()

        # 3) in_progress -> completed (booking ended)
        completed_bookings = db.query(Booking).filter(
            Booking.status == "in_progress",
            Booking.end_time <= now,
        ).all()
        for booking in completed_bookings:
            booking.status = "completed"

        db.commit()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        reconcile_booking_statuses,
        trigger=IntervalTrigger(seconds=60),
        id=JOB_ID,
        replace_existing=True,
    )
    scheduler.start()
    reconcile_booking_statuses()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()