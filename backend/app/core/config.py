from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@postgres:5432/beauty_salon"
    secret_key: str = "changeme"
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    telegram_default_chat_id: Optional[str] = None
    telegram_proxy_url: Optional[str] = None
    telegram_socks_link: Optional[str] = None
    telegram_request_timeout_seconds: int = 15
    telegram_init_data_ttl_seconds: int = 600

    class Config:
        env_file = ".env"

    @field_validator("database_url", mode="before")
    def normalize_database_url(cls, v):
        if not v:
            return "postgresql://user:password@postgres:5432/beauty_salon"
        if "localhost" in v:
            return v.replace("localhost", "postgres")
        return v


settings = Settings()