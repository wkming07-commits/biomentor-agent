"""
Photo learning service for server-side material analysis.

Real behavior only:
- images: GLM visual understanding
- PDFs / documents / text: GLM extraction or parsing, then GLM analysis
- no local OCR
- no template fallback pretending the model succeeded
"""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import KnowledgePoint, ResearchPaper
from app.services.llm import get_llm
from app.services.ocr import OcrService
from app.services.prompts import PHOTO_ANALYSIS_SCHEMA, PHOTO_ANALYSIS_SYSTEM, PHOTO_ANALYSIS_USER

KEYWORD_DICT = [
    "CRISPR",
    "Cas9",
    "Cas12",
    "Prime editing",
    "base editing",
    "single-cell",
    "RNA-seq",
    "LNP",
    "mRNA",
    "AlphaFold",
    "protein design",
    "organoid",
    "TCR",
    "CAR-T",
    "spatial transcriptomics",
    "gene therapy",
    "synthetic biology",
    "gene editing",
    "protein engineering",
    "single-cell omics",
    "tumor microenvironment",
    "transcriptomics",
]

PHOTO_QUESTION_REPAIR_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {
                        "type": "string",
                        "enum": ["choice", "truefalse", "short_answer", "research", "industry"],
                    },
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string"},
                                "text": {"type": "string"},
                            },
                            "required": ["label", "text"],
                            "additionalProperties": False,
                        },
                    },
                    "answer": {"type": "string"},
                    "explanation": {"type": "string"},
                },
                "required": ["type", "question", "answer", "explanation"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}


class PhotoLearningService:
    def __init__(self, db: Session):
        self.db = db
        self.llm = get_llm()
        self.ocr_service = OcrService()

    def analyze_uploaded_file(self, file_bytes: bytes, mime_type: str, filename: str = "") -> dict[str, Any]:
        file_kind = self._resolve_file_kind(mime_type, filename)

        if file_kind == "image":
            llm_result = self._run_visual_analysis(
                file_bytes=file_bytes,
                mime_type=mime_type,
                filename=filename,
            )
            transcribed_text = str(llm_result.get("transcribed_text", "")).strip()
            if not transcribed_text:
                raise RuntimeError("GLM visual analysis did not return transcribed text")

            try:
                analysis = self._build_analysis(transcribed_text, llm_result)
            except RuntimeError:
                supplemental = self._run_text_analysis(transcribed_text)
                merged = dict(llm_result)
                merged.update(supplemental)
                merged["transcribed_text"] = transcribed_text
                analysis = self._build_analysis(transcribed_text, merged)

            return self._attach_processing_metadata(
                analysis,
                file_kind=file_kind,
                engine=f"glm-vision-analysis:{self.llm.settings.GLM_VISION_MODEL or 'glm-4v-flash'}",
                char_count=len(transcribed_text),
                filename=filename,
            )

        if file_kind == "pdf":
            llm_result = self._run_pdf_visual_analysis(
                file_bytes=file_bytes,
                filename=filename,
            )
            transcribed_text = str(llm_result.get("transcribed_text", "")).strip()
            if not transcribed_text:
                raise RuntimeError("GLM PDF analysis did not return transcribed text")

            analysis = self._build_analysis(transcribed_text, llm_result)
            return self._attach_processing_metadata(
                analysis,
                file_kind=file_kind,
                engine=f"glm-pdf-analysis:{self.llm.settings.GLM_VISION_MODEL or 'glm-4v-flash'}",
                char_count=len(transcribed_text),
                filename=filename,
            )

        extracted = self.ocr_service.extract(file_bytes, mime_type, filename)
        if not extracted.get("success"):
            raise RuntimeError(str(extracted.get("error", "GLM extraction failed")))

        extracted_text = str(extracted.get("text", "")).strip()
        if not extracted_text:
            raise RuntimeError("GLM parser returned empty text")

        analysis = self.analyze(extracted_text)
        return self._attach_processing_metadata(
            analysis,
            file_kind=file_kind,
            engine=str(extracted.get("engine", "")),
            char_count=int(extracted.get("char_count", 0) or 0),
            filename=str(extracted.get("filename", filename)),
        )

    def analyze(self, text: str, image_base64: str | None = None) -> dict[str, Any]:
        del image_base64
        normalized_text = text.strip()
        if not normalized_text:
            raise RuntimeError("No analyzable text was provided")

        llm_result = self._run_text_analysis(normalized_text)
        return self._build_analysis(normalized_text, llm_result)

    def _run_text_analysis(self, text: str) -> dict[str, Any]:
        if not self.llm.available:
            raise RuntimeError("LLM service unavailable for photo learning analysis")

        last_error: Exception | None = None
        for limit in (12000, 9000, 7000, 5000):
            try:
                result = self.llm.generate_json(
                    system_prompt=PHOTO_ANALYSIS_SYSTEM,
                    user_prompt=PHOTO_ANALYSIS_USER.format(text=text[:limit]),
                    schema=PHOTO_ANALYSIS_SCHEMA,
                    temperature=0.2,
                    max_tokens=2200,
                )
                if isinstance(result, dict) and result:
                    return result
            except Exception as exc:
                last_error = exc
                continue

        if last_error is not None:
            raise RuntimeError(f"GLM analysis failed: {last_error}") from last_error
        raise RuntimeError("GLM analysis returned empty data")

    def _run_visual_analysis(self, *, file_bytes: bytes, mime_type: str, filename: str) -> dict[str, Any]:
        if not self.llm.available:
            raise RuntimeError("LLM service unavailable for visual analysis")

        encoded = base64.b64encode(file_bytes).decode("ascii")
        content = [
            {
                "type": "text",
                "text": (
                    "Analyze this uploaded study image. "
                    "First put the core visible text into `transcribed_text`, then return keywords, domain, "
                    "summary, learning suggestions, and questions."
                ),
            },
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{encoded}"}},
        ]

        response = self.llm.chat(
            messages=[
                {"role": "system", "content": PHOTO_ANALYSIS_SYSTEM},
                {"role": "user", "content": content},
            ],
            model=self.llm.settings.GLM_VISION_MODEL or "glm-4v-flash",
            temperature=0.2,
            max_tokens=2200,
            response_schema=PHOTO_ANALYSIS_SCHEMA,
            retries=2,
        )
        if response.parsed:
            return response.parsed

        repaired = self.llm.chat(
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{PHOTO_ANALYSIS_SYSTEM}\n\n"
                        "Return one valid JSON object only. Do not output markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Filename: {filename or 'uploaded-file'}. Return JSON only."},
                        *content,
                    ],
                },
            ],
            model=self.llm.settings.GLM_VISION_MODEL or "glm-4v-flash",
            temperature=0.2,
            max_tokens=2200,
            response_schema=None,
            retries=1,
        )
        parsed = self.llm._extract_json(repaired.content)
        if parsed:
            return parsed
        raise RuntimeError("GLM visual analysis returned empty or invalid JSON")

    def _run_pdf_visual_analysis(self, *, file_bytes: bytes, filename: str) -> dict[str, Any]:
        if not self.llm.available:
            raise RuntimeError("LLM service unavailable for PDF analysis")

        encoded = base64.b64encode(file_bytes).decode("ascii")
        pdf_system_prompt = (
            f"{PHOTO_ANALYSIS_SYSTEM}\n\n"
            "For PDF inputs:\n"
            "- keep `transcribed_text` under 500 Chinese characters\n"
            "- keep `summary` under 180 Chinese characters\n"
            "- return 4 to 6 keywords\n"
            "- return exactly 4 questions: 2 choice, 1 truefalse, 1 short_answer\n"
            "- keep each explanation concise and factual\n"
            "- do not copy long passages from the PDF"
        )
        content = [
            {"type": "file_url", "file_url": {"url": f"data:application/pdf;base64,{encoded}"}},
            {
                "type": "text",
                "text": (
                    f"请把这份 PDF 当作学习材料进行分析。文件名：{filename or 'uploaded-file'}。"
                    "请严格返回结构化 JSON。"
                ),
            },
        ]

        response = self.llm.chat(
            messages=[
                {"role": "system", "content": pdf_system_prompt},
                {"role": "user", "content": content},
            ],
            model=self.llm.settings.GLM_VISION_MODEL or "glm-4v-flash",
            temperature=0.1,
            max_tokens=1400,
            response_schema=PHOTO_ANALYSIS_SCHEMA,
            retries=1,
            extra_body={"thinking": {"type": "disabled"}},
        )
        if response.parsed:
            return response.parsed

        repaired = self.llm.chat(
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{pdf_system_prompt}\n\n"
                        "Return one valid JSON object only. Do not output markdown."
                    ),
                },
                {"role": "user", "content": content},
            ],
            model=self.llm.settings.GLM_VISION_MODEL or "glm-4v-flash",
            temperature=0.1,
            max_tokens=1400,
            response_schema=None,
            retries=1,
            extra_body={"thinking": {"type": "disabled"}},
        )
        parsed = self.llm._extract_json(repaired.content)
        if parsed:
            return parsed
        raise RuntimeError("GLM PDF analysis returned empty or invalid JSON")

    def _build_analysis(self, text: str, llm_result: dict[str, Any]) -> dict[str, Any]:
        llm_keywords = self._normalize_string_list(llm_result.get("keywords"))
        dict_keywords = self._dict_extract(text)
        heuristic_keywords = self._heuristic_extract(text)
        all_keywords = list(dict.fromkeys(llm_keywords + dict_keywords + heuristic_keywords))[:12]
        if not all_keywords:
            raise RuntimeError("GLM analysis did not return usable keywords")

        summary = str(llm_result.get("summary") or llm_result.get("overview") or llm_result.get("core_summary") or "").strip()
        if not summary:
            raise RuntimeError("GLM analysis did not return a summary")

        learning_suggestions = self._normalize_string_list(
            llm_result.get("learning_suggestions") or llm_result.get("suggestions")
        )

        concepts, papers = self._match_knowledge(all_keywords[:8])
        questions = self._normalize_questions(llm_result.get("questions"))
        if len(questions) < 4:
            questions = self._repair_questions(
                text=text,
                llm_result=llm_result,
                existing_questions=questions,
                target_count=4,
            )
        if len(questions) == 0:
            questions = self._generate_question_regeneration_batch(text=text, llm_result=llm_result)
        if len(questions) == 0:
            raise RuntimeError("GLM analysis did not return enough usable questions")

        domain = str(llm_result.get("domain", "")).strip() or self._infer_domain(all_keywords, concepts)
        if not domain:
            raise RuntimeError("GLM analysis did not return a domain")

        return {
            "raw_text": text,
            "extracted_keywords": all_keywords,
            "domain": domain,
            "matched_concepts": concepts[:8],
            "matched_papers": papers[:6],
            "matched_tasks": [],
            "summary": summary,
            "learning_suggestions": learning_suggestions[:4],
            "questions": questions[:5],
        }

    def _attach_processing_metadata(
        self,
        analysis: dict[str, Any],
        *,
        file_kind: str,
        engine: str,
        char_count: int,
        filename: str,
    ) -> dict[str, Any]:
        analysis["source_kind"] = file_kind
        analysis["processing_engine"] = engine
        analysis["processing_char_count"] = char_count
        analysis["processing_filename"] = filename
        analysis["ocr_engine"] = engine
        analysis["ocr_char_count"] = char_count
        analysis["ocr_filename"] = filename
        return analysis

    def _resolve_file_kind(self, mime_type: str, filename: str) -> str:
        ext = os.path.splitext(filename or "")[1].lower()
        if (mime_type or "").startswith("image/") or ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}:
            return "image"
        if mime_type == "application/pdf" or ext == ".pdf":
            return "pdf"
        if mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or ext == ".docx":
            return "docx"
        if mime_type in {"text/plain", "text/markdown"} or ext in {".txt", ".md"}:
            return "text"
        return "unknown"

    def _normalize_string_list(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        normalized = [str(item).strip() for item in value if str(item).strip()]
        return list(dict.fromkeys(normalized))

    def _normalize_questions(self, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []

        normalized: list[dict[str, Any]] = []
        for index, item in enumerate(value):
            if not isinstance(item, dict):
                continue

            question_type = self._normalize_question_type(item.get("type"))
            question_text = str(
                item.get("question")
                or item.get("stem")
                or item.get("prompt")
                or item.get("title")
                or ""
            ).strip()
            answer = str(
                item.get("answer")
                or item.get("correct_answer")
                or item.get("reference_answer")
                or item.get("expected_answer")
                or ""
            ).strip()
            explanation = str(
                item.get("explanation")
                or item.get("analysis")
                or item.get("reason")
                or item.get("rationale")
                or ""
            ).strip()
            if question_type not in {"choice", "truefalse", "short_answer", "research", "industry"}:
                continue
            if not question_text or not answer or not explanation:
                continue

            options = self._normalize_question_options(item.get("options"))
            if question_type == "choice":
                if len(options) != 4:
                    continue

            normalized.append(
                {
                    "id": f"glm-{index + 1}",
                    "type": question_type,
                    "question": question_text,
                    "options": options,
                    "answer": answer,
                    "explanation": explanation,
                    "related_concept_ids": [],
                    "related_paper_ids": [],
                }
            )

        return normalized

    def _normalize_question_type(self, value: Any) -> str:
        text = str(value or "").strip().lower()
        aliases = {
            "research_industry": "research",
            "single_choice": "choice",
            "multiple_choice": "choice",
            "mcq": "choice",
            "select": "choice",
            "judge": "truefalse",
            "true_false": "truefalse",
            "true-false": "truefalse",
            "boolean": "truefalse",
            "tf": "truefalse",
            "short": "short_answer",
            "shortanswer": "short_answer",
            "short-answer": "short_answer",
            "qa": "short_answer",
            "open": "research",
        }
        return aliases.get(text, text)

    def _normalize_question_options(self, value: Any) -> list[dict[str, str]]:
        options: list[dict[str, str]] = []
        if isinstance(value, dict):
            for label, text in list(value.items())[:4]:
                clean_label = str(label).strip()
                clean_text = str(text).strip()
                if clean_label and clean_text:
                    options.append({"label": clean_label, "text": clean_text})
            return options

        if isinstance(value, list):
            for idx, opt in enumerate(value[:4]):
                if isinstance(opt, dict):
                    label = str(opt.get("label") or opt.get("key") or opt.get("name") or "").strip()
                    text = str(opt.get("text") or opt.get("content") or opt.get("value") or opt.get("option") or "").strip()
                    if not label and text:
                        label = chr(ord("A") + idx)
                    if label and text:
                        options.append({"label": label, "text": text})
                    continue
                clean_text = str(opt).strip()
                if clean_text:
                    options.append({"label": chr(ord("A") + idx), "text": clean_text})
        return options

    def _repair_questions(
        self,
        *,
        text: str,
        llm_result: dict[str, Any],
        existing_questions: list[dict[str, Any]],
        target_count: int,
    ) -> list[dict[str, Any]]:
        merged = self._merge_questions(existing_questions, [])
        if len(merged) >= target_count or not self.llm.available:
            return merged[:target_count]

        for _ in range(2):
            if len(merged) >= target_count:
                return merged[:target_count]
            generated = self._generate_question_repair_batch(
                text=text,
                llm_result=llm_result,
                existing_questions=merged,
                target_count=target_count,
            )
            merged = self._merge_questions(merged, generated)

        if len(merged) >= 3:
            return merged[:target_count]

        regenerated = self._generate_question_regeneration_batch(
            text=text,
            llm_result=llm_result,
        )
        merged = self._merge_questions(merged, regenerated)
        return merged[:target_count]

    def _generate_question_repair_batch(
        self,
        *,
        text: str,
        llm_result: dict[str, Any],
        existing_questions: list[dict[str, Any]],
        target_count: int,
    ) -> list[dict[str, Any]]:
        merged = self._merge_questions(existing_questions, [])
        if len(merged) >= target_count or not self.llm.available:
            return []

        existing_counts: dict[str, int] = {}
        for item in merged:
            question_type = str(item.get("type") or "").strip()
            existing_counts[question_type] = existing_counts.get(question_type, 0) + 1

        desired_order = ["choice", "choice", "truefalse", "short_answer", "research"]
        missing_types: list[str] = []
        target_counts = {"choice": 0, "truefalse": 0, "short_answer": 0, "research": 0}
        for question_type in desired_order:
            target_counts[question_type] += 1
        for question_type, expected_count in target_counts.items():
            current_count = existing_counts.get(question_type, 0)
            if current_count < expected_count:
                missing_types.extend([question_type] * (expected_count - current_count))

        if not missing_types:
            missing_types = ["research"] * max(0, target_count - len(merged))

        system_prompt = (
            "You are repairing an existing life-science learning quiz.\n"
            "Return exactly one JSON object in Simplified Chinese.\n"
            "Use only the provided material.\n"
            "Do not repeat existing questions.\n"
            "Every question must include a grounded answer and a concise explanation.\n"
            "Choice questions must contain exactly 4 options with labels A/B/C/D."
        )
        user_prompt = (
            "请基于以下学习材料补充缺失题目，并严格输出 JSON。\n\n"
            f"材料摘要：{str(llm_result.get('summary') or '').strip()}\n"
            f"关键词：{', '.join(self._normalize_string_list(llm_result.get('keywords'))[:8])}\n"
            f"已有题目：{json.dumps([item.get('question') for item in merged], ensure_ascii=False)}\n"
            f"需要补充的题型：{json.dumps(missing_types[: max(1, target_count - len(merged))], ensure_ascii=False)}\n"
            f"原始材料：{text[:4000]}"
        )

        try:
            repaired = self.llm.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=PHOTO_QUESTION_REPAIR_SCHEMA,
                temperature=0.1,
                max_tokens=1200,
            )
        except Exception:
            return []

        return self._normalize_questions(repaired.get("questions"))

    def _generate_question_regeneration_batch(
        self,
        *,
        text: str,
        llm_result: dict[str, Any],
    ) -> list[dict[str, Any]]:
        if not self.llm.available:
            return []

        system_prompt = (
            "You are generating a compact learning quiz from life-science study material.\n"
            "Return exactly one JSON object in Simplified Chinese.\n"
            "Use only the provided material.\n"
            "Generate exactly 4 questions: 2 choice, 1 truefalse, 1 short_answer.\n"
            "Every question must include a grounded answer and a concise explanation.\n"
            "Choice questions must contain exactly 4 options with labels A/B/C/D."
        )
        user_prompt = (
            "请根据以下学习材料重新生成一组高质量练习题，并严格输出 JSON。\n\n"
            f"材料摘要：{str(llm_result.get('summary') or '').strip()}\n"
            f"关键词：{', '.join(self._normalize_string_list(llm_result.get('keywords'))[:8])}\n"
            f"原始材料：{text[:4000]}"
        )
        try:
            regenerated = self.llm.generate_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=PHOTO_QUESTION_REPAIR_SCHEMA,
                temperature=0.1,
                max_tokens=1200,
            )
        except Exception:
            return []

        return self._normalize_questions(regenerated.get("questions"))

    def _merge_questions(
        self,
        primary: list[dict[str, Any]],
        secondary: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        merged: list[dict[str, Any]] = []
        seen: set[str] = set()
        for item in [*primary, *secondary]:
            question = str(item.get("question") or "").strip()
            if not question:
                continue
            key = question.lower()
            if key in seen:
                continue
            seen.add(key)
            merged.append(item)
        return merged

    def _dict_extract(self, text: str) -> list[str]:
        lower_text = text.lower()
        found = [kw for kw in KEYWORD_DICT if kw.lower() in lower_text]
        return sorted(set(found), key=lambda item: (-len(item), item.lower()))

    def _heuristic_extract(self, text: str) -> list[str]:
        candidates = re.findall(r"[A-Za-z][A-Za-z0-9+/\-]{2,}|[\u4e00-\u9fff]{2,10}", text)
        ranked: list[str] = []
        seen: set[str] = set()
        stop_words = {
            "学生",
            "内容",
            "分析",
            "知识",
            "学习",
            "建议",
            "问题",
            "答案",
            "解析",
            "文档",
            "教材",
            "文献",
        }
        for token in candidates:
            clean = token.strip()
            if not clean or clean.isdigit() or clean in stop_words or clean in seen:
                continue
            seen.add(clean)
            ranked.append(clean)
            if len(ranked) >= 8:
                break
        return ranked

    def _match_knowledge(self, keywords: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        concept_map: dict[int, dict[str, Any]] = {}
        paper_map: dict[int, dict[str, Any]] = {}

        for kw in keywords:
            for kp in (
                self.db.query(KnowledgePoint)
                .filter(or_(KnowledgePoint.name.contains(kw), KnowledgePoint.definition.contains(kw)))
                .limit(5)
                .all()
            ):
                concept_map[kp.id] = {
                    "id": kp.id,
                    "name": kp.name,
                    "category": kp.category,
                    "definition": (kp.definition or "")[:200],
                }

            for paper in (
                self.db.query(ResearchPaper)
                .filter(
                    or_(
                        ResearchPaper.title.contains(kw),
                        ResearchPaper.title_zh.contains(kw),
                        ResearchPaper.abstract.contains(kw),
                        ResearchPaper.core_problem.contains(kw),
                    )
                )
                .limit(5)
                .all()
            ):
                paper_map[paper.id] = {
                    "id": paper.id,
                    "title": paper.title,
                    "title_zh": paper.title_zh,
                    "direction": paper.direction,
                    "core_problem": (paper.core_problem or paper.abstract or "")[:200],
                }

        return list(concept_map.values()), list(paper_map.values())

    def _infer_domain(self, keywords: list[str], concepts: list[dict[str, Any]]) -> str:
        joined = " ".join(keywords + [str(concept.get("category", "")) for concept in concepts]).lower()
        if any(marker in joined for marker in ["crispr", "cas", "gene", "dna", "rna", "editing", "transcript"]):
            return "分子生物学 / 基因编辑"
        if any(marker in joined for marker in ["cell", "organoid", "tcr", "car-t"]):
            return "细胞生物学 / 细胞治疗"
        if any(marker in joined for marker in ["protein", "alphafold", "enzyme", "structure"]):
            return "蛋白质科学 / 结构生物学"
        if any(marker in joined for marker in ["drug", "therapy", "lnp", "mrna"]):
            return "生物医药 / 药物递送"
        return "生命科学"
