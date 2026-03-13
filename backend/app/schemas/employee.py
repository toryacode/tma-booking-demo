from pydantic import BaseModel
from typing import Optional, List
from .service import Service


class EmployeeBase(BaseModel):
    name: str
    avatar: Optional[str] = None
    bio: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class Employee(EmployeeBase):
    id: int
    services: List[Service] = []

    class Config:
        orm_mode = True