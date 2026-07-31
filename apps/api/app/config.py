"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the local API."""

    app_name: str = "0186 Personal Assistant API"
    environment: str = "development"
    cors_origins: list[str] = [
        "http://localhost:1420",
        "tauri://localhost",
        "http://tauri.localhost",
    ]

    model_config = SettingsConfigDict(
        env_prefix="ASSISTANT_", env_file=".env", extra="ignore"
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        """Accept a comma-separated environment value or a list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    """Return the cached process-wide settings instance."""
    return Settings()
