from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Material, MaterialChunk
from app.schemas import MaterialOut, MaterialChunkOut, PaginatedResponse
from app.services.ingestion import IngestionService

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("/", response_model=dict)
def list_materials(
    course_id: int | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = IngestionService(db)
    items, total = service.list_materials(course_id, status, page, page_size)
    return {
        "items": [MaterialOut.model_validate(m) for m in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{material_id}", response_model=MaterialOut)
def get_material(material_id: int, db: Session = Depends(get_db)):
    service = IngestionService(db)
    material = service.get_material(material_id)
    if not material:
        raise HTTPException(404, "Material not found")
    return material


@router.get("/{material_id}/chunks", response_model=list[MaterialChunkOut])
def get_chunks(material_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MaterialChunk)
        .filter(MaterialChunk.material_id == material_id)
        .order_by(MaterialChunk.chunk_index)
        .all()
    )


@router.post("/upload", response_model=MaterialOut, status_code=201)
async def upload_material(
    file: UploadFile = File(...),
    course_id: int | None = Form(None),
    chapter_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    content = await file.read()
    filename = file.filename or "untitled"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    file_type_map = {"pdf": "pdf", "docx": "docx", "doc": "docx", "txt": "txt", "md": "txt"}
    file_type = file_type_map.get(ext, "txt")

    service = IngestionService(db)

    material = service.create_material(
        filename=filename,
        file_type=file_type,
        file_size=len(content),
        course_id=course_id,
        chapter_id=chapter_id,
    )

    # Extract text based on type
    if file_type == "txt":
        text = IngestionService.extract_text_from_txt(content)
    elif file_type == "pdf":
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            text = IngestionService.extract_text_from_pdf(tmp_path)
        finally:
            os.unlink(tmp_path)
    elif file_type == "docx":
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            text = IngestionService.extract_text_from_docx(tmp_path)
        finally:
            os.unlink(tmp_path)
    else:
        text = IngestionService.extract_text_from_txt(content)

    material = service.process_material(material.id, text)
    return material


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    service = IngestionService(db)
    if not service.delete_material(material_id):
        raise HTTPException(404, "Material not found")
    return {"detail": "deleted"}
