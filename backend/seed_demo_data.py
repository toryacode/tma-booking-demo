#!/usr/bin/env python3
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.service import Service
from app.models.schedule import Schedule
from app.models.booking import Booking


def seed_demo_data():
    db = SessionLocal()

    service_data = [
        {'name': 'Haircut', 'duration': 60, 'price': 50.0, 'description': 'Professional haircut'},
        {'name': 'Manicure', 'duration': 45, 'price': 30.0, 'description': 'Nail care'},
        {'name': 'Massage', 'duration': 90, 'price': 80.0, 'description': 'Relaxing massage'},
    ]

    employees_data = [
        {'name': 'Alice Johnson', 'bio': 'Expert stylist'},
        {'name': 'Bob Smith', 'bio': 'Nail specialist'},
        {'name': 'Charlie Brown', 'bio': 'Massage therapist'},
    ]

    services = []
    for data in service_data:
        svc = db.query(Service).filter(Service.name == data['name']).first()
        if not svc:
            svc = Service(**data)
            db.add(svc)
            db.flush()
        services.append(svc)

    employees = []
    for data in employees_data:
        emp = db.query(Employee).filter(Employee.name == data['name']).first()
        if not emp:
            emp = Employee(**data)
            db.add(emp)
            db.flush()
        employees.append(emp)

    db.commit()

    # Keep relations: employee1 has service2, employee2 has service1
    if len(employees) >= 1 and len(services) >= 2:
        if services[1] not in employees[0].services:
            employees[0].services.append(services[1])
    if len(employees) >= 2 and len(services) >= 1:
        if services[0] not in employees[1].services:
            employees[1].services.append(services[0])

    db.commit()

    # Add one example booking if none exists
    if db.query(Booking).count() == 0 and employees and services:
        booking_start = datetime.utcnow() + timedelta(days=1)
        booking_end = booking_start + timedelta(minutes=services[0].duration)
        booking = Booking(
            user_id='demo_user',
            service_id=services[0].id,
            employee_id=employees[0].id,
            start_time=booking_start,
            end_time=booking_end,
            status='scheduled'
        )
        db.add(booking)
        db.commit()

    db.close()
    print('Demo data inserted successfully.')


if __name__ == '__main__':
    seed_demo_data()
