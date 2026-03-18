from app.db.session import SessionLocal
from app.models.booking import Booking
from app.utils.telegram import send_message


def send_reminder(booking_id: int):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking and booking.status == "upcoming":
            message = f"Reminder: You have a booking for {booking.service.name} with {booking.employee.name} at {booking.start_time.strftime('%H:%M')}."
            send_message(booking.user_id, message, booking_id=booking.id, button_text="Open booking")
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
            full_price = booking.original_price if booking.original_price is not None else (booking.service.price if booking.service else 0)
            final_price = booking.final_price if booking.final_price is not None else full_price
            start = booking.start_time.strftime('%Y-%m-%d %H:%M')
            if booking.discount_percent and booking.discount_percent > 0:
                price_text = (
                    f"Full price: ${full_price:.2f}, "
                    f"Discount: {booking.discount_percent}%, "
                    f"Total: ${final_price:.2f}"
                )
            else:
                price_text = f"Price: ${final_price:.2f}"
            message = (
                f"Booking confirmed: {service_name} with {employee_name} on {start}. "
                f"Duration: {duration} min, {price_text}."
            )
            send_message(booking.user_id, message, booking_id=booking.id, button_text="View details")
    finally:
        db.close()