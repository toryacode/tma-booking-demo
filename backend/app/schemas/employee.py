from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)