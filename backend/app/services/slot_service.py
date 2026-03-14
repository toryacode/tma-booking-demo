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

    # Normalize bookings and merge overlapping intervals for efficiency
    merged_bookings = []
    for booking_start, booking_end in sorted(booked_times):
        if not merged_bookings or booking_start > merged_bookings[-1][1]:
            merged_bookings.append([booking_start, booking_end])
        else:
            merged_bookings[-1][1] = max(merged_bookings[-1][1], booking_end)

    while candidate + timedelta(minutes=service_duration) <= end_dt:
        slot_end = candidate + timedelta(minutes=service_duration)

        # ensure slot is entirely within schedule boundaries
        if slot_end > end_dt:
            break

        # Find first conflicting booking, if any
        anyway_conflict = False
        for booking_start, booking_end in merged_bookings:
            if booking_start >= slot_end:
                # all later bookings start after candidate slot ends
                break
            if booking_end <= candidate:
                # this booking ends before candidate starts
                continue

            # candidate overlaps existing booking
            anyway_conflict = True
            break

        if not anyway_conflict:
            available_slots.append(candidate)

        candidate += timedelta(minutes=15)

    return available_slots
