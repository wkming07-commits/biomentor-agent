import json
import re
from pathlib import Path
from types import SimpleNamespace

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Course, IndustryCase, SourceType
from app.schemas import IndustryCaseOut
from app.services.retrieval_service import RetrievalService
from app.seed import _industry_case_values, _seed_industry_cases, seed_demo_data


ROOT = Path(__file__).resolve().parents[2]
SEED_PATH = ROOT / "backend/app/seed_data/industry_cases.json"
FRONTEND_PATH = ROOT / "frontend/data/industryCases.ts"


def _seed_cases():
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def _frontend_cases():
    source = FRONTEND_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"export const industryCases: IndustryCase\[] = (\[[\s\S]*?\]);\s*export const industryDirections",
        source,
    )
    assert match, "frontend fallback case array should be parseable"
    return json.loads(match.group(1))


def test_backend_seed_and_frontend_fallback_are_aligned():
    seed = _seed_cases()
    frontend = _frontend_cases()

    assert len(seed) == 36
    assert len(frontend) == len(seed)
    assert [item["case_key"] for item in seed] == [item["id"] for item in frontend]

    numbers = [int(item["case_key"].split("-")[-1]) for item in seed]
    assert numbers == list(range(1, 37))


def test_industry_case_distribution_is_balanced():
    seed = _seed_cases()
    distribution = {}
    for item in seed:
        distribution[item["category"]] = distribution.get(item["category"], 0) + 1

    assert len(distribution) == 9
    assert min(distribution.values()) >= 3
    assert max(distribution.values()) <= 5


def test_all_cases_keep_detail_fields_and_traceable_sources():
    required_fields = [
        "case_key",
        "title",
        "subtitle",
        "category",
        "industry_direction",
        "real_product_or_technology",
        "knowledge_points",
        "core_problem",
        "background",
        "research_foundation",
        "application_scenario",
        "application_value",
        "required_abilities",
        "recommended_keywords",
        "guide_questions",
        "linked_research_task",
        "display_focus",
        "migration_path",
        "evidence_level",
        "references",
    ]

    for item in _seed_cases():
        missing = [field for field in required_fields if not item.get(field)]
        assert not missing, f"{item['case_key']} missing {missing}"
        assert len(item["guide_questions"]) >= 3
        assert len(item["required_abilities"]) >= 3
        assert len(item["references"]) >= 1
        for ref in item["references"]:
            assert ref.get("title")
            assert ref.get("url", "").startswith("https://")
        joined = json.dumps(item, ensure_ascii=False)
        assert "DOI 待补" not in joined
        assert "PMID 待补" not in joined


def test_new_cases_are_not_card_only_summaries():
    for item in _seed_cases():
        case_no = int(item["case_key"].split("-")[-1])
        if case_no < 31:
            continue
        assert len(item["background"]) >= 120
        assert len(item["research_foundation"]) >= 120
        assert len(item["application_scenario"]) >= 80
        assert len(item["application_value"]) >= 80
        assert len(item["analysis_text"]) >= 80


def test_industry_case_response_schema_includes_detail_fields():
    case = _seed_cases()[3]
    payload = IndustryCaseOut.model_validate(SimpleNamespace(id=4, **case)).model_dump()

    assert payload["case_key"] == "case-004"
    assert payload["background"]
    assert payload["research_foundation"]
    assert payload["application_scenario"]
    assert payload["application_value"]
    assert payload["guide_questions"]
    assert payload["references"]


def test_retrieval_uses_local_case_detail_evidence():
    case = SimpleNamespace(**_seed_cases()[3])
    evidence = RetrievalService()._case_evidence(case)

    assert evidence["id"] == "case-detail-case-004"
    assert evidence["source_type"] == "local_case_detail"
    assert evidence["source_name"] == "本地产业案例详情"
    assert evidence["trust_level"] == "curated"
    assert "科研基础" in evidence["snippet"]
    assert "应用场景" in evidence["snippet"]


def test_seed_source_types_are_supported_by_backend_enum():
    import json
    from pathlib import Path
    from app.models import SourceType

    seed_path = Path(__file__).resolve().parents[1] / "app" / "seed_data" / "industry_cases.json"
    cases = json.loads(seed_path.read_text(encoding="utf-8"))

    supported = {item.name for item in SourceType}
    seen = set()

    for case in cases:
        case_source_type = case.get("source_type")
        if case_source_type:
            seen.add(case_source_type)

        for source in case.get("sources", []):
            source_type = source.get("type") or source.get("source_type")
            if source_type:
                seen.add(source_type)

        for source in case.get("references", []):
            source_type = source.get("type") or source.get("source_type")
            if source_type:
                seen.add(source_type)

    unsupported = seen - supported
    assert not unsupported, f"Unsupported source types in seed data: {sorted(unsupported)}"
    assert "product_page" in seen


def _memory_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return Session()


def test_seed_industry_cases_empty_database_loads_all_cases():
    db = _memory_session()
    try:
        _seed_industry_cases(db)
        db.commit()

        assert db.query(IndustryCase).count() == 36
        assert db.query(IndustryCase).filter(IndustryCase.case_key == "case-036").first() is not None
    finally:
        db.close()


def test_seed_demo_data_repairs_old_database_with_only_five_seed_cases():
    db = _memory_session()
    seed_cases = _seed_cases()
    try:
        db.add(Course(id=1, name="已有课程", name_en="", description="", teacher_name=""))
        for raw in seed_cases[:5]:
            values = _industry_case_values(raw)
            if values["case_key"] == "case-001":
                values["title"] = "旧标题，需要被 seed 更新"
            db.add(IndustryCase(**values))
        db.commit()

        seed_demo_data(db)

        assert db.query(IndustryCase).count() == 36
        assert db.query(IndustryCase).filter(IndustryCase.case_key == "case-036").first() is not None
        assert db.query(IndustryCase).filter(IndustryCase.case_key == "case-001").first().title == seed_cases[0]["title"]
    finally:
        db.close()


def test_seed_industry_cases_is_idempotent_and_preserves_custom_cases():
    db = _memory_session()
    try:
        _seed_industry_cases(db)
        db.commit()
        _seed_industry_cases(db)
        db.commit()

        custom = IndustryCase(
            case_key="custom-001",
            title="用户自定义案例",
            subtitle="",
            industry_direction="自定义方向",
            category="自定义分类",
            core_problem="用户自定义案例不应被 seed 删除",
            source_type="academic",
        )
        db.add(custom)
        db.commit()
        _seed_industry_cases(db)
        db.commit()

        assert db.query(IndustryCase).filter(IndustryCase.case_key.like("case-%")).count() == 36
        assert db.query(IndustryCase).filter(IndustryCase.case_key == "custom-001").first() is not None
        assert db.query(IndustryCase).count() == 37
    finally:
        db.close()


def test_seed_industry_cases_keeps_product_page_source_type_supported():
    db = _memory_session()
    try:
        _seed_industry_cases(db)
        db.commit()

        product_case = db.query(IndustryCase).filter(IndustryCase.source_type == SourceType.product_page).first()
        assert product_case is not None
        assert product_case.source_type == SourceType.product_page
    finally:
        db.close()
