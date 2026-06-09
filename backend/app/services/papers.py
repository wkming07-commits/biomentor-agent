"""
Paper Service — LLM-powered research paper analysis, learning plans, defense outlines.
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models import ResearchPaper
from app.config import get_settings
from app.services.llm import get_llm
from app.services.embedding import EmbeddingService
from app.services.ingestion import IngestionService
from app.services.prompts import PAPER_ANALYSIS_SYSTEM, PAPER_ANALYSIS_USER, PAPER_ANALYSIS_SCHEMA

PAPER_IMPORT_SYSTEM = """你是科研论文信息抽取助手。请从上传的 PDF 文本中提取结构化文献信息。

要求：
1. 只根据提供的 PDF 文本抽取，不要编造不存在的信息。
2. 如果 PDF 中没有明确中文标题，可将 title_zh 留空字符串。
3. year 必须是四位数字；无法确认时返回 0。
4. keywords 与 related_concepts 请返回简洁列表。
5. source_type 固定返回“学术文献”。
6. teaching_value 与 research_value 要从教学和科研角度分别概括，不要泛泛而谈。
"""

PAPER_IMPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "title_zh": {"type": "string"},
        "direction": {"type": "string"},
        "venue": {"type": "string"},
        "year": {"type": "integer"},
        "source_type": {"type": "string"},
        "keywords": {"type": "array", "items": {"type": "string"}},
        "abstract": {"type": "string"},
        "core_problem": {"type": "string"},
        "method_summary": {"type": "string"},
        "key_finding": {"type": "string"},
        "teaching_value": {"type": "string"},
        "research_value": {"type": "string"},
        "related_concepts": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "title",
        "direction",
        "year",
        "source_type",
        "keywords",
        "abstract",
        "core_problem",
        "method_summary",
        "key_finding",
        "teaching_value",
        "research_value",
        "related_concepts",
    ],
    "additionalProperties": False,
}


class PaperService:

    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.settings = get_settings()
        self.vector = EmbeddingService()

    def list_papers(self, direction: str | None = None, difficulty: str | None = None,
                    page: int = 1, page_size: int = 20) -> tuple[list[ResearchPaper], int]:
        q = self.db.query(ResearchPaper)
        if direction: q = q.filter(ResearchPaper.direction == direction)
        if difficulty: q = q.filter(ResearchPaper.reading_difficulty == difficulty)
        total = q.count()
        items = q.order_by(ResearchPaper.created_at.desc(), ResearchPaper.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def get_paper(self, paper_id: int) -> ResearchPaper | None:
        return self.db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()

    def get_papers_by_ids(self, paper_ids: list[int]) -> list[ResearchPaper]:
        if not paper_ids:
            return []
        papers = (
            self.db.query(ResearchPaper)
            .filter(ResearchPaper.id.in_(paper_ids))
            .all()
        )
        paper_map = {paper.id: paper for paper in papers}
        return [paper_map[paper_id] for paper_id in paper_ids if paper_id in paper_map]

    def create_paper(self, data: dict) -> ResearchPaper:
        paper = ResearchPaper(**data)
        self.db.add(paper)
        self.db.commit()
        self.db.refresh(paper)
        return paper

    def index_paper_to_knowledge_base(self, paper_id: int, full_text: str | None = None) -> int:
        paper = self.get_paper(paper_id)
        if not paper:
            return 0

        text = (full_text or "").strip()
        if not text and paper.pdf_storage_path:
            try:
                text = IngestionService.extract_text_from_pdf(paper.pdf_storage_path).strip()
            except Exception:
                text = ""

        chunks = self._build_index_chunks(paper, text)
        if not chunks:
            return 0

        ids = [f"paper-{paper.id}-chunk-{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "paper_id": paper.id,
                "chunk_index": i,
                "title": paper.title_zh or paper.title,
                "filename": paper.pdf_filename or paper.title,
                "direction": paper.direction or "",
                "source_type": "paper",
            }
            for i in range(len(chunks))
        ]

        self.vector.delete_by_where(self.settings.VECTOR_COLLECTION_PAPERS, {"paper_id": paper.id})
        self.vector.index_chunks(
            self.settings.VECTOR_COLLECTION_PAPERS,
            chunks,
            metadatas=metadatas,
            ids=ids,
            embeddings=None,
        )
        return len(chunks)

    def _build_index_chunks(self, paper: ResearchPaper, full_text: str) -> list[str]:
        title = paper.title_zh or paper.title
        summary = "\n".join(
            [
                f"Title: {title}",
                f"Direction: {paper.direction or ''}",
                f"Venue: {paper.venue or ''}",
                f"Year: {paper.year or ''}",
                f"Keywords: {', '.join(paper.keywords or [])}",
                f"Abstract: {paper.abstract or ''}",
                f"Core problem: {paper.core_problem or ''}",
                f"Method summary: {paper.method_summary or ''}",
                f"Key finding: {paper.key_finding or ''}",
                f"Teaching value: {paper.teaching_value or ''}",
                f"Research value: {paper.research_value or ''}",
            ]
        ).strip()

        if not full_text:
            return [summary] if summary else []

        chunker = IngestionService(self.db)
        body_chunks = chunker._chunk_text(full_text)
        if not body_chunks:
            return [summary] if summary else []

        chunks: list[str] = []
        for i, chunk in enumerate(body_chunks):
            if i == 0:
                chunks.append(f"{summary}\n\nFull text excerpt:\n{chunk}".strip())
            else:
                chunks.append(f"Title: {title}\n\n{chunk}".strip())
        return chunks

    def serialize_paper(self, paper: ResearchPaper) -> dict[str, Any]:
        def _enum_value(value: Any, default: str) -> str:
            if value is None:
                return default
            return value.value if hasattr(value, "value") else str(value)

        def _text(value: Any) -> str:
            return "" if value is None else str(value)

        def _int(value: Any, default: int = 0) -> int:
            return default if value is None else int(value)

        def _bool(value: Any, default: bool = False) -> bool:
            return default if value is None else bool(value)

        def _list(value: Any) -> list[Any]:
            return [] if value is None else list(value)

        return {
            "id": paper.id,
            "title": paper.title,
            "title_zh": _text(paper.title_zh),
            "direction": _text(paper.direction),
            "venue": _text(paper.venue),
            "year": _int(paper.year, 2024),
            "source_type": _text(paper.source_type) or "学术文献",
            "keywords": _list(paper.keywords),
            "abstract": _text(paper.abstract),
            "core_problem": _text(paper.core_problem),
            "method_summary": _text(paper.method_summary),
            "key_finding": _text(paper.key_finding),
            "teaching_value": _text(paper.teaching_value),
            "research_value": _text(paper.research_value),
            "pdf_filename": _text(paper.pdf_filename),
            "pdf_storage_path": _text(paper.pdf_storage_path),
            "pdf_text_char_count": _int(paper.pdf_text_char_count),
            "evidence_level": _enum_value(paper.evidence_level, "medium"),
            "reading_difficulty": _enum_value(paper.reading_difficulty, "medium"),
            "suggested_reading_order": _int(paper.suggested_reading_order),
            "selectable": _bool(paper.selectable, True),
            "can_support_demo": _bool(paper.can_support_demo, False),
            "demo_scenarios": _list(paper.demo_scenarios),
            "demo_questions": _list(paper.demo_questions),
            "discussion_prompts": _list(paper.discussion_prompts),
            "recommended_for": _list(paper.recommended_for),
            "experiment_learning_value": _text(paper.experiment_learning_value),
            "defense_value": _text(paper.defense_value),
            "related_concepts": _list(paper.related_concepts),
            "related_tools": _list(paper.related_tools),
            "related_cases": _list(paper.related_cases),
        }

    def import_pdf(self, filename: str, content: bytes) -> ResearchPaper:
        if not filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF files are supported")

        storage_dir = Path(self.settings.UPLOAD_DIR) / "research_papers"
        storage_dir.mkdir(parents=True, exist_ok=True)

        safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(filename).stem).strip("._") or "paper"
        storage_name = f"{safe_stem}-{uuid.uuid4().hex[:12]}.pdf"
        storage_path = storage_dir / storage_name
        storage_path.write_bytes(content)

        extracted_text = IngestionService.extract_text_from_pdf(str(storage_path)).strip()
        if (
            not extracted_text
            or extracted_text.startswith("GLM file parser")
            or extracted_text.startswith("GLM API key")
            or extracted_text.startswith("GLM direct PDF parsing failed")
            or extracted_text.startswith("GLM layout parsing failed")
            or "GLM direct PDF parsing failed" in extracted_text[:500]
            or "GLM layout parsing failed" in extracted_text[:500]
        ):
            storage_path.unlink(missing_ok=True)
            raise RuntimeError(extracted_text or "Failed to extract readable text from PDF")

        payload = self._build_import_payload(
            filename=filename,
            storage_path=storage_path,
            extracted_text=extracted_text,
        )
        return self.create_paper(payload)

    def _build_import_payload(self, filename: str, storage_path: Path, extracted_text: str) -> dict[str, Any]:
        parsed: dict[str, Any] = {}

        if self.llm.available:
            user_prompt = (
                f"原始文件名：{filename}\n"
                "请从以下 PDF 文本中抽取文献信息并输出 JSON。\n\n"
                f"{extracted_text[:16000]}"
            )
            try:
                parsed = self.llm.generate_json(
                    system_prompt=PAPER_IMPORT_SYSTEM,
                    user_prompt=user_prompt,
                    schema=PAPER_IMPORT_SCHEMA,
                    temperature=0.1,
                )
            except Exception:
                parsed = {}

        if self._is_complete_import_metadata(parsed):
            year = parsed.get("year")
            if not isinstance(year, int) or year < 1000 or year > 2100:
                year = 0

            return {
                "title": str(parsed.get("title", "")).strip(),
                "title_zh": str(parsed.get("title_zh", "")).strip(),
                "direction": str(parsed.get("direction", "")).strip(),
                "venue": str(parsed.get("venue", "")).strip(),
                "year": year,
                "source_type": str(parsed.get("source_type", "学术文献")).strip() or "学术文献",
                "keywords": self._normalize_text_list(parsed.get("keywords")),
                "abstract": str(parsed.get("abstract", "")).strip(),
                "core_problem": str(parsed.get("core_problem", "")).strip(),
                "method_summary": str(parsed.get("method_summary", "")).strip(),
                "key_finding": str(parsed.get("key_finding", "")).strip(),
                "teaching_value": str(parsed.get("teaching_value", "")).strip(),
                "research_value": str(parsed.get("research_value", "")).strip(),
                "related_concepts": self._normalize_text_list(parsed.get("related_concepts")),
                "pdf_filename": filename,
                "pdf_storage_path": str(storage_path.resolve()),
                "pdf_text_char_count": len(extracted_text),
            }

        return self._build_fallback_import_payload(filename, storage_path, extracted_text)

    def _is_complete_import_metadata(self, parsed: dict[str, Any]) -> bool:
        return bool(
            parsed.get("title")
            and parsed.get("direction")
            and parsed.get("abstract")
            and parsed.get("core_problem")
            and parsed.get("method_summary")
            and parsed.get("key_finding")
        )

    def _build_fallback_import_payload(
        self,
        filename: str,
        storage_path: Path,
        extracted_text: str,
    ) -> dict[str, Any]:
        lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
        title = self._extract_fallback_title(filename, lines)
        abstract = self._join_excerpt(lines, max_chars=1800)
        keywords = self._extract_keywords(extracted_text)
        year = self._extract_year(extracted_text)

        return {
            "title": title,
            "title_zh": "",
            "direction": "待整理文献",
            "venue": "",
            "year": year,
            "source_type": "学术文献",
            "keywords": keywords,
            "abstract": abstract,
            "core_problem": abstract[:400] or f"{title} 的核心问题待补充整理。",
            "method_summary": self._join_excerpt(lines[5:], max_chars=400) or "方法摘要待补充整理。",
            "key_finding": self._join_excerpt(lines[10:], max_chars=400) or "关键发现待补充整理。",
            "teaching_value": "已完成 PDF 文本提取，可继续人工补充教学价值。",
            "research_value": "已完成 PDF 文本提取，可继续人工补充研究价值。",
            "related_concepts": keywords[:8],
            "pdf_filename": filename,
            "pdf_storage_path": str(storage_path.resolve()),
            "pdf_text_char_count": len(extracted_text),
        }

    def _extract_fallback_title(self, filename: str, lines: list[str]) -> str:
        file_title = Path(filename).stem.replace("_", " ").strip()
        for line in lines[:8]:
            compact = " ".join(line.split())
            if self._is_usable_fallback_title(compact):
                return compact
        return file_title or "Imported Paper"

    def _is_usable_fallback_title(self, text: str) -> bool:
        if not 8 <= len(text) <= 300:
            return False
        lowered = text.lower()
        blocked_fragments = (
            "<div",
            "</div",
            "![](",
            "page=",
            "bbox=",
            "# 获奖证书",
            "获奖证书",
            "同学：",
            "特颁此证",
        )
        return not any(fragment in lowered for fragment in blocked_fragments)

    def _join_excerpt(self, lines: list[str], max_chars: int) -> str:
        if not lines:
            return ""
        joined = " ".join(lines)
        joined = re.sub(r"\s+", " ", joined).strip()
        return joined[:max_chars]

    def _extract_year(self, text: str) -> int:
        years = re.findall(r"\b(19\d{2}|20\d{2}|2100)\b", text[:4000])
        if not years:
            return 0
        return max(int(year) for year in years)

    def _extract_keywords(self, text: str, limit: int = 8) -> list[str]:
        candidates = re.findall(r"\b[A-Za-z][A-Za-z0-9\-]{3,}\b", text[:6000])
        seen: list[str] = []
        seen_lower: set[str] = set()
        for item in candidates:
            lowered = item.lower()
            if lowered in {
                "abstract",
                "introduction",
                "results",
                "discussion",
                "methods",
                "figure",
                "table",
                "copyright",
            }:
                continue
            if lowered not in seen_lower:
                seen.append(item)
                seen_lower.add(lowered)
            if len(seen) >= limit:
                break
        return seen

    def update_paper(self, paper_id: int, data: dict) -> ResearchPaper | None:
        paper = self.get_paper(paper_id)
        if not paper:
            return None

        for key, value in data.items():
            if hasattr(paper, key):
                setattr(paper, key, value)

        self.db.commit()
        self.db.refresh(paper)
        return paper

    def delete_paper(self, paper_id: int) -> bool:
        paper = self.get_paper(paper_id)
        if not paper:
            return False

        if paper.pdf_storage_path:
            try:
                Path(paper.pdf_storage_path).unlink(missing_ok=True)
            except Exception:
                pass

        self.db.delete(paper)
        self.db.commit()
        return True

    def search_papers(self, query: str, limit: int = 10) -> list[ResearchPaper]:
        lower = query.lower()
        return self.db.query(ResearchPaper).filter(
            ResearchPaper.title.contains(lower) | ResearchPaper.title_zh.contains(lower) |
            ResearchPaper.direction.contains(lower) | ResearchPaper.abstract.contains(lower)
        ).limit(limit).all()

    def get_demo_papers(self) -> list[ResearchPaper]:
        return self.db.query(ResearchPaper).filter(ResearchPaper.can_support_demo == True).order_by(
            ResearchPaper.suggested_reading_order).limit(12).all()

    # ── LLM-Powered Paper Analysis ───────────────────────────────

    def analyze_paper(self, paper_id: int) -> dict[str, Any]:
        """LLM deep analysis of a paper."""
        paper = self.get_paper(paper_id)
        if not paper: return {"error": "Paper not found"}

        if not self.llm.available:
            raise RuntimeError("LLM service unavailable for paper analysis")

        user_prompt = PAPER_ANALYSIS_USER.format(
            title=paper.title_zh or paper.title,
            abstract=paper.abstract or paper.core_problem,
            methods=paper.method_summary,
            findings=paper.key_finding,
            direction=paper.direction,
        )
        result = self.llm.generate_json(
            system_prompt=PAPER_ANALYSIS_SYSTEM,
            user_prompt=user_prompt,
            schema=PAPER_ANALYSIS_SCHEMA,
            temperature=0.4,
        )

        if not result.get("one_sentence_summary") or not result.get("teaching_points"):
            raise RuntimeError("LLM returned incomplete paper analysis")

        return {"paper_id": paper.id, "title": paper.title_zh, **result}

    def build_learning_plan(self, paper_id: int) -> dict[str, Any] | None:
        paper = self.get_paper(paper_id)
        if not paper: return None

        # Try LLM analysis first
        analysis = self.analyze_paper(paper_id)

        return {
            "paper_id": paper.id, "title": paper.title_zh or paper.title,
            "learning_goal": f"深入理解《{paper.title_zh}》，掌握{paper.direction}领域的核心方法",
            "prerequisite_concepts": paper.related_concepts or [],
            "one_sentence_summary": analysis.get("one_sentence_summary", ""),
            "key_innovation": analysis.get("key_innovation", ""),
            "reading_steps": [
                f"第一步：阅读摘要和引言（5-10分钟）——理解研究动机",
                f"第二步：精读方法部分（15-20分钟）——重点关注：{paper.method_summary[:100]}",
                f"第三步：理解核心发现（10分钟）——{paper.key_finding[:100]}",
                f"第四步：思考教学和研究价值（10分钟）",
                f"第五步：阅读讨论部分，记录疑问和思考",
            ],
            "method_breakdown": analysis.get("method_breakdown", []),
            "experiment_thinking": analysis.get("experiment_ideas", []),
            "defense_talking_points": analysis.get("defense_talking_points", [
                f"核心贡献：{paper.key_finding[:150]}",
                f"领域定位：{paper.direction}领域的{paper.source_type}",
                f"教学启示：{paper.teaching_value[:150]}",
            ]),
            "discussion_questions": analysis.get("discussion_questions", paper.demo_questions or []),
            "reading_difficulty": analysis.get("reading_difficulty", "中等"),
        }

    def build_defense_outline(self, paper_ids: list[int]) -> list[str]:
        papers = self.db.query(ResearchPaper).filter(ResearchPaper.id.in_(paper_ids)).all()
        if not papers: return ["尚未选择文献，无法生成答辩提纲"]

        outline = [
            "一、为什么选择这些文献",
            *[f"  {i}. 《{p.title_zh}》— {p.direction} — {p.venue} ({p.year})" for i, p in enumerate(papers, 1)],
            f"  覆盖{len(set(p.direction for p in papers))}个生物学前沿方向", "",
            "二、研究方向覆盖",
            *[f"  · {p.direction}：{p.core_problem[:80]}..." for p in papers], "",
            "三、对BioMentor知识库的支撑",
            *[f"  · 《{p.title_zh[:30]}》：{p.teaching_value[:100]}..." for p in papers], "",
            "四、AI + 生物制造教育创新",
            "  · AI在生物学研究中的应用：蛋白质设计、知识图谱推理、单细胞模型解释",
            "  · 计算与实验融合的新范式", "  · 前沿文献转化为可教可学的教学资源",
        ]
        return outline

    def build_research_tasks(self, paper_ids: list[int]) -> list[dict[str, Any]]:
        papers = self.get_papers_by_ids(paper_ids)
        if not papers:
            return []

        tasks: list[dict[str, Any]] = []
        for paper in papers[:5]:
            title = paper.title_zh or paper.title
            concepts = paper.related_concepts or []
            tasks.append(
                {
                    "id": f"paper-task-{paper.id}",
                    "title": f"{title[:40]} 文献研读与实验设计",
                    "difficulty": self._map_difficulty_label(paper.reading_difficulty.value if hasattr(paper.reading_difficulty, 'value') else str(paper.reading_difficulty)),
                    "scenario": paper.core_problem or f"围绕《{title}》提炼可验证的研究问题，并设计一个后续验证方案。",
                    "input_knowledge": "、".join(concepts[:6]) if concepts else (paper.direction or "相关领域基础知识"),
                    "expected_output": f"输出一份包含文献精读笔记、方法拆解、实验设计和讨论问题的综合报告，重点围绕：{paper.key_finding[:80] or title}",
                    "steps": [
                        "精读标题、摘要和引言，明确研究背景与核心问题",
                        f"拆解方法路线：{(paper.method_summary or '梳理论文中的关键实验与分析流程')[:120]}",
                        f"归纳关键发现：{(paper.key_finding or '提炼数据如何支撑结论')[:120]}",
                        "基于论文局限性提出一个可执行的改进实验或扩展研究方向",
                    ],
                    "evaluation_rubric": [
                        "是否准确理解论文要解决的科学问题",
                        "是否能正确拆解核心方法并说明关键变量",
                        "是否提出了有可行性的后续实验或优化思路",
                    ],
                }
            )
        return tasks

    def _normalize_text_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in re.split(r"[，,;；\n]", value) if item.strip()]
        return []

    def _map_difficulty_label(self, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized in {"easy", "入门"}:
            return "入门"
        if normalized in {"hard", "较难", "挑战"}:
            return "挑战"
        return "进阶"
