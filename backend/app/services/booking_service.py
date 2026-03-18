from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime
from app.models.booking import Booking
from app.models.service import Service
from app.schemas.booking import BookingCreate
from app.services.reminder_service import send_booking_confirmation
from app.services.slot_service import is_slot_available
from app.core.timezone import now_local_naive


LOYALTY_DISCOUNT_PERCENT = 20
LOYALTY_CYCLE_COMPLETED_BOOKINGS = 4


def _round_price(value: float) -> float:
    return round(value + 1e-8, 2)


def get_user_loyalty_status(db: Session, user_id: str):
    completed_regular_bookings = db.query(func.count(Booking.id)).filter(
        Booking.user_id == user_id,
        Booking.status == "completed",
        Booking.is_loyalty_discount.is_(False),
    ).scalar() or 0

    loyalty_discounts_issued = db.query(func.count(Booking.id)).filter(
        Booking.user_id == user_id,
        Booking.is_loyalty_discount.is_(True),
        Booking.status.notin_(["cancelled", "canceled"]),
    ).scalar() or 0

    next_threshold = (loyalty_discounts_issued + 1) * LOYALTY_CYCLE_COMPLETED_BOOKINGS
    next_booking_discounted = completed_regular_bookings >= next_threshold
    bookings_until_discount = 0 if next_booking_discounted else (next_threshold - completed_regular_bookings)

    return {
        "completed_regular_bookings": int(completed_regular_bookings),
        "loyalty_discounts_issued": int(loyalty_discounts_issued),
        "bookings_until_discount": int(bookings_until_discount),
        "next_booking_discounted": bool(next_booking_discounted),
        "discount_percent": LOYALTY_DISCOUNT_PERCENT,
    }


def create_booking(db: Session, booking: BookingCreate):
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if not service:
        raise ValueError('Service not found')

    # Normalize timezone-aware datetimes to naive local datetimes for schedule comparison
    if booking.start_time.tzinfo is not None:
        booking.start_time = booking.start_time.replace(tzinfo=None)
    if booking.end_time.tzinfo is not None:
        booking.end_time = booking.end_time.replace(tzinfo=None)

    now = now_local_naive()
    if booking.start_time < now:
        raise ValueError('Cannot create booking in the past')
    if booking.end_time <= booking.start_time:
        raise ValueError('Booking end time must be after start time')

    if not is_slot_available(db, booking.employee_id, service.duration, booking.start_time, booking.start_time.date()):
        raise ValueError('Selected slot is not available')

    conflict = db.query(Booking).filter(
        Booking.employee_id == booking.employee_id,
        Booking.start_time < booking.end_time,
        Booking.end_time > booking.start_time,
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).first()
    if conflict:
        raise ValueError("Time slot is already booked")

    loyalty_status = get_user_loyalty_status(db, booking.user_id)
    apply_loyalty_discount = loyalty_status["next_booking_discounted"]

    original_price = _round_price(float(service.price))
    if apply_loyalty_discount:
        final_price = _round_price(original_price * (100 - LOYALTY_DISCOUNT_PERCENT) / 100)
        discount_percent = LOYALTY_DISCOUNT_PERCENT
    else:
        final_price = original_price
        discount_percent = 0

    booking_payload = booking.dict()
    booking_payload.update({
        "original_price": original_price,
        "final_price": final_price,
        "discount_percent": discount_percent,
        "is_loyalty_discount": apply_loyalty_discount,
    })

    db_booking = Booking(**booking_payload)
    db.add(db_booking)
    db.commit()

    # Load relations for response
    db_booking = db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.employee)).get(db_booking.id)

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
    
    if new_start_time.tzinfo is not None:
        new_start_time = new_start_time.replace(tzinfo=None)
    if new_end_time.tzinfo is not None:
        new_end_time = new_end_time.replace(tzinfo=None)

    now = now_local_naive()
    if new_start_time < now:
        raise ValueError('Cannot reschedule booking to the past')
    if new_end_time <= new_start_time:
        raise ValueError('Booking end time must be after start time')

    # Check new slot
    conflict = db.query(Booking).filter(
        Booking.employee_id == booking.employee_id,
        Booking.id != booking_id,
        Booking.start_time < new_end_time,
        Booking.end_time > new_start_time,
        Booking.status.in_(["scheduled", "upcoming", "in_progress"])
    ).first()
    if conflict:
        raise ValueError("New time slot is already booked")
    
    booking.start_time = new_start_time
    booking.end_time = new_end_time
    db.commit()
    
    return booking


def get_user_bookings(db: Session, user_id: str):
    return db.query(Booking).options(joinedload(Booking.service), joinedload(Booking.employee)).filter(Booking.user_id == user_id).all()