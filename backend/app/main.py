from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import services, employees, bookings, auth
from app.db.base import Base
from app.db.session import engine
from app.core.scheduler import start_scheduler
import atexit
import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

# Import all models so tables are registered in metadata before create_all
import app.models

app = FastAPI(title="Beauty Salon Booking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router, prefix="/api", tags=["services"])
app.include_router(employees.router, prefix="/api", tags=["employees"])
app.include_router(bookings.router, prefix="/api", tags=["bookings"])
app.include_router(auth.router, prefix="/api", tags=["auth"])


def ensure_loyalty_booking_columns():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_price DOUBLE PRECISION"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_price DOUBLE PRECISION"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0"))
        conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_loyalty_discount BOOLEAN NOT NULL DEFAULT FALSE"))

def wait_for_db(max_retries=20, delay=2):
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except OperationalError as exc:
            if attempt + 1 == max_retries:
                raise
            time.sleep(delay)


@app.on_event("startup")
def on_startup():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    ensure_loyalty_booking_columns()
    start_scheduler()


@atexit.register
def on_shutdown():
    from app.core.scheduler import shutdown_scheduler
    shutdown_scheduler()