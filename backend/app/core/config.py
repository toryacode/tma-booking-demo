from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@postgres:5432/beauty_salon"
    secret_key: str = "changeme"
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""

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