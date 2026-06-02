from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "API-Market"
    app_version: str = "5.0.0"
    app_env: str = "development"
    debug: bool = True

    host: str = "0.0.0.0"
    port: int = 8080

    database_url: str = "sqlite+aiosqlite:///./data/api_market.db"
    redis_url: str = "redis://localhost:6379/0"

    meilisearch_host: str = "http://localhost:7700"
    meilisearch_api_key: str = "masterKey"

    rate_limit_per_minute: int = 600
    rate_limit_search_per_minute: int = 120

    cors_origins: list[str] = ["*"]

    log_level: str = "INFO"

    github_token: str = ""
    openai_api_key: str = ""

    @property
    def data_dir(self) -> Path:
        return Path(__file__).resolve().parents[2] / "data"

    @model_validator(mode="after")
    def _validate_production_safety(self) -> Settings:
        # Wildcard CORS in production is a security risk: any origin can
        # read responses. Force operators to set an explicit allowlist.
        if self.app_env == "production" and "*" in self.cors_origins:
            raise ValueError(
                "cors_origins must not contain '*' when app_env='production'. "
                "Set CORS_ORIGINS to a comma-separated allowlist, e.g. "
                "CORS_ORIGINS=https://your-domain.example"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
