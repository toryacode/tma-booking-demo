from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.core.security import create_access_token, verify_token
from app.core.telegram_auth import validate_and_extract_user, TelegramInitDataError

router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    init_data: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    if not request.init_data:
        raise HTTPException(status_code=400, detail="init_data is required")

    try:
        validated = validate_and_extract_user(request.init_data)
    except TelegramInitDataError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user = validated["user"]
    user_id = str(user["id"])

    access_token = create_access_token(
        {
            "sub": user_id,
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "username": user.get("username"),
            "photo_url": user.get("photo_url"),
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def me(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "telegram_user_id": payload["sub"],
        "first_name": payload.get("first_name"),
        "last_name": payload.get("last_name"),
        "username": payload.get("username"),
        "photo_url": payload.get("photo_url"),
    }

