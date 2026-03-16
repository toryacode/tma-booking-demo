from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.models.booking import Booking
from app.models.review import Review as ReviewModel
from app.schemas.booking import BookingCreate, Booking as BookingSchema
from app.schemas.review import ReviewCreate, Review as ReviewSchema, ReviewWithBooking
from app.services.booking_service import create_booking, cancel_booking, reschedule_booking, get_user_bookings
from app.core.security import verify_token
from app.core.scheduler import reconcile_booking_statuses
from app.utils.calendar import build_booking_ics, build_booking_ics_filename

router = APIRouter()


def get_current_user(
    authorization: Optional[str] = Header(None)
):
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            payload = verify_token(token)
            if payload and "sub" in payload:
                return payload["sub"]
            raise HTTPException(status_code=401, detail="Invalid authentication token")

    raise HTTPException(status_code=401, detail="Unauthorized: bearer token required")


@router.post("/bookings", response_model=BookingSchema)
def create_new_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing authenticated user")
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
    reconcile_booking_statuses()
    return get_user_bookings(db, user_id)


@router.get("/bookings/reviews/my", response_model=list[ReviewWithBooking])
def get_my_reviews(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    reconcile_booking_statuses()
    return (
        db.query(ReviewModel)
        .options(
            joinedload(ReviewModel.booking).joinedload(Booking.service),
            joinedload(ReviewModel.booking).joinedload(Booking.employee),
        )
        .filter(ReviewModel.user_id == user_id)
        .order_by(ReviewModel.review_date.desc())
        .all()
    )


@router.get("/bookings/{booking_id}/calendar")
def download_booking_calendar(
    booking_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.service), joinedload(Booking.employee))
        .filter(Booking.id == booking_id, Booking.user_id == user_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    ics_content = build_booking_ics(booking)
    filename = build_booking_ics_filename(booking)
    return Response(
        content=ics_content,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/bookings/{booking_id}/review", response_model=ReviewSchema)
def get_booking_review(
    booking_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    review = db.query(ReviewModel).filter(ReviewModel.booking_id == booking_id, ReviewModel.user_id == user_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return review


@router.post("/bookings/{booking_id}/review", response_model=ReviewSchema)
def create_or_update_booking_review(
    booking_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "completed":
        raise HTTPException(status_code=400, detail="Only completed bookings can be reviewed")

    review = db.query(ReviewModel).filter(ReviewModel.booking_id == booking_id, ReviewModel.user_id == user_id).first()
    if not review:
        review = ReviewModel(
            booking_id=booking_id,
            user_id=user_id,
            rating=payload.rating,
            review=payload.review,
        )
        db.add(review)
    else:
        review.rating = payload.rating
        review.review = payload.review

    db.commit()
    db.refresh(review)
    return review