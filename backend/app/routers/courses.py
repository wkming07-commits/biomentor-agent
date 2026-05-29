from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Course, Chapter, KnowledgePoint
from app.schemas import (
    CourseOut,
    CourseCreate,
    ChapterOut,
    ChapterCreate,
    KnowledgePointOut,
    KnowledgePointCreate,
)

router = APIRouter(prefix="/api/courses", tags=["courses"])


# ---- Courses ----

@router.get("/", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.created_at.desc()).all()


# ---- Global KP list (MUST be before /{course_id} to avoid route conflict) ----

@router.get("/knowledge-points", response_model=list[KnowledgePointOut])
def list_all_knowledge_points(db: Session = Depends(get_db)):
    return db.query(KnowledgePoint).order_by(KnowledgePoint.order).all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    return course


@router.post("/", response_model=CourseOut, status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


# ---- Chapters ----

@router.get("/{course_id}/chapters", response_model=list[ChapterOut])
def list_chapters(course_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Chapter)
        .filter(Chapter.course_id == course_id)
        .order_by(Chapter.order)
        .all()
    )


@router.post("/{course_id}/chapters", response_model=ChapterOut, status_code=201)
def create_chapter(course_id: int, data: ChapterCreate, db: Session = Depends(get_db)):
    chapter = Chapter(course_id=course_id, **data.model_dump())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter


# ---- Knowledge Points ----

@router.get("/{course_id}/chapters/{chapter_id}/knowledge-points", response_model=list[KnowledgePointOut])
def list_knowledge_points(chapter_id: int, db: Session = Depends(get_db)):
    return (
        db.query(KnowledgePoint)
        .filter(KnowledgePoint.chapter_id == chapter_id)
        .order_by(KnowledgePoint.order)
        .all()
    )


@router.post("/{course_id}/chapters/{chapter_id}/knowledge-points", response_model=KnowledgePointOut, status_code=201)
def create_knowledge_point(chapter_id: int, data: KnowledgePointCreate, db: Session = Depends(get_db)):
    kp = KnowledgePoint(chapter_id=chapter_id, **data.model_dump())
    db.add(kp)
    db.commit()
    db.refresh(kp)
    return kp
