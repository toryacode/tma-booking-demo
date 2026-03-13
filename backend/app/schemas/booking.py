from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BookingBase(BaseModel):
    service_id: int
    employee_id: int
    start_time: datetime
    end_time: datetime


class BookingCreate(BookingBase):
    user_id: str


class BookingUpdate(BaseModel):
    status: Optional[str] = None


class Booking(BookingBase):
    id: int
    user_id: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True