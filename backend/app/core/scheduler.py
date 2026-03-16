from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal
from app.models.booking import Booking

scheduler = AsyncIOScheduler()
JOB_ID = "booking_status_reconcile"
UPCOMING_STATUSES = ["upcoming", "upcomming"]
MOSCOW_TZ = ZoneInfo("Europe/Moscow")


def _log(message: str):
    print(f"[scheduler] {message}")


def _booking_row(booking: Booking) -> str:
    start_local = _as_moscow_naive(booking.start_time)
    end_local = _as_moscow_naive(booking.end_time)
    return (
        f"id={booking.id} user={booking.user_id} status={booking.status} "
        f"start={start_local.isoformat()} end={end_local.isoformat()}"
    )


def _now_moscow_naive() -> datetime:
    # Use explicit Moscow local time for all scheduler comparisons.
    return datetime.now(MOSCOW_TZ).replace(tzinfo=None)


def _as_moscow_naive(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        # Existing DB values are treated as Moscow local wall time.
        return dt
    return dt.astimezone(MOSCOW_TZ).replace(tzinfo=None)


def reconcile_booking_statuses():
    db = SessionLocal()
    try:
        now = _now_moscow_naive()
        now_utc = datetime.utcnow()
        _log(f"run started now_moscow={now.isoformat()} now_utc={now_utc.isoformat()}")

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
        ).all()
        _log(f"scheduled base candidates={len(scheduled_candidates)}")

        upcoming_bookings = []
        for booking in scheduled_candidates:
            booking_start = _as_moscow_naive(booking.start_time)
            # Keep explicit same-day rule while avoiding brittle SQL date comparisons.
            if (
                booking_start.date() == now.date()
                and booking_start > now
                and booking_start <= now + timedelta(minutes=15)
            ):
                upcoming_bookings.append(booking)

        _log(f"scheduled->upcoming candidates={len(upcoming_bookings)}")
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
        ).all()
        in_progress_candidates = []
        for booking in in_progress_bookings:
            booking_start = _as_moscow_naive(booking.start_time)
            if booking_start <= now:
                in_progress_candidates.append(booking)

        _log(f"*->in_progress candidates={len(in_progress_candidates)}")
        for booking in in_progress_candidates:
            booking.status = "in_progress"

        db.commit()
        _log(f"*->in_progress transitioned={len(in_progress_candidates)}")
        for booking in in_progress_candidates:
            _log(f"transition to in_progress { _booking_row(booking) }")

        # 3) in_progress -> completed (booking ended)
        completed_bookings = db.query(Booking).filter(
            Booking.status == "in_progress",
        ).all()
        completed_candidates = []
        for booking in completed_bookings:
            booking_end = _as_moscow_naive(booking.end_time)
            if booking_end <= now:
                completed_candidates.append(booking)

        _log(f"in_progress->completed candidates={len(completed_candidates)}")
        for booking in completed_candidates:
            booking.status = "completed"

        db.commit()
        _log(f"in_progress->completed transitioned={len(completed_candidates)}")
        for booking in completed_candidates:
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