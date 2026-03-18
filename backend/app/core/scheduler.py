from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal
from app.models.booking import Booking
from app.core.timezone import now_local_naive, to_local_naive

scheduler = AsyncIOScheduler()
JOB_ID = "booking_status_reconcile"
UPCOMING_STATUSES = ["upcoming", "upcomming"]


def reconcile_booking_statuses():
    db = SessionLocal()
    try:
        now = now_local_naive()

        # Normalize legacy typo statuses so downstream filters are consistent.
        typo_upcoming = db.query(Booking).filter(Booking.status == "upcomming").all()
        for booking in typo_upcoming:
            booking.status = "upcoming"
        if typo_upcoming:
            db.commit()

        # 1) scheduled -> upcoming (starts within next 15 minutes, but not already started)
        scheduled_candidates = db.query(Booking).filter(
            Booking.status == "scheduled",
        ).all()

        upcoming_bookings = []
        for booking in scheduled_candidates:
            booking_start = to_local_naive(booking.start_time)
            # Keep explicit same-day rule while avoiding brittle SQL date comparisons.
            if (
                booking_start.date() == now.date()
                and booking_start > now
                and booking_start <= now + timedelta(minutes=15)
            ):
                upcoming_bookings.append(booking)

        for booking in upcoming_bookings:
            booking.status = "upcoming"

        db.commit()

        for booking in upcoming_bookings:
            send_reminder(booking.id)

        # 2) scheduled/upcoming -> in_progress (booking already started)
        in_progress_bookings = db.query(Booking).filter(
            Booking.status.in_(["scheduled", *UPCOMING_STATUSES]),
        ).all()
        in_progress_candidates = []
        for booking in in_progress_bookings:
            booking_start = to_local_naive(booking.start_time)
            if booking_start <= now:
                in_progress_candidates.append(booking)

        for booking in in_progress_candidates:
            booking.status = "in_progress"

        db.commit()

        # 3) in_progress -> completed (booking ended)
        completed_bookings = db.query(Booking).filter(
            Booking.status == "in_progress",
        ).all()
        completed_candidates = []
        for booking in completed_bookings:
            booking_end = to_local_naive(booking.end_time)
            if booking_end <= now:
                completed_candidates.append(booking)

        for booking in completed_candidates:
            booking.status = "completed"

        db.commit()
    except Exception as err:
        db.rollback()
        raise
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        reconcile_booking_statuses,
        trigger=IntervalTrigger(seconds=60),
        id=JOB_ID,
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    reconcile_booking_statuses()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()