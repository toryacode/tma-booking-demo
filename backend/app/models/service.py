from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.db.base import Base
from .employee_service import employee_services


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    price = Column(Float, nullable=False)
    icon = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    employees = relationship("Employee", secondary=employee_services, back_populates="services")
    bookings = relationship("Booking", back_populates="service")