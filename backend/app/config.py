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
    OPENAI_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    EMBEDDING_MODEL: str = "local-all-MiniLM-L6-v2"
    LLM_MODEL: str = "glm-4-flash-250414"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 4096

    # ---- GLM evidence-grounded generation ----
    GLM_API_KEY: str = ""
    GLM_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    GLM_MODEL: str = "glm-4-flash-250414"
    GLM_VISION_MODEL: str = "glm-4v-flash"
    GLM_FILE_PARSER_TOOL: str = "prime-sync"
    GLM_TIMEOUT_SECONDS: int = 30
    GLM_FILE_PARSER_TIMEOUT_SECONDS: int = 180

    # ---- RAG ----
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.65

    # ---- Agent ----
    AGENT_MAX_RETRIES: int = 2
    AGENT_TIMEOUT_SECONDS: int = 45

    # ---- Assessment ----
    QUESTION_AUTO_PUBLISH: bool = False
    GRADING_CONFIDENCE_THRESHOLD: float = 0.75

    # ---- Literature ----
    LITERATURE_PROVIDER: str = "pubmed"
    LITERATURE_SEMANTIC_SCHOLAR_API_KEY: str = ""
    LITERATURE_NCBI_API_KEY: str = ""
    LITERATURE_NCBI_TOOL: str = "biomentor-agent"
    LITERATURE_NCBI_EMAIL: str = ""

    # ---- Demo / Seed ----
    SEED_DEMO_DATA: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def model_post_init(self, _context) -> None:
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.CHROMA_PERSIST_DIR, exist_ok=True)

    def resolved_llm_api_key(self) -> str:
        return self.GLM_API_KEY.strip()

    def resolved_llm_base_url(self) -> str:
        value = (self.GLM_BASE_URL or "").strip().rstrip("/")
        return value or "https://open.bigmodel.cn/api/paas/v4"

    def resolved_llm_model(self) -> str:
        return (self.GLM_MODEL or self.LLM_MODEL or "glm-4-flash").strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
