from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ResearchPaperOut, ResearchPaperCreate
from app.schemas import ResearchTaskGenerateRequest, ResearchTaskGenerateResponse
from app.services.papers import PaperService
from app.services.research_service import ResearchService
from app.services.grounded_generation_service import GroundedGenerationService

router = APIRouter(prefix="/api/research", tags=["research"])


@router.get("/papers", response_model=dict)
def list_papers(
    direction: str | None = Query(None),
    difficulty: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = PaperService(db)
    items, total = service.list_papers(direction, difficulty, page, page_size)
    return {
        "items": [service.serialize_paper(p) for p in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/papers/search")
def search_papers(q: str = Query(..., min_length=1), limit: int = Query(10), db: Session = Depends(get_db)):
    service = PaperService(db)
    return [service.serialize_paper(p) for p in service.search_papers(q, limit)]


@router.get("/papers/by-ids", response_model=list[ResearchPaperOut])
def get_papers_by_ids(
    ids: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    paper_ids = [int(item) for item in ids.split(",") if item.strip().isdigit()]
    service = PaperService(db)
    return [service.serialize_paper(p) for p in service.get_papers_by_ids(paper_ids)]


@router.get("/papers/demo")
def demo_papers(db: Session = Depends(get_db)):
    service = PaperService(db)
    return [service.serialize_paper(p) for p in service.get_demo_papers()]


@router.get("/papers/{paper_id}", response_model=ResearchPaperOut)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    service = PaperService(db)
    paper = service.get_paper(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found")
    return service.serialize_paper(paper)


@router.post("/papers", response_model=ResearchPaperOut, status_code=201)
def create_paper(data: ResearchPaperCreate, db: Session = Depends(get_db)):
    service = PaperService(db)
    return service.serialize_paper(service.create_paper(data.model_dump()))


@router.get("/papers/{paper_id}/analysis")
def get_paper_analysis(paper_id: int, db: Session = Depends(get_db)):
    service = PaperService(db)
    analysis = service.analyze_paper(paper_id)
    if analysis.get("error") == "Paper not found":
        raise HTTPException(404, "Paper not found")
    return analysis


@router.get("/papers/{paper_id}/learning-plan")
def get_paper_learning_plan(paper_id: int, db: Session = Depends(get_db)):
    service = PaperService(db)
    plan = service.build_learning_plan(paper_id)
    if not plan:
        raise HTTPException(404, "Paper not found")
    return plan


@router.post("/papers/defense-outline")
def build_defense_outline(paper_ids: list[int], db: Session = Depends(get_db)):
    service = PaperService(db)
    return {"outline": service.build_defense_outline(paper_ids)}


@router.post("/papers/research-tasks")
def build_research_tasks(paper_ids: list[int], db: Session = Depends(get_db)):
    service = PaperService(db)
    return {"tasks": service.build_research_tasks(paper_ids)}


@router.get("/tasks")
def list_research_tasks(direction: str | None = Query(None), db: Session = Depends(get_db)):
    """Return research tasks from the knowledge base."""
    from app.models import KnowledgePoint, ResearchPaper
    kps = db.query(KnowledgePoint).filter(KnowledgePoint.category.in_(["实验方法", "前沿技术", "AI模型", "应用方向", "基础概念"])).all()

    tasks = []
    for kp in kps:
        steps = kp.learning_path if isinstance(kp.learning_path, list) and len(kp.learning_path) > 0 else _default_steps(kp.name, kp.category)
        related_papers = db.query(ResearchPaper).filter(
            ResearchPaper.title_zh.contains(kp.name) | ResearchPaper.direction.contains(kp.name)
        ).limit(2).all()
        tasks.append({
            "id": f"task-kp-{kp.id}",
            "title": f"{kp.name} 实验探究",
            "difficulty": kp.difficulty.value if kp.difficulty else "medium",
            "scenario": kp.definition or f"围绕{kp.name}设计一个可操作的实验方案",
            "knowledge_point": kp.name,
            "category": kp.category,
            "steps": steps,
            "related_papers": [{"id": p.id, "title_zh": p.title_zh} for p in related_papers],
        })

    return tasks


@router.post("/generate-task", response_model=ResearchTaskGenerateResponse)
def generate_task(data: ResearchTaskGenerateRequest, db: Session = Depends(get_db)):
    mode = data.mode
    if mode == "independent" and data.case_key:
        mode = "case_driven"
    if mode not in ("independent", "case_driven"):
        raise HTTPException(400, "mode must be 'independent' or 'case_driven'")
    if mode == "case_driven" and not data.case_key:
        raise HTTPException(400, "case_key is required for case_driven mode")
    if not data.topic.strip():
        raise HTTPException(400, "topic is required")
    service = ResearchService(db)
    try:
        return service.generate_task(data.topic, data.case_key, mode)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception:
        return ResearchService(db)._build_fallback_task(
            data.topic,
            data.case_key,
            mode,
            [],
            [],
            [],
            "当前资料暂不足，使用本地训练框架。",
        )


@router.post("/tutor")
async def research_tutor(body: dict, db: Session = Depends(get_db)):
    service = GroundedGenerationService(db)
    case_id = body.get("case_id") or body.get("case_key") or body.get("caseId")
    case_title = body.get("case_title") or body.get("caseTitle")
    try:
        return await service.answer_tutor(
            question=str(body.get("question") or ""),
            case_id=case_id,
            case_title=case_title,
            selected_task=body.get("selected_task") if isinstance(body.get("selected_task"), dict) else None,
            selected_literature=body.get("selected_literature") if isinstance(body.get("selected_literature"), list) else [],
        )
    except Exception:
        return {
            "source_mode": "local_fallback",
            "answer": "当前可以先围绕案例核心问题继续拆解：机制是什么、有哪些产业案例、需要哪些文献支撑、适合生成什么训练任务。建议补充关键词或选择一个科研训练任务后继续提问。",
            "evidence_used": [],
            "suggested_next_questions": ["有哪些产业案例可参考？", "这个案例的核心机制是什么？", "需要哪些文献支撑？"],
            "boundary": "该回答用于科研训练，不替代真实实验设计审批。",
        }


def _default_steps(name: str, category: str) -> list[str]:
    """Generate default steps for knowledge points without explicit learning paths."""
    base = [
        f"文献调研：检索{name}相关的最新研究进展",
        f"概念梳理：理解{name}的核心原理和关键机制",
        f"实验设计：基于{name}设计验证性实验方案",
        f"数据分析：对实验结果进行统计分析和可视化",
        f"报告撰写：整理研究发现，撰写实验报告或综述",
    ]
    if category == "实验方法":
        base.insert(2, f"方法实操：在实验室或模拟环境中操作{name}相关技术")
    elif category == "AI模型":
        base.insert(2, f"模型应用：使用{name}进行数据分析和预测")
    return base
