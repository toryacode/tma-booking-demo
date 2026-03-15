#!/usr/bin/env python3
from app.db.base import Base
from app.db.session import engine, SessionLocal
from seed_demo_data import seed_demo_data


def reset_database():
    print('Dropping all tables...')
    Base.metadata.drop_all(bind=engine)
    print('Recreating tables...')
    Base.metadata.create_all(bind=engine)

    print('Seeding demo data...')
    seed_demo_data()

    print('Reset completed.')


if __name__ == '__main__':
    reset_database()
