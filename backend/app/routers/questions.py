from fastapi import APIRouter

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("/")
def list_questions():
    return []
