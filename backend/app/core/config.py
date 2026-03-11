from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ipv_user:ipv_password@localhost:5432/ipv_db"

    # CORS — comma-separated list
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # External SaaS
    SAAS_BASE_URL: str = "https://api.your-saas.example.com"
    SAAS_API_KEY: str = ""
    SAAS_TIMEOUT: int = 30

    # Email
    SMTP_HOST: str = "smtp.office365.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # Azure AD (optional)
    AZURE_TENANT_ID: str = ""
    AZURE_CLIENT_ID: str = ""
    AZURE_CLIENT_SECRET: str = ""

    @property
    def azure_enabled(self) -> bool:
        return bool(self.AZURE_TENANT_ID and self.AZURE_CLIENT_ID)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
