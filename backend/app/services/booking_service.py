from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from app.models.booking import Booking
from app.models.service import Service
from app.models.employee import Employee
from app.schemas.booking import BookingCreate
from app.core.scheduler import schedule_reminder
from app.services.reminder_service import send_booking_confirmation
from app.services.slot_service import is_slot_available


ACTIVE_SLOT_STATUSES = ["scheduled", "upcoming"]


def create_booking(db: Session, booking: BookingCreate):
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if not service:
        raise ValueError('Service not found')

    # Normalize timezone-aware datetimes to naive local datetimes for schedule comparison
    if booking.start_time.tzinfo is not None:
        booking.start_time = booking.start_time.replace(tzinfo=None)
    if booking.end_time.tzinfo is not None:
        booking.end_time = booking.end_time.replace(tzinfo=None)

    if not is_slot_available(db, booking.employee_id, service.duration, booking.start_time, booking.start_time.date()):
        raise ValueError('Selected slot is not available')

    conflict = db.query(Booking).filter(
        Booking.employee_id == booking.employee_id,
        Booking.start_time < booking.end_time,
        Booking.end_time > booking.start_time,
        Booking.status.in_(ACTIVE_SLOT_STATUSES)
    ).first()
    if conflict:
        raise ValueError("Time slot is already booked")

    db_booking = Booking(**booking.dict())
    db.add(db_booking)
    db.commit()

    # Load relations for response
    db_booking = db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.employee)).get(db_booking.id)

    # Schedule reminder
    reminder_time = db_booking.start_time - timedelta(minutes=15)
    schedule_reminder(db_booking.id, reminder_time)

    # Send confirmation
    send_booking_confirmation(db_booking.id)

    return db_booking


def cancel_booking(db: Session, booking_id: int, user_id: str):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    if not booking:
        raise ValueError("Booking not found")
    if booking.status not in ["scheduled", "upcoming"]:
        raise ValueError("Cannot cancel booking")
    
    booking.status = "cancelled"
    db.commit()
    return booking


def reschedule_booking(db: Session, booking_id: int, user_id: str, new_start_time: datetime, new_end_time: datetime):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    if not booking:
        raise ValueError("Booking not found")
    
    # Check new slot
    conflict = db.query(Booking).filter(
        Booking.employee_id == booking.employee_id,
        Booking.id != booking_id,
        Booking.start_time < new_end_time,
        Booking.end_time > new_start_time,
        Booking.status.in_(ACTIVE_SLOT_STATUSES)
    ).first()
    if conflict:
        raise ValueError("New time slot is already booked")
    
    booking.start_time = new_start_time
    booking.end_time = new_end_time
    db.commit()
    
    # Reschedule reminder
    reminder_time = new_start_time - timedelta(minutes=15)
    schedule_reminder(booking.id, reminder_time)
    
    return booking


def get_user_bookings(db: Session, user_id: str):
    return db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.employee)).filter(Booking.user_id == user_id).all()