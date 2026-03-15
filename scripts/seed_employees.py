#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db.session import SessionLocal
from app.models.employee import Employee
from app.models.schedule import Schedule
from datetime import time

def seed_employees():
    db = SessionLocal()
    employees = [
        {"name": "Alice Johnson", "bio": "Expert stylist"},
        {"name": "Bob Smith", "bio": "Nail specialist"},
        {"name": "Charlie Brown", "bio": "Massage therapist"},
    ]
    for emp_data in employees:
        employee = Employee(**emp_data)
        db.add(employee)
        db.flush()  # To get id
        # Add schedule Mon-Fri 9-17
        for weekday in range(5):
            schedule = Schedule(
                employee_id=employee.id,
                weekday=weekday,
                start_time=time(9, 0),
                end_time=time(17, 0)
            )
            db.add(schedule)
    db.commit()
    db.close()
    print("Employees seeded")

if __name__ == "__main__":
    seed_employees()