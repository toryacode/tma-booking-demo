from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


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
