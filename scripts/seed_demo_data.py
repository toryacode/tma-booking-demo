#!/usr/bin/env python3
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.service import Service
from app.models.employee_service import employee_services
from app.models.booking import Booking


def seed_demo_data():
    db = SessionLocal()

    # Insert services if not exist
    existing_services = {s.name: s for s in db.query(Service).all()}
    service_data = [
        {'name': 'Haircut', 'duration': 60, 'price': 50.0, 'description': 'Professional haircut'},
        {'name': 'Manicure', 'duration': 45, 'price': 30.0, 'description': 'Nail care'},
        {'name': 'Massage', 'duration': 90, 'price': 80.0, 'description': 'Relaxing massage'},
    ]
    services = []
    for data in service_data:
        svc = existing_services.get(data['name'])
        if not svc:
            svc = Service(**data)
            db.add(svc)
            db.flush()
        services.append(svc)

    # Insert employees if not exist
    existing_employees = {e.name: e for e in db.query(Employee).all()}
    employee_data = [
        {'name': 'Alice Johnson', 'bio': 'Expert stylist'},
        {'name': 'Bob Smith', 'bio': 'Nail specialist'},
        {'name': 'Charlie Brown', 'bio': 'Massage therapist'},
    ]
    employees = []
    for data in employee_data:
        emp = existing_employees.get(data['name'])
        if not emp:
            emp = Employee(**data)
            db.add(emp)
            db.flush()
        employees.append(emp)

    db.commit()  # commit to get IDs etc

    # Re-load to sync associations
    employees = db.query(Employee).all()
    services = db.query(Service).all()

    # guarantee employee id 1 exists
    if len(employees) >= 1 and len(services) >= 2:
        emp1 = employees[0]
        svc2 = services[1]
        if svc2 not in emp1.services:
            emp1.services.append(svc2)

    # optional extra mapping
    if len(employees) >= 2 and len(services) >= 1:
        emp2 = employees[1]
        svc1 = services[0]
        if svc1 not in emp2.services:
            emp2.services.append(svc1)

    # create one sample booking
    if len(employees) >= 1 and len(services) >= 1:
        booking_exists = db.query(Booking).count() > 0
        if not booking_exists:
            start = datetime.utcnow() + timedelta(days=1)
            booking = Booking(
                user_id='demo_user',
                employee_id=employees[0].id,
                service_id=services[0].id,
                start_time=start,
                end_time=start + timedelta(minutes=services[0].duration),
                status='scheduled',
            )
            db.add(booking)

    db.commit()
    db.close()
    print('Demo data seeded successfully.')


if __name__ == '__main__':
    seed_demo_data()
