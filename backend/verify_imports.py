"""
Fast import verification — tests each module independently without DB access.
Run: python verify_imports.py
"""
import sys, time
sys.path.insert(0, ".")

modules = [
    ("config", "app.config"),
    ("database", "app.database"),
    ("models", "app.models"),
    ("schemas", "app.schemas"),
    ("services/knowledge", "app.services.knowledge"),
    ("services/questions", "app.services.questions"),
    ("services/quiz", "app.services.quiz"),
    ("services/grading", "app.services.grading"),
    ("services/diagnosis", "app.services.diagnosis"),
    ("services/recommendation", "app.services.recommendation"),
    ("services/cases", "app.services.cases"),
    ("services/ingestion", "app.services.ingestion"),
    ("services/graph", "app.services.graph"),
    ("services/agent", "app.services.agent"),
    ("services/photo_learning", "app.services.photo_learning"),
    ("services/papers", "app.services.papers"),
    ("services/bio_tools", "app.services.bio_tools"),
    ("routers/courses", "app.routers.courses"),
    ("routers/materials", "app.routers.materials"),
    ("routers/questions", "app.routers.questions"),
    ("routers/quiz", "app.routers.quiz"),
    ("routers/attempt", "app.routers.attempt"),
    ("routers/reports", "app.routers.reports"),
    ("routers/diagnosis", "app.routers.diagnosis"),
    ("routers/rag", "app.routers.rag"),
    ("routers/ai_generate", "app.routers.ai_generate"),
    ("routers/industry_cases", "app.routers.industry_cases"),
    ("routers/research", "app.routers.research"),
    ("routers/photo_learning", "app.routers.photo_learning"),
    ("routers/knowledge_graph", "app.routers.knowledge_graph"),
    ("routers/agent", "app.routers.agent"),
    ("routers/bio_tools", "app.routers.bio_tools"),
    ("seed", "app.seed"),
    ("main (FastAPI app)", "app.main"),
]

passed = 0
failed = 0
for name, mod in modules:
    start = time.time()
    try:
        __import__(mod)
        elapsed = (time.time() - start) * 1000
        print(f"  PASS  {name:40s} ({elapsed:6.0f}ms)")
        passed += 1
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        print(f"  FAIL  {name:40s} ({elapsed:6.0f}ms) — {e}")
        failed += 1
        # Print full traceback for the first failure
        if failed == 1:
            import traceback
            traceback.print_exc()

print(f"\n{'='*60}")
if failed == 0:
    print(f"ALL {passed} MODULES IMPORTED SUCCESSFULLY")
else:
    print(f"{passed} passed, {failed} FAILED — see above")
