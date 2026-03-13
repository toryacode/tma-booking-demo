from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import services, employees, bookings
from app.db.base import Base
from app.db.session import engine
from app.core.scheduler import start_scheduler
import atexit

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

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    start_scheduler()

@atexit.register
def on_shutdown():
    from app.core.scheduler import shutdown_scheduler
    shutdown_scheduler()