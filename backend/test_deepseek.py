"""Quick DeepSeek connection test — no SQLAlchemy imports."""
import sys, json, time
sys.path.insert(0, ".")

# Set env before any imports
import os
os.environ["DATABASE_URL"] = "sqlite:///./_test_deepseek.db"
os.environ["SEED_DEMO_DATA"] = "false"

from app.services.llm import get_llm

llm = get_llm()
print(f"Provider: {'DeepSeek' if llm.is_deepseek else 'OpenAI/Other'}")
print(f"Available: {llm.available}")

# Test 1: Simple chat
print("\n=== Test 1: Simple chat ===")
start = time.time()
resp = llm.generate_text(
    system_prompt="你是一位生物学助手。请用中文回答。",
    user_prompt="用一句话解释CRISPR-Cas9是什么。",
    temperature=0.3, max_tokens=200,
)
print(f"  Response ({resp.duration_ms}ms, {resp.tokens_total} tokens):")
print(f"  {resp.content[:200]}")
print(f"  PASS" if resp.content else "  FAIL")

# Test 2: JSON structured output
print("\n=== Test 2: JSON output ===")
schema = {
    "type": "object",
    "properties": {
        "concept": {"type": "string"},
        "definition": {"type": "string"},
        "applications": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["concept", "definition", "applications"],
}
result = llm.generate_json(
    system_prompt="你是一位生物学专家。请输出JSON格式。",
    user_prompt="请解释CRISPR-Cas9，包括定义和3个应用场景。",
    schema=schema, temperature=0.2,
)
print(f"  concept: {result.get('concept', 'N/A')}")
print(f"  applications: {len(result.get('applications', []))} items")
print(f"  PASS" if result.get("concept") else "  FAIL")

# Test 3: Streaming
print("\n=== Test 3: Streaming ===")
chunks = []
for chunk in llm.chat_stream(
    messages=[
        {"role": "system", "content": "用中文简短回答。"},
        {"role": "user", "content": "DNA和RNA的区别是什么？用3个要点回答。"},
    ],
    temperature=0.3, max_tokens=300,
):
    chunks.append(chunk)
    print(chunk, end="", flush=True)
print(f"\n  Total chunks: {len(chunks)}")
print(f"  PASS" if len(chunks) > 0 else "  FAIL")

# Test 4: Question generation (full pipeline)
print("\n=== Test 4: Question generation ===")
from app.database import engine, Base, SessionLocal
from app.models import *
Base.metadata.create_all(bind=engine)
db = SessionLocal()
from app.services.questions import QuestionService
svc = QuestionService(db)
qs = svc.generate_questions(
    knowledge_points=["CRISPR-Cas9", "基因编辑"],
    evidence_text="CRISPR-Cas9是细菌的适应性免疫系统，由Cas9蛋白和gRNA组成。gRNA通过碱基互补配对识别靶DNA序列，Cas9在PAM序列附近产生双链断裂。",
    question_types=["choice", "truefalse", "short_answer"],
    count=3, difficulty="medium",
)
print(f"  Generated {len(qs)} questions:")
for q in qs:
    print(f"  [{q.type.value}] {q.stem[:80]}...")
print(f"  PASS" if len(qs) > 0 else "  FAIL")
db.close()

# Test 5: Grading
print("\n=== Test 5: Grading ===")
from app.services.grading import GradingService
db2 = SessionLocal()
# Create a test question and response
q = Question(
    type="short_answer", stem="说明CRISPR-Cas9的工作原理。",
    answer="CRISPR-Cas9由Cas9蛋白和gRNA组成。gRNA识别靶序列，Cas9在PAM位点切割DNA产生双链断裂。细胞通过NHEJ或HDR修复。",
    rubric=[{"dimension": "概念准确性", "max_score": 4, "description": "正确描述Cas9和gRNA的功能"},
             {"dimension": "机制完整性", "max_score": 3, "description": "包含识别、切割、修复三个环节"},
             {"dimension": "表达清晰度", "max_score": 3, "description": "语言简洁、逻辑清晰"}],
    difficulty="medium",
)
db2.add(q)
db2.commit()

from app.models import Response, GraderType
r = Response(attempt_id=1, question_id=q.id, answer_text="CRISPR-Cas9使用gRNA识别目标DNA，Cas9蛋白进行切割，然后细胞修复DNA。",
             is_correct=None, score=0, max_score=10, grader_type=GraderType.ai)
db2.add(r)
db2.commit()

g_svc = GradingService(db2)
grade = g_svc.grade_response(r.id)
if grade:
    print(f"  Score: {grade.score_breakdown}")
    print(f"  Feedback: {grade.feedback[:120]}")
    print(f"  Confidence: {grade.confidence}")
    print(f"  PASS")
else:
    print(f"  FAIL - no grade returned")
db2.close()

# Test 6: RAG search
print("\n=== Test 6: RAG ===")
db3 = SessionLocal()
from app.services.knowledge import KnowledgeService
k_svc = KnowledgeService(db3)
result = k_svc.search_all("CRISPR基因编辑技术", top_k=3)
print(f"  Answer: {result.get('answer', 'N/A')[:150]}")
print(f"  Sources: {len(result.get('sources', []))} found")
print(f"  PASS" if result.get("answer") else "  FAIL")
db3.close()

print(f"\n{'='*50}")
print("All tests completed!")
