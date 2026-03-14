from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    telegram_user_id: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    if not request.telegram_user_id:
        raise HTTPException(status_code=400, detail="telegram_user_id is required")

    access_token = create_access_token({"sub": request.telegram_user_id})
    return {"access_token": access_token, "token_type": "bearer"}
