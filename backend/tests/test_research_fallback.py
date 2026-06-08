from unittest.mock import patch
from types import SimpleNamespace
import asyncio

from app.routers.research import generate_task
from app.schemas import ResearchTaskGenerateRequest
from app.services.research_service import ResearchService


class FakeUnavailableLLM:
    available = False

    def generate_json(self, *args, **kwargs):
        raise AssertionError("generate_json should not be called when LLM is unavailable")


class FakeFailingLLM:
    available = True

    def __init__(self, message: str):
        self.message = message

    def generate_json(self, *args, **kwargs):
        raise RuntimeError(self.message)


def _post_generate_task(topic: str = "mRNA 疫苗为什么需要 LNP？"):
    with patch(
        "app.services.research_service.ResearchService._match_local_cases",
        return_value=(
            [{"case_key": "case-004", "title": "mRNA 疫苗递送技术", "reason": "测试匹配"}],
            ["mRNA", "脂质纳米颗粒", "递送系统"],
            ["mRNA", "LNP", "vaccine delivery"],
        ),
    ):
        return generate_task(
            ResearchTaskGenerateRequest(topic=topic, case_key=None, mode="independent"),
            db=object(),
        )


def _assert_stable_fallback_response(data):
    assert data.topic
    assert data.research_question
    assert isinstance(data.related_knowledge_points, list)
    assert len(data.tasks) == 4
    assert [task.type for task in data.tasks] == [
        "literature_review",
        "experiment_design",
        "mechanism_explanation",
        "evidence_judgement",
    ]
    for task in data.tasks:
        assert task.title
        assert task.goal
        assert isinstance(task.steps, list)
        assert task.steps
        assert task.output_requirement
        assert isinstance(task.suggested_keywords, list)
        assert task.example_outline
    assert "本地训练框架" in data.source_scope
    assert "学习参考" in data.disclaimer


def test_generate_task_returns_four_tasks_when_llm_unavailable():
    with patch("app.services.research_service.get_llm", return_value=FakeUnavailableLLM()):
        data = _post_generate_task()

    _assert_stable_fallback_response(data)


def test_generate_task_request_accepts_topic_only():
    data = ResearchTaskGenerateRequest(topic="mRNA 疫苗为什么需要 LNP？", case_key=None, mode="independent")

    assert data.topic == "mRNA 疫苗为什么需要 LNP？"


def test_generate_task_request_fills_topic_from_case_title_or_core_question():
    from_title = ResearchTaskGenerateRequest(case_key="case-036", case_title="UPSIDE Foods 培养细胞食品")
    from_core = ResearchTaskGenerateRequest(
        case_key="case-036",
        core_question="如何评价由培养动物细胞制成食品原料的生产过程、安全性和产业化边界？",
    )

    assert from_title.topic == "UPSIDE Foods 培养细胞食品"
    assert from_core.topic == "如何评价由培养动物细胞制成食品原料的生产过程、安全性和产业化边界？"


def test_generate_task_returns_four_tasks_when_deepseek_balance_error():
    with patch("app.services.research_service.get_llm", return_value=FakeFailingLLM("402 Insufficient Balance")):
        data = _post_generate_task()

    _assert_stable_fallback_response(data)


def test_generate_task_returns_four_tasks_when_llm_raises_network_error():
    with patch("app.services.research_service.get_llm", return_value=FakeFailingLLM("network timeout")):
        data = _post_generate_task("CAR-T 细胞治疗为什么会出现抗原逃逸？")

    _assert_stable_fallback_response(data)


def test_generate_task_returns_fallback_when_grounded_generation_times_out(monkeypatch):
    async def slow_grounded_generation(*args, **kwargs):
        await asyncio.sleep(0.05)
        return {"source_mode": "ai_grounded", "tasks": []}

    monkeypatch.setattr(ResearchService, "GROUNDED_GENERATION_TIMEOUT_SECONDS", 0.01)
    with patch(
        "app.services.grounded_generation_service.GroundedGenerationService.generate_research_tasks",
        slow_grounded_generation,
    ):
        data = _post_generate_task("mRNA 疫苗为什么需要 LNP？")

    _assert_stable_fallback_response(data)


def test_generate_task_returns_fallback_when_grounded_generation_raises():
    async def failing_grounded_generation(*args, **kwargs):
        raise RuntimeError("GLM gateway timeout")

    with patch(
        "app.services.grounded_generation_service.GroundedGenerationService.generate_research_tasks",
        failing_grounded_generation,
    ):
        data = _post_generate_task("mRNA 疫苗为什么需要 LNP？")

    _assert_stable_fallback_response(data)


def test_generate_task_accepts_non_ai_grounded_payload_without_raising():
    async def local_grounded_generation(*args, **kwargs):
        return kwargs["local_builder"]()

    with patch(
        "app.services.grounded_generation_service.GroundedGenerationService.generate_research_tasks",
        local_grounded_generation,
    ):
        data = _post_generate_task("mRNA 疫苗为什么需要 LNP？")

    _assert_stable_fallback_response(data)


def _build_service_fallback(case_key, title, core_problem, keywords, knowledge_points):
    service = ResearchService.__new__(ResearchService)
    case = SimpleNamespace(
        case_key=case_key,
        title=title,
        subtitle="",
        industry_direction="测试方向",
        core_problem=core_problem,
        research_foundation=core_problem,
        display_focus=core_problem,
        recommended_keywords=keywords,
        knowledge_points=knowledge_points,
    )
    return service._build_fallback_task(
        core_problem,
        case_key,
        "case_driven",
        knowledge_points,
        keywords,
        [{"case_key": case_key, "title": title, "reason": "测试匹配"}],
        f"匹配产业案例：{title}（{case_key}）",
        case,
    )


def _task_text(response):
    return " ".join([task.title + " " + task.goal for task in response.tasks])


def test_case_036_fallback_tasks_follow_cultured_food_context():
    data = _build_service_fallback(
        "case-036",
        "UPSIDE Foods 培养细胞食品",
        "如何评价由培养动物细胞制成食品原料的生产过程、安全性和产业化边界？",
        ["培养细胞食品", "食品安全", "质量控制", "产业化"],
        ["细胞培养", "食品安全评价", "生产过程控制"],
    )

    text = _task_text(data)
    assert "培养细胞食品" in text
    assert "食品安全性" in text
    assert "质量控制" in text
    assert "产业化边界" in text
    assert "CRISPR" not in text
    assert "Prime Editing" not in text
    assert "LNP" not in text


def test_case_004_fallback_tasks_follow_mrna_lnp_context():
    data = _build_service_fallback(
        "case-004",
        "mRNA 疫苗递送技术",
        "如何把不稳定的 mRNA 安全递送进细胞并诱导免疫反应？",
        ["mRNA", "LNP", "递送", "内体逃逸"],
        ["mRNA 稳定性", "脂质纳米颗粒", "免疫反应"],
    )

    text = _task_text(data)
    assert "mRNA" in text
    assert "LNP" in text
    assert "递送" in text


def test_case_035_fallback_tasks_follow_alphafold_context():
    data = _build_service_fallback(
        "case-035",
        "AlphaFold DB 与蛋白结构预测",
        "如何评价蛋白结构预测结果在蛋白工程中的可靠性？",
        ["AlphaFold", "蛋白结构预测", "模型置信度", "蛋白工程"],
        ["蛋白结构", "模型置信度", "实验验证"],
    )

    text = _task_text(data)
    assert "AlphaFold" in text
    assert "结构预测" in text
    assert "蛋白" in text
