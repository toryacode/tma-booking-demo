from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.service import Service
from app.models.employee import Employee
from app.schemas.service import Service as ServiceSchema
from app.schemas.employee import Employee as EmployeeSchema

router = APIRouter()


@router.get("/services", response_model=List[ServiceSchema])
def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()
    return services


@router.get("/services/{service_id}/employees", response_model=List[EmployeeSchema])
def get_service_employees(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service.employees


@router.get("/services/{service_id}", response_model=ServiceSchema)
def get_service(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service