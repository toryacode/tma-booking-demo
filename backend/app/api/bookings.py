from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, Booking as BookingSchema
from app.services.booking_service import create_booking, cancel_booking, reschedule_booking, get_user_bookings
from app.core.security import verify_token

router = APIRouter()


def get_current_user(
    authorization: Optional[str] = Header(None),
    user_id: Optional[str] = Header(None, alias="user-id")
):
    # Token-based auth takes precedence
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            payload = verify_token(token)
            if payload and "sub" in payload:
                return payload["sub"]
            raise HTTPException(status_code=401, detail="Invalid authentication token")

    # Fallback to direct user-id header for compatibility
    if user_id:
        return user_id

    raise HTTPException(status_code=401, detail="Unauthorized: user-id or bearer token required")


@router.post("/bookings", response_model=BookingSchema)
def create_new_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user-id header")
    booking.user_id = user_id
    try:
        return create_booking(db, booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bookings/{booking_id}/cancel", response_model=BookingSchema)
def cancel_user_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        return cancel_booking(db, booking_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bookings/{booking_id}/reschedule", response_model=BookingSchema)
def reschedule_user_booking(
    booking_id: int,
    new_start_time: datetime,
    new_end_time: datetime,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        return reschedule_booking(db, booking_id, user_id, new_start_time, new_end_time)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bookings/my", response_model=list[BookingSchema])
def get_my_bookings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    return get_user_bookings(db, user_id)