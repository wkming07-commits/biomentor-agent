"""Fast DeepSeek test — no SQLAlchemy, just API calls."""
import os, sys, json, time

# Set env before any imports
os.environ["DATABASE_URL"] = "sqlite:///./_ignore.db"
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY", "sk-placeholder")
os.environ["OPENAI_BASE_URL"] = "https://api.deepseek.com"
os.environ["LLM_MODEL"] = "deepseek-chat"
os.environ["AGENT_TIMEOUT_SECONDS"] = "60"

sys.path.insert(0, ".")

# Direct import — skip the services/__init__.py chain
from app.config import get_settings
settings = get_settings()
print(f"Base URL: {settings.OPENAI_BASE_URL}")
print(f"Model: {settings.LLM_MODEL}")

from openai import OpenAI
client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
    timeout=60,
)

# Test 1: Basic chat
print("\n=== Test 1: Basic chat ===")
start = time.time()
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一位生物学助手。用中文回答，简洁准确。"},
        {"role": "user", "content": "用一句话解释CRISPR-Cas9是什么。"},
    ],
    temperature=0.3,
    max_tokens=200,
)
elapsed = (time.time() - start) * 1000
content = resp.choices[0].message.content
tokens = resp.usage.total_tokens if resp.usage else 0
print(f"  [{elapsed:.0f}ms, {tokens} tokens] {content}")

# Test 2: JSON structured output
print("\n=== Test 2: JSON structured output ===")
start = time.time()
schema_desc = """请严格按照以下JSON格式输出：
{
  "concept": "概念名称",
  "definition": "一句话定义",
  "applications": ["应用1", "应用2", "应用3"]
}"""
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": f"你是生物学专家。{schema_desc} 只输出JSON，不要有其他文字。"},
        {"role": "user", "content": "请介绍CRISPR-Cas9，包括定义和3个应用场景。"},
    ],
    temperature=0.2,
    max_tokens=500,
    response_format={"type": "json_object"},
)
elapsed2 = (time.time() - start) * 1000
raw = resp.choices[0].message.content or ""
try:
    data = json.loads(raw)
    print(f"  [{elapsed2:.0f}ms] concept={data.get('concept','?')}")
    print(f"  applications: {data.get('applications', [])}")
except json.JSONDecodeError:
    print(f"  JSON parse failed. Raw: {raw[:200]}")

# Test 3: Streaming
print("\n=== Test 3: Streaming ===")
start = time.time()
stream = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "用中文回答，3个要点以内，简洁。"},
        {"role": "user", "content": "DNA和RNA的3个主要区别"},
    ],
    temperature=0.3,
    max_tokens=300,
    stream=True,
)
chunk_count = 0
for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
        chunk_count += 1
elapsed3 = (time.time() - start) * 1000
print(f"\n  [{elapsed3:.0f}ms] {chunk_count} chunks received")

# Test 4: Tutor prompt
print("\n=== Test 4: Tutor mode ===")
start = time.time()
resp = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是BioMentor Agent，一位面向生命科学领域的AI学习导师。用苏格拉底式教学法，通过提问引导学生自己思考。不要直接给出答案。"},
        {"role": "user", "content": "我想知道基因编辑技术可能带来哪些伦理问题？"},
    ],
    temperature=0.6,
    max_tokens=500,
)
elapsed4 = (time.time() - start) * 1000
print(f"  [{elapsed4:.0f}ms] {resp.choices[0].message.content[:300]}...")

print(f"\n{'='*50}")
print("All 4 DeepSeek API tests completed!")
print(f"Total time: {elapsed+elapsed2+elapsed3+elapsed4:.0f}ms")
