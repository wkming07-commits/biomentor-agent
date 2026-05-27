from fastapi import APIRouter

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("/")
def list_materials():
    return []
