from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ---- Application ----
    APP_NAME: str = "BioMentor Agent"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered biology learning agent platform with RAG knowledge base, intelligent assessment, and adaptive learning paths"
    DEBUG: bool = False

    # ---- CORS ----
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3010",
        "http://127.0.0.1:3000",
    ]

    # ---- Database ----
    DATABASE_URL: str = "sqlite:///./biomentor.db"
    DB_ECHO: bool = False

    # ---- File Storage ----
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ---- Vector DB (Chroma) ----
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_MATERIALS: str = "course_materials"
    CHROMA_COLLECTION_PAPERS: str = "papers"
    CHROMA_COLLECTION_CASES: str = "cases"
    CHROMA_COLLECTION_QUESTIONS: str = "questions"

    # ---- Chunking ----
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 120

    # ---- LLM / Embedding ----
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 4096

    # ---- RAG ----
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.65

    # ---- Agent ----
    AGENT_MAX_RETRIES: int = 2
    AGENT_TIMEOUT_SECONDS: int = 120

    # ---- Assessment ----
    QUESTION_AUTO_PUBLISH: bool = False
    GRADING_CONFIDENCE_THRESHOLD: float = 0.75

    # ---- Demo / Seed ----
    SEED_DEMO_DATA: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def model_post_init(self, _context) -> None:
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.CHROMA_PERSIST_DIR, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
