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
    created_at: datetime
    service: Optional[ServiceSchema] = None
    employee: Optional[EmployeeSchema] = None

    model_config = ConfigDict(from_attributes=True)