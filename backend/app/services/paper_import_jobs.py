from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Literal
from uuid import uuid4

from app.database import SessionLocal
from app.services.papers import PaperService

PaperImportStatus = Literal["queued", "running", "succeeded", "failed"]


@dataclass
class PaperImportJob:
    job_id: str
    filename: str
    status: PaperImportStatus = "queued"
    message: str = "等待后台解析"
    paper_id: int | None = None
    paper_title: str = ""
    error: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "filename": self.filename,
            "status": self.status,
            "message": self.message,
            "paper_id": self.paper_id,
            "paper_title": self.paper_title,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class PaperImportJobManager:
    def __init__(self, max_workers: int = 2) -> None:
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="paper-import")
        self._jobs: dict[str, PaperImportJob] = {}
        self._futures: dict[str, Future] = {}
        self._lock = Lock()

    def submit(self, *, filename: str, content: bytes) -> PaperImportJob:
        job = PaperImportJob(job_id=uuid4().hex, filename=filename)
        with self._lock:
            self._jobs[job.job_id] = job
        future = self._executor.submit(self._run_job, job.job_id, filename, content)
        with self._lock:
            self._futures[job.job_id] = future
        return job

    def get(self, job_id: str) -> PaperImportJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def _update(self, job_id: str, **updates) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            for key, value in updates.items():
                setattr(job, key, value)
            job.updated_at = datetime.now(timezone.utc)

    def _run_job(self, job_id: str, filename: str, content: bytes) -> None:
        self._update(job_id, status="running", message="正在调用 GLM 解析 PDF 并写入文献库")
        db = SessionLocal()
        try:
            service = PaperService(db)
            paper = service.import_pdf(filename=filename, content=content)
            title = paper.title_zh or paper.title
            self._update(
                job_id,
                status="succeeded",
                message="PDF 已解析并入库",
                paper_id=paper.id,
                paper_title=title,
            )
        except Exception as exc:
            self._update(
                job_id,
                status="failed",
                message="PDF 后台解析失败",
                error=str(exc),
            )
        finally:
            db.close()


paper_import_jobs = PaperImportJobManager(max_workers=2)
