from fastapi import APIRouter

router = APIRouter(prefix="/api/ai-generate", tags=["ai-generate"])


@router.get("/")
def status():
    return {"status": "stub"}
