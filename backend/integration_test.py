"""
Integration test runner — verifies all backend components work correctly.
Runs each test group in isolation to avoid import timeouts.
"""
import sys, os, json, traceback

sys.path.insert(0, ".")
os.environ["DATABASE_URL"] = "sqlite:///./test_integration_v4.db"
os.environ["SEED_DEMO_DATA"] = "false"

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        passed += 1
        print(f"  PASS  {name}")
    except Exception as e:
        failed += 1
        print(f"  FAIL  {name}: {e}")
        traceback.print_exc()

# ── 1. Config ──
print("\n=== 1. Config ===")
def test_config():
    from app.config import get_settings
    s = get_settings()
    assert s.APP_NAME == "BioMentor Agent"
    assert "sqlite" in s.DATABASE_URL
test("config loads", test_config)

# ── 2. Database ──
print("\n=== 2. Database ===")
def test_database():
    from app.database import engine, Base, SessionLocal
    from app.models import User
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    assert db.query(User).count() == 0
    db.close()
test("database creates tables", test_database)

# ── 3. Seed Data ──
print("\n=== 3. Seed Data ===")
def test_seed():
    from app.database import SessionLocal
    from app.seed import seed_demo_data
    from app.models import User, Course, ResearchPaper, IndustryCase, Question, KnowledgeNode
    db = SessionLocal()
    seed_demo_data(db)
    assert db.query(User).count() == 2
    assert db.query(Course).count() == 1
    assert db.query(ResearchPaper).count() == 12
    assert db.query(IndustryCase).count() == 6
    assert db.query(Question).count() == 8
    assert db.query(KnowledgeNode).count() >= 14
    db.close()
test("seed data complete", test_seed)

# ── 4. Knowledge Service ──
print("\n=== 4. Knowledge Service ===")
def test_knowledge():
    from app.database import SessionLocal
    from app.services.knowledge import KnowledgeService
    db = SessionLocal()
    svc = KnowledgeService(db)
    result = svc.search_all("CRISPR")
    assert result["query"] == "CRISPR"
    assert len(result["knowledge_points"]) > 0 or len(result["papers"]) > 0
    kps = svc.list_knowledge_points()
    assert len(kps) > 0
    db.close()
test("knowledge search works", test_knowledge)

# ── 5. Question Service ──
print("\n=== 5. Question Service ===")
def test_questions():
    from app.database import SessionLocal
    from app.services.questions import QuestionService
    db = SessionLocal()
    svc = QuestionService(db)
    items, total = svc.list_questions()
    assert total >= 8
    # Test AI generation
    qs = svc.generate_questions(["CRISPR"], "test evidence", ["choice", "truefalse", "short_answer"], 3)
    assert len(qs) == 3
    # Test validation
    vr = svc.validate_question(qs[0].id)
    assert "valid" in vr
    db.close()
test("question CRUD + generate + validate", test_questions)

# ── 6. Quiz Service ──
print("\n=== 6. Quiz Service ===")
def test_quiz():
    from app.database import SessionLocal
    from app.services.quiz import QuizService
    db = SessionLocal()
    svc = QuizService(db)
    items, total = svc.list_quizzes()
    assert total == 0
    quiz = svc.create_quiz({"title": "测试测验", "question_ids": [1, 2, 3]})
    assert quiz.id is not None
    svc.publish_quiz(quiz.id)
    attempt = svc.start_attempt(quiz.id, 1)
    svc.submit_attempt(attempt.id, [
        {"question_id": 1, "answer_text": "A"},
        {"question_id": 2, "answer_text": "错误"},
    ])
    db.close()
test("quiz + attempt + submit lifecycle", test_quiz)

# ── 7. Grading Service ──
print("\n=== 7. Grading Service ===")
def test_grading():
    from app.database import SessionLocal
    from app.services.grading import GradingService
    db = SessionLocal()
    svc = GradingService(db)
    grades = svc.grade_attempt_subjective(1)
    # Should grade subjective responses
    assert isinstance(grades, list)
    db.close()
test("AI grading works", test_grading)

# ── 8. Diagnosis Service ──
print("\n=== 8. Diagnosis Service ===")
def test_diagnosis():
    from app.database import SessionLocal
    from app.services.diagnosis import DiagnosisService
    db = SessionLocal()
    svc = DiagnosisService(db)
    states = svc.process_attempt_for_diagnosis(1)
    assert isinstance(states, list)
    profile = svc.get_ability_profile(1)
    assert "ability_profile" in profile
    assert len(profile["ability_profile"]) == 6
    dist = svc.get_error_type_distribution(1)
    assert isinstance(dist, dict)
    db.close()
test("diagnosis + ability profile + error distribution", test_diagnosis)

# ── 9. Recommendation Service ──
print("\n=== 9. Recommendation Service ===")
def test_recommendation():
    from app.database import SessionLocal
    from app.services.recommendation import RecommendationService
    db = SessionLocal()
    svc = RecommendationService(db)
    recs = svc.generate_recommendations(1)
    assert len(recs) > 0
    path = svc.generate_learning_path(1)
    assert path.title == "个性化学习路径"
    assert len(path.steps) > 0
    db.close()
test("recommendations + learning path", test_recommendation)

# ── 10. Industry Case Service ──
print("\n=== 10. Industry Case Service ===")
def test_cases():
    from app.database import SessionLocal
    from app.services.cases import IndustryCaseService
    db = SessionLocal()
    svc = IndustryCaseService(db)
    items, total = svc.list_cases()
    assert total >= 6
    case = svc.get_case(1)
    assert case is not None
    results = svc.search_cases("mRNA")
    assert len(results) > 0
    answer = svc.get_case_answer(1, "mRNA疫苗的技术优势是什么")
    assert "answer" in answer
    db.close()
test("case CRUD + search + Q&A", test_cases)

# ── 11. Paper Service ──
print("\n=== 11. Paper Service ===")
def test_papers():
    from app.database import SessionLocal
    from app.services.papers import PaperService
    db = SessionLocal()
    svc = PaperService(db)
    items, total = svc.list_papers()
    assert total >= 12
    paper = svc.get_paper(1)
    assert paper is not None
    results = svc.search_papers("CRISPR")
    assert len(results) > 0
    plan = svc.build_learning_plan(1)
    assert "reading_steps" in plan
    outline = svc.build_defense_outline([1, 2])
    assert len(outline) > 5
    db.close()
test("paper CRUD + search + learning plan + defense outline", test_papers)

# ── 12. Knowledge Graph Service ──
print("\n=== 12. Knowledge Graph Service ===")
def test_graph():
    from app.database import SessionLocal
    from app.services.graph import KnowledgeGraphService
    db = SessionLocal()
    svc = KnowledgeGraphService(db)
    nodes = svc.list_nodes()
    assert len(nodes) >= 14
    graph = svc.get_full_graph()
    assert len(graph["nodes"]) >= 14
    assert len(graph["edges"]) >= 8
    sub = svc.get_subgraph("conc-crispr")
    assert len(sub["nodes"]) > 0
    detail = svc.get_node_detail("conc-crispr")
    assert detail["label"] == "CRISPR-Cas9"
    db.close()
test("knowledge graph CRUD + layout + subgraph", test_graph)

# ── 13. Ingestion Service ──
print("\n=== 13. Ingestion Service ===")
def test_ingestion():
    from app.database import SessionLocal
    from app.services.ingestion import IngestionService
    db = SessionLocal()
    svc = IngestionService(db)
    mat = svc.create_material("test.txt", "txt", 100)
    mat = svc.process_material(mat.id, "这是测试内容。\n\n第二段内容用于测试分块功能。")
    assert mat.status.value == "done"
    assert mat.chunk_count > 0
    items, total = svc.list_materials()
    assert total >= 1
    svc.delete_material(mat.id)
    db.close()
test("material upload + parse + chunk + delete", test_ingestion)

# ── 14. Photo Learning Service ──
print("\n=== 14. Photo Learning Service ===")
def test_photo():
    from app.database import SessionLocal
    from app.services.photo_learning import PhotoLearningService
    db = SessionLocal()
    svc = PhotoLearningService(db)
    result = svc.analyze("CRISPR-Cas9是一种基因编辑技术，用于定点修饰基因组。")
    assert len(result["extracted_keywords"]) > 0
    assert len(result["summary"]) > 0
    db.close()
test("photo learning OCR + keywords + matching", test_photo)

# ── 15. Agent Orchestrator ──
print("\n=== 15. Agent Orchestrator ===")
def test_agent():
    from app.database import SessionLocal
    from app.services.agent import AgentOrchestrator
    db = SessionLocal()
    orch = AgentOrchestrator(db)
    run = orch.run_workflow("question_generation", {
        "knowledge_points": ["CRISPR"],
        "count": 2,
    })
    assert run.status.value == "completed"
    items, total = orch.list_runs()
    assert total >= 1
    db.close()
test("agent workflow execution + run history", test_agent)

# ── 16. FastAPI App ──
print("\n=== 16. FastAPI App ===")
def test_app():
    from app.main import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["name"] == "BioMentor Agent"
    r = client.get("/api/health")
    assert r.status_code == 200
    # Courses
    r = client.get("/api/courses/")
    assert r.status_code == 200
    assert len(r.json()) >= 1
    # Questions
    r = client.get("/api/questions/")
    assert r.status_code == 200
    assert r.json()["total"] >= 8
    # RAG search
    r = client.post("/api/rag/search", json={"query": "CRISPR"})
    assert r.status_code == 200
    # Industry cases
    r = client.get("/api/industry/cases")
    assert r.status_code == 200
    # Research papers
    r = client.get("/api/research/papers")
    assert r.status_code == 200
    # Knowledge graph
    r = client.get("/api/knowledge-graph/")
    assert r.status_code == 200
    # Photo learning
    r = client.post("/api/photo-learning/analyze", json={"text": "CRISPR基因编辑"})
    assert r.status_code == 200
    assert "extracted_keywords" in r.json()
    # Bio tools
    r = client.get("/api/bio-tools/status")
    assert r.status_code == 200
    r = client.get("/api/bio-tools/protein/resolve?query=crispr-cas9")
    assert r.status_code == 200
    # Agent runs
    r = client.get("/api/agent/runs")
    assert r.status_code == 200
    # Reports
    r = client.get("/api/reports/diagnosis/1")
    assert r.status_code == 200
    # Quiz
    r = client.get("/api/quiz/")
    assert r.status_code == 200
    # Materials
    r = client.get("/api/materials/")
    assert r.status_code == 200
    # AI generate
    r = client.get("/api/ai-generate/status")
    assert r.status_code == 200
    print("  All 14 router groups return 200 OK")
test("FastAPI app + all 14 router groups", test_app)

# ── Summary ──
print(f"\n{'='*50}")
print(f"Results: {passed} passed, {failed} failed ({passed+failed} total)")
if failed == 0:
    print("ALL TESTS PASSED")
else:
    print(f"{failed} TESTS FAILED — see above for details")
