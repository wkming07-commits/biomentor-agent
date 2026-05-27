from fastapi import APIRouter

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("/")
def list_courses():
    return []
