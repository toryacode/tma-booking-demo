from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class BookingBase(BaseModel):
    service_id: int
    employee_id: int
    start_time: datetime
    end_time: datetime


class BookingCreate(BookingBase):
    user_id: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None


from .service import Service as ServiceSchema
from .employee import Employee as EmployeeSchema


class Booking(BookingBase):
    id: int
    user_id: str
    status: str
    original_price: Optional[float] = None
    final_price: Optional[float] = None
    discount_percent: int = 0
    is_loyalty_discount: bool = False
    created_at: datetime
    service: Optional[ServiceSchema] = None
    employee: Optional[EmployeeSchema] = None

    model_config = ConfigDict(from_attributes=True)


class LoyaltyStatus(BaseModel):
    completed_regular_bookings: int
    loyalty_discounts_issued: int
    bookings_until_discount: int
    next_booking_discounted: bool
    discount_percent: int