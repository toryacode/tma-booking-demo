from app.db.session import SessionLocal
from app.models.booking import Booking
from app.utils.telegram import send_message


def send_reminder(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking and booking.status == "scheduled":
            message = f"Reminder: You have a booking for {booking.service.name} with {booking.employee.name} at {booking.start_time.strftime('%H:%M')}."
            send_message(booking.user_id, message)
    finally:
        db.close()


def send_booking_confirmation(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            message = f"Booking confirmed: {booking.service.name} with {booking.employee.name} on {booking.start_time.strftime('%Y-%m-%d %H:%M')}."
            send_message(booking.user_id, message)
    finally:
        db.close()