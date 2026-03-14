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
    
    # Generate potential slots
    slots = []
    current_time = datetime.combine(date, schedule.start_time)
    end_time = datetime.combine(date, schedule.end_time)
    
    while current_time + timedelta(minutes=service_duration) <= end_time:
        slots.append(current_time)
        current_time += timedelta(minutes=service_duration)
    
    # Remove booked slots
    booked_times = db.query(Booking.start_time, Booking.end_time).filter(
        Booking.employee_id == employee_id,
        Booking.start_time >= datetime.combine(date, time.min),
        Booking.start_time < datetime.combine(date + timedelta(days=1), time.min),
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).all()
    
    available_slots = []
    for slot in slots:
        slot_end = slot + timedelta(minutes=service_duration)
        conflict = any(
            booking_start < slot_end and booking_end > slot
            for booking_start, booking_end in booked_times
        )
        if not conflict:
            available_slots.append(slot)
    
    return available_slots