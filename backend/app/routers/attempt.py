from fastapi import APIRouter

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


@router.get("/")
def list_attempts():
    return []
