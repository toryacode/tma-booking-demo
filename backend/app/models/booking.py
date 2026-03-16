from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)  # Telegram user ID
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="scheduled")  # scheduled, upcoming, in_progress, completed, cancelled
    created_at = Column(DateTime, server_default=func.now())

    service = relationship("Service", back_populates="bookings")
    employee = relationship("Employee", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False)