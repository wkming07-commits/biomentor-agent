from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import PhotoLearningRequest, PhotoLearningResponse
from app.services.photo_learning import PhotoLearningService

router = APIRouter(prefix="/api/photo-learning", tags=["photo-learning"])


@router.post("/analyze", response_model=PhotoLearningResponse)
def analyze_photo(data: PhotoLearningRequest, db: Session = Depends(get_db)):
    if not data.text.strip():
        raise HTTPException(400, "文本内容不能为空")

    service = PhotoLearningService(db)
    return service.analyze(data.text, data.image_base64)


@router.get("/keywords")
def get_keyword_dict():
    """Return the built-in biology keyword dictionary for frontend reference."""
    return {
        "total": len(PhotoLearningService.KEYWORD_DICT),
        "keywords": PhotoLearningService.KEYWORD_DICT,
    }
