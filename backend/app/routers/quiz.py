from fastapi import APIRouter

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/")
def list_quizzes():
    return []
