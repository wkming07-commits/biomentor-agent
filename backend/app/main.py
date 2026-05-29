from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    agent,
    ai_generate,
    attempt,
    bio_tools,
    courses,
    diagnosis,
    industry_cases,
    knowledge_graph,
    materials,
    photo_learning,
    questions,
    quiz,
    rag,
    reports,
    research,
    tutor,
)

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(courses.router)
app.include_router(bio_tools.router)
app.include_router(materials.router)
app.include_router(questions.router)
app.include_router(quiz.router)
app.include_router(attempt.router)
app.include_router(reports.router)
app.include_router(diagnosis.router)
app.include_router(rag.router)
app.include_router(ai_generate.router)
app.include_router(industry_cases.router)
app.include_router(research.router)
app.include_router(photo_learning.router)
app.include_router(knowledge_graph.router)
app.include_router(agent.router)
app.include_router(tutor.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    if settings.SEED_DEMO_DATA:
        from app.seed import seed_demo_data
        db = next(get_db())
        try:
            seed_demo_data(db)
        finally:
            db.close()


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Dependency for router-level DB access
from app.database import get_db  # noqa: E402
