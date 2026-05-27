from fastapi import APIRouter

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/search")
def search():
    return {"results": []}
