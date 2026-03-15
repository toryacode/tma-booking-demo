from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.jobstores.base import JobLookupError
from datetime import datetime, timedelta
from app.services.reminder_service import send_reminder
from app.db.session import SessionLocal
from app.models.booking import Booking

scheduler = AsyncIOScheduler()
ACTIVE_LIFECYCLE_STATUSES = ["scheduled", "upcoming", "in_progress"]


def _job_id(prefix: str, booking_id: int) -> str:
    return f"{prefix}_{booking_id}"


def _remove_job_if_exists(job_id: str):
    try:
        scheduler.remove_job(job_id)
    except JobLookupError:
        pass


def _target_status(booking: Booking, now: datetime) -> str:
    if now >= booking.end_time:
        return "completed"
    if now >= booking.start_time:
        return "in_progress"
    if now >= booking.start_time - timedelta(minutes=15):
        return "upcoming"
    return "scheduled"


def _reconcile_single_booking(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            cancel_booking_lifecycle_jobs(booking_id)
            return

        if booking.status == "cancelled":
            cancel_booking_lifecycle_jobs(booking_id)
            return

        if booking.status not in ACTIVE_LIFECYCLE_STATUSES and booking.status != "completed":
            return

        new_status = _target_status(booking, datetime.now())
        if booking.status != new_status:
            booking.status = new_status
            db.commit()
    finally:
        db.close()


def mark_booking_upcoming(booking_id: int):
    _reconcile_single_booking(booking_id)


def mark_booking_in_progress(booking_id: int):
    _reconcile_single_booking(booking_id)


def mark_booking_completed(booking_id: int):
    _reconcile_single_booking(booking_id)


def cancel_booking_lifecycle_jobs(booking_id: int):
    _remove_job_if_exists(_job_id("reminder", booking_id))
    _remove_job_if_exists(_job_id("status_upcoming", booking_id))
    _remove_job_if_exists(_job_id("status_in_progress", booking_id))
    _remove_job_if_exists(_job_id("status_completed", booking_id))


def schedule_reminder(booking_id: int, reminder_time: datetime):
    scheduler.add_job(
        send_reminder,
        trigger=DateTrigger(run_date=reminder_time),
        args=[booking_id],
        id=_job_id("reminder", booking_id),
        replace_existing=True
    )


def schedule_booking_lifecycle(booking_id: int, start_time: datetime, end_time: datetime):
    now = datetime.now()
    reminder_time = start_time - timedelta(minutes=15)

    if reminder_time > now:
        schedule_reminder(booking_id, reminder_time)
        scheduler.add_job(
            mark_booking_upcoming,
            trigger=DateTrigger(run_date=reminder_time),
            args=[booking_id],
            id=_job_id("status_upcoming", booking_id),
            replace_existing=True,
        )
    else:
        _remove_job_if_exists(_job_id("reminder", booking_id))
        _remove_job_if_exists(_job_id("status_upcoming", booking_id))

    if start_time > now:
        scheduler.add_job(
            mark_booking_in_progress,
            trigger=DateTrigger(run_date=start_time),
            args=[booking_id],
            id=_job_id("status_in_progress", booking_id),
            replace_existing=True,
        )
    else:
        _remove_job_if_exists(_job_id("status_in_progress", booking_id))

    if end_time > now:
        scheduler.add_job(
            mark_booking_completed,
            trigger=DateTrigger(run_date=end_time),
            args=[booking_id],
            id=_job_id("status_completed", booking_id),
            replace_existing=True,
        )
    else:
        _remove_job_if_exists(_job_id("status_completed", booking_id))


def restore_booking_lifecycle_on_startup():
    db = SessionLocal()
    try:
        bookings = db.query(Booking).filter(Booking.status.in_(ACTIVE_LIFECYCLE_STATUSES)).all()
        now = datetime.now()

        for booking in bookings:
            expected_status = _target_status(booking, now)
            if expected_status != booking.status:
                booking.status = expected_status

        db.commit()

        active_bookings = db.query(Booking).filter(Booking.status.in_(ACTIVE_LIFECYCLE_STATUSES)).all()
        for booking in active_bookings:
            schedule_booking_lifecycle(booking.id, booking.start_time, booking.end_time)
    finally:
        db.close()


def start_scheduler():
    scheduler.start()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()