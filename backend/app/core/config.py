from pydantic import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    telegram_bot_token: str
    telegram_bot_username: str

    class Config:
        env_file = ".env"


settings = Settings()