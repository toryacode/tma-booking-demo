#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db.session import SessionLocal
from app.models.service import Service

def seed_services():
    db = SessionLocal()
    services = [
        {"name": "Haircut", "duration": 60, "price": 50.0, "description": "Professional haircut"},
        {"name": "Manicure", "duration": 45, "price": 30.0, "description": "Nail care"},
        {"name": "Massage", "duration": 90, "price": 80.0, "description": "Relaxing massage"},
    ]
    for service_data in services:
        service = Service(**service_data)
        db.add(service)
    db.commit()
    db.close()
    print("Services seeded")

if __name__ == "__main__":
    seed_services()