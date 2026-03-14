from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta
from typing import List
from app.models.schedule import Schedule
from app.models.booking import Booking


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

    # Fetch all employee bookings for this date
    bookings = db.query(Booking.start_time, Booking.end_time).filter(
        Booking.employee_id == employee_id,
        Booking.start_time >= datetime.combine(date, time.min),
        Booking.start_time < datetime.combine(date + timedelta(days=1), time.min),
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).order_by(Booking.start_time).all()

    # Merge overlapping/adjacent booking intervals
    merged = []
    for bstart, bend in bookings:
        if not merged or bstart > merged[-1][1]:
            merged.append([bstart, bend])
        else:
            merged[-1][1] = max(merged[-1][1], bend)

    available_slots = []
    candidate = start_dt

    while candidate + timedelta(minutes=service_duration) <= end_dt:
        candidate_end = candidate + timedelta(minutes=service_duration)

        # 1) candidate slot is already booked, or in booking interval
        overlapping = False
        for bstart, bend in merged:
            # a) slot starts inside booking
            if bstart <= candidate < bend:
                overlapping = True
                break
            # b) slot fully inside booking
            if candidate <= bstart and candidate_end > bstart:
                overlapping = True
                break

        if not overlapping:
            # 2) Slot+duration should not overlap with any booking
            for bstart, bend in merged:
                if candidate_end <= bstart or candidate >= bend:
                    continue
                overlapping = True
                break

        if not overlapping:
            available_slots.append(candidate)

        candidate += timedelta(minutes=15)

    return available_slots
