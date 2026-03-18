from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ReviewBookingService(BaseModel):
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewBookingEmployee(BaseModel):
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewBookingSummary(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    status: str
    service: Optional[ReviewBookingService] = None
    employee: Optional[ReviewBookingEmployee] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None


class Review(BaseModel):
    id: int
    booking_id: int
    user_id: str
    rating: int
    review: Optional[str] = None
    review_date: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewWithBooking(Review):
    booking: ReviewBookingSummary
