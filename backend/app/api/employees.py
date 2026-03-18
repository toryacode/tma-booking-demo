from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from app.db.session import get_db
from app.models.employee import Employee
from app.models.service import Service
from app.schemas.employee import Employee as EmployeeSchema
from app.services.slot_service import get_available_slots

router = APIRouter()


@router.get("/employees/{employee_id}", response_model=EmployeeSchema)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.get("/employees/{employee_id}/slots")
def get_employee_slots(
    employee_id: int,
    service_id: int,
    date: date = Query(...),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if employee provides this service
    if service not in employee.services:
        raise HTTPException(status_code=400, detail="Employee does not provide this service")
    
    slots = get_available_slots(db, employee_id, service.duration, date)
    return {"slots": [slot.isoformat() for slot in slots]}