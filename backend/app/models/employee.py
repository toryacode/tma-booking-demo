from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from .employee_service import employee_services


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    bio = Column(Text, nullable=True)

    services = relationship("Service", secondary=employee_services, back_populates="employees")
    schedules = relationship("Schedule", back_populates="employee")
    bookings = relationship("Booking", back_populates="employee")