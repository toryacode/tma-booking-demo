from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta
from typing import List, Tuple
from app.models.schedule import Schedule
from app.models.booking import Booking


def _is_conflict(candidate: datetime, candidate_end: datetime, intervals: List[Tuple[datetime, datetime]]) -> bool:
    for bstart, bend in intervals:
        if candidate < bend and candidate_end > bstart:
            return True
    return False


def get_available_slots(db: Session, employee_id: int, service_duration: int, date: datetime.date) -> List[datetime]:
    weekday = date.weekday()  # 0=Monday
    schedule = db.query(Schedule).filter(
        Schedule.employee_id == employee_id,
        Schedule.weekday == weekday
    ).first()

    if not schedule:
        return []

    start_dt = datetime.combine(date, schedule.start_time)
    end_dt = datetime.combine(date, schedule.end_time)

    bookings = db.query(Booking.start_time, Booking.end_time).filter(
        Booking.employee_id == employee_id,
        Booking.start_time >= datetime.combine(date, time.min),
        Booking.start_time < datetime.combine(date + timedelta(days=1), time.min),
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).order_by(Booking.start_time).all()

    intervals: List[Tuple[datetime, datetime]] = []
    for bstart, bend in bookings:
        if not intervals or bstart > intervals[-1][1]:
            intervals.append((bstart, bend))
        else:
            intervals[-1] = (intervals[-1][0], max(intervals[-1][1], bend))

    available_slots: List[datetime] = []
    candidate = start_dt

    while candidate + timedelta(minutes=service_duration) <= end_dt:
        candidate_end = candidate + timedelta(minutes=service_duration)

        if not _is_conflict(candidate, candidate_end, intervals):
            available_slots.append(candidate)

        candidate += timedelta(minutes=15)

    print(f"[slot_service] date={date} employee={employee_id} duration={service_duration} intervals={[ (s.strftime('%H:%M'), e.strftime('%H:%M')) for s,e in intervals ]} available={[t.strftime('%H:%M') for t in available_slots]}")

    return available_slots


def is_slot_available(db: Session, employee_id: int, service_duration: int, candidate: datetime, date: datetime.date) -> bool:
    candidate_end = candidate + timedelta(minutes=service_duration)
    available = get_available_slots(db, employee_id, service_duration, date)
    return candidate in available
