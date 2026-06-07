from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ResearchPaperOut, ResearchPaperUpdate
from app.services.paper_import_jobs import paper_import_jobs
from app.services.papers import PaperService

router = APIRouter(prefix="/api/research/papers", tags=["paper-library"])


@router.post("/import-pdf", status_code=202)
async def import_paper_pdf(
    file: UploadFile = File(...),
):
    filename = file.filename or "paper.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    job = paper_import_jobs.submit(filename=filename, content=content)
    return job.to_dict()


@router.get("/import-pdf/jobs/{job_id}")
def get_import_paper_pdf_job(job_id: str):
    job = paper_import_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job.to_dict()


@router.patch("/{paper_id}", response_model=ResearchPaperOut)
def update_paper(
    paper_id: int,
    payload: ResearchPaperUpdate,
    db: Session = Depends(get_db),
):
    service = PaperService(db)
    updated = service.update_paper(
        paper_id,
        payload.model_dump(exclude_none=True),
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Paper not found")
    return service.serialize_paper(updated)


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: int,
    db: Session = Depends(get_db),
):
    service = PaperService(db)
    deleted = service.delete_paper(paper_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paper not found")
    return {"success": True, "paper_id": paper_id}
