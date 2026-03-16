from app.db.session import SessionLocal
from app.models.booking import Booking
from app.utils.telegram import send_message


def send_reminder(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking and booking.status == "upcoming":
            message = f"Reminder: You have a booking for {booking.service.name} with {booking.employee.name} at {booking.start_time.strftime('%H:%M')}."
            send_message(booking.user_id, message)
    finally:
        db.close()


def send_booking_confirmation(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            service_name = booking.service.name if booking.service else 'service'
            employee_name = booking.employee.name if booking.employee else 'specialist'
            duration = booking.service.duration if booking.service else 0
            price = booking.service.price if booking.service else 0
            start = booking.start_time.strftime('%Y-%m-%d %H:%M')
            message = (
                f"Booking confirmed: {service_name} with {employee_name} on {start}. "
                f"Duration: {duration} min, Price: ${price:.2f}."
            )
            send_message(booking.user_id, message)
    finally:
        db.close()