from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.database import get_db
from app.schemas import PhotoLearningRequest, PhotoLearningResponse
from app.services.ocr import OcrService
from app.services.photo_learning import KEYWORD_DICT, PhotoLearningService

router = APIRouter(prefix="/api/photo-learning", tags=["photo-learning"])

ocr_service = OcrService()


@router.post("/ocr")
async def ocr_upload(file: UploadFile = File(...)):
    """Upload a file and extract text via the backend GLM pipeline."""
    if not file.filename:
        raise HTTPException(400, "文件名不能为空")

    mime = file.content_type or "application/octet-stream"
    data = await file.read()

    if len(data) == 0:
        raise HTTPException(400, "文件为空")
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(400, "文件超过 50MB 限制")

    result = await run_in_threadpool(ocr_service.extract, data, mime, file.filename)
    if not result.get("success"):
        raise HTTPException(502, str(result.get("error", "GLM extraction failed")))
    return result


@router.post("/analyze", response_model=PhotoLearningResponse)
def analyze_photo(data: PhotoLearningRequest, db: Session = Depends(get_db)):
    if not data.text.strip():
        raise HTTPException(400, "文本内容不能为空")

    service = PhotoLearningService(db)
    try:
        return service.analyze(data.text, data.image_base64)
    except RuntimeError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.post("/full-pipeline", response_model=PhotoLearningResponse)
async def full_pipeline(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Complete GLM pipeline: extract, analyze, and generate questions."""
    if not file.filename:
        raise HTTPException(400, "文件名不能为空")

    mime = file.content_type or "application/octet-stream"
    data = await file.read()

    if len(data) == 0:
        raise HTTPException(400, "文件为空")
    if len(data) > 50 * 1024 * 1024:
        raise HTTPException(400, "文件超过 50MB 限制")

    service = PhotoLearningService(db)
    try:
        return await run_in_threadpool(service.analyze_uploaded_file, data, mime, file.filename)
    except RuntimeError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.get("/keywords")
def get_keyword_dict():
    return {
        "total": len(KEYWORD_DICT),
        "keywords": KEYWORD_DICT,
    }
