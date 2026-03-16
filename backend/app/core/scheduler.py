from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal
from app.models.booking import Booking

scheduler = AsyncIOScheduler()
JOB_ID = "booking_status_reconcile"
UPCOMING_STATUSES = ["upcoming", "upcomming"]


def _log(message: str):
    print(f"[scheduler] {message}")


def _booking_row(booking: Booking) -> str:
    return (
        f"id={booking.id} user={booking.user_id} status={booking.status} "
        f"start={booking.start_time.isoformat()} end={booking.end_time.isoformat()}"
    )


def reconcile_booking_statuses():
    db = SessionLocal()
    try:
        now = datetime.now()
        _log(f"run started at {now.isoformat()}")

        raw_bookings = db.query(Booking).filter(
            Booking.status.in_(["scheduled", "upcoming", "upcomming", "in_progress"])
        ).order_by(Booking.start_time.asc()).all()
        _log(f"raw active bookings fetched={len(raw_bookings)}")
        for booking in raw_bookings:
            _log(f"raw { _booking_row(booking) }")

        # Normalize legacy typo statuses so downstream filters are consistent.
        typo_upcoming = db.query(Booking).filter(Booking.status == "upcomming").all()
        for booking in typo_upcoming:
            booking.status = "upcoming"
        if typo_upcoming:
            db.commit()
        _log(f"normalized upcomming->upcoming count={len(typo_upcoming)}")

        # 1) scheduled -> upcoming (starts within next 15 minutes, but not already started)
        scheduled_candidates = db.query(Booking).filter(
            Booking.status == "scheduled",
            Booking.start_time > now,
            Booking.start_time <= now + timedelta(minutes=15),
        ).all()
        _log(f"scheduled->upcoming candidates={len(scheduled_candidates)}")

        upcoming_bookings = []
        for booking in scheduled_candidates:
            # Keep explicit same-day rule while avoiding brittle SQL date comparisons.
            if booking.start_time.date() == now.date():
                upcoming_bookings.append(booking)

        for booking in upcoming_bookings:
            booking.status = "upcoming"

        db.commit()
        _log(f"scheduled->upcoming transitioned={len(upcoming_bookings)}")
        for booking in upcoming_bookings:
            _log(f"transition scheduled->upcoming { _booking_row(booking) }")

        for booking in upcoming_bookings:
            send_reminder(booking.id)
            _log(f"reminder sent booking_id={booking.id}")

        # 2) scheduled/upcoming -> in_progress (booking already started)
        in_progress_bookings = db.query(Booking).filter(
            Booking.status.in_(["scheduled", *UPCOMING_STATUSES]),
            Booking.start_time <= now,
        ).all()
        _log(f"*->in_progress candidates={len(in_progress_bookings)}")
        for booking in in_progress_bookings:
            booking.status = "in_progress"

        db.commit()
        _log(f"*->in_progress transitioned={len(in_progress_bookings)}")
        for booking in in_progress_bookings:
            _log(f"transition to in_progress { _booking_row(booking) }")

        # 3) in_progress -> completed (booking ended)
        completed_bookings = db.query(Booking).filter(
            Booking.status == "in_progress",
            Booking.end_time <= now,
        ).all()
        _log(f"in_progress->completed candidates={len(completed_bookings)}")
        for booking in completed_bookings:
            booking.status = "completed"

        db.commit()
        _log(f"in_progress->completed transitioned={len(completed_bookings)}")
        for booking in completed_bookings:
            _log(f"transition to completed { _booking_row(booking) }")
        _log("run finished")
    except Exception as err:
        db.rollback()
        _log(f"run failed error={err}")
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
    _log("started periodic reconciliation every 60 seconds")
    reconcile_booking_statuses()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()