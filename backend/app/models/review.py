from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    review = Column(Text, nullable=True)
    review_date = Column(DateTime, server_default=func.now(), nullable=False)

    booking = relationship("Booking", back_populates="review")
