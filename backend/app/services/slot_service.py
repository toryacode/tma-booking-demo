from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta
from typing import List
from app.models.schedule import Schedule
from app.models.booking import Booking


def get_available_slots(db: Session, employee_id: int, service_duration: int, date: datetime.date) -> List[datetime]:
    # Get employee schedule for the weekday
    weekday = date.weekday()  # 0=Monday
    schedule = db.query(Schedule).filter(
        Schedule.employee_id == employee_id,
        Schedule.weekday == weekday
    ).first()
    
    if not schedule:
        return []
    
    # We will generate potential slots in 15 minute increments and then filter conflicts.
    start_dt = datetime.combine(date, schedule.start_time)
    end_dt = datetime.combine(date, schedule.end_time)

    # Collect existing booked intervals for the employee on this date in active status.
    booked_times = db.query(Booking.start_time, Booking.end_time).filter(
        Booking.employee_id == employee_id,
        Booking.start_time >= datetime.combine(date, time.min),
        Booking.start_time < datetime.combine(date + timedelta(days=1), time.min),
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).all()

    available_slots = []
    candidate = start_dt

    while candidate + timedelta(minutes=service_duration) <= end_dt:
        slot_end = candidate + timedelta(minutes=service_duration)
        conflict = any(
            booking_start < slot_end and booking_end > candidate
            for booking_start, booking_end in booked_times
        )
        if not conflict:
            available_slots.append(candidate)

        candidate += timedelta(minutes=15)

    return available_slots
