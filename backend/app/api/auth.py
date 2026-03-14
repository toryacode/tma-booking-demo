from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.core.security import create_access_token, verify_token

router = APIRouter(prefix="/auth")


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


from fastapi import Depends, Header
from app.core.security import verify_token


@router.get("/me")
def me(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"telegram_user_id": payload["sub"]}

