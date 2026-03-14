from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.base import Base

employee_services = Table(
    "employee_services",
    Base.metadata,
    Column("employee_id", Integer, ForeignKey("employees.id"), primary_key=True),
    Column("service_id", Integer, ForeignKey("services.id"), primary_key=True),
)