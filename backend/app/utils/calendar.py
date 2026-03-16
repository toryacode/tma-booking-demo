from __future__ import annotations

from datetime import datetime, timezone
import re

from app.core.timezone import APP_TIMEZONE
from app.models.booking import Booking


def _escape_ics_text(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def _to_utc_ics(dt: datetime) -> str:
    if dt.tzinfo is None:
        aware = dt.replace(tzinfo=APP_TIMEZONE)
    else:
        aware = dt.astimezone(APP_TIMEZONE)
    return aware.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_booking_ics(booking: Booking) -> str:
    service_name = booking.service.name if booking.service else "Service"
    employee_name = booking.employee.name if booking.employee else "Specialist"
    summary = _escape_ics_text(f"{service_name} with {employee_name}")

    description_parts = [
        f"Booking #{booking.id}",
        f"Service: {service_name}",
        f"Expert: {employee_name}",
    ]
    if booking.service and booking.service.duration is not None:
        description_parts.append(f"Duration: {booking.service.duration} min")
    if booking.service and booking.service.price is not None:
        description_parts.append(f"Price: ${booking.service.price:.2f}")
    if booking.service and booking.service.description:
        description_parts.append(booking.service.description)

    description = _escape_ics_text("\n".join(description_parts))
    uid = f"booking-{booking.id}@beauty-salon-tma"
    dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dtstart = _to_utc_ics(booking.start_time)
    dtend = _to_utc_ics(booking.end_time)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Beauty Salon TMA//Booking Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{summary}",
        f"DESCRIPTION:{description}",
        "END:VEVENT",
        "END:VCALENDAR",
    ]
    return "\r\n".join(lines) + "\r\n"


def build_booking_ics_filename(booking: Booking) -> str:
    service_name = booking.service.name if booking.service else "booking"
    safe_service = re.sub(r"[^a-zA-Z0-9_-]+", "-", service_name.strip().lower()).strip("-") or "booking"
    return f"{safe_service}-{booking.id}.ics"
