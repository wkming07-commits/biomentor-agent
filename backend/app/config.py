from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "BioMentor Agent"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = "Biology learning agent platform"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3010"]

    class Config:
        env_file = "../.env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
