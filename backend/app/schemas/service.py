from pydantic import BaseModel
from typing import Optional


class ServiceBase(BaseModel):
    name: str
    duration: int
    price: float
    icon: Optional[str] = None
    description: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class Service(ServiceBase):
    id: int

    class Config:
        orm_mode = True