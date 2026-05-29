"""
AI Tutor Router — general chat, streaming, knowledge-grounded tutoring.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.llm import get_llm
from app.services.knowledge import KnowledgeService
from app.services.prompts import TUTOR_SYSTEM

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.post("/chat")
def tutor_chat(payload: dict, db: Session = Depends(get_db)):
    """General AI tutor chat. Supports optional knowledge grounding via RAG."""
    query = payload.get("query", "")
    history = payload.get("history", [])
    use_rag = payload.get("use_rag", True)
    mode = payload.get("mode", "tutor")  # tutor, socratic, explain

    if not query.strip():
        raise HTTPException(400, "query不能为空")

    llm = get_llm()

    # Build messages
    messages = [{"role": "system", "content": TUTOR_SYSTEM}]

    # Add mode-specific instructions
    if mode == "socratic":
        messages[0]["content"] += "\n\n当前模式：苏格拉底式教学。请通过提问引导学生自己发现答案，不要直接给出完整解答。"
    elif mode == "explain":
        messages[0]["content"] += "\n\n当前模式：详细解释模式。请用通俗易懂的方式解释概念，可以使用比喻和例子。"

    # RAG grounding
    context = ""
    if use_rag:
        knowledge = KnowledgeService(db)
        rag_result = knowledge.search_all(query, top_k=3)
        if rag_result.get("answer"):
            context = f"\n\n参考资料：\n{rag_result['answer'][:2000]}"
            messages[0]["content"] += f"\n\n以下是与当前问题相关的参考资料，请基于这些资料回答：{context}"

    # Add history
    for h in history[-10:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    # Add current query
    messages.append({"role": "user", "content": query})

    response = llm.chat(messages, temperature=0.5, max_tokens=1000)

    return {
        "query": query,
        "answer": response.content,
        "mode": mode,
        "tokens": response.tokens_total,
        "model": response.model,
    }


@router.post("/chat/stream")
async def tutor_chat_stream(payload: dict, db: Session = Depends(get_db)):
    """Streaming AI tutor chat. Returns SSE (Server-Sent Events)."""
    query = payload.get("query", "")
    history = payload.get("history", [])
    mode = payload.get("mode", "tutor")

    if not query.strip():
        raise HTTPException(400, "query不能为空")

    llm = get_llm()
    messages = [{"role": "system", "content": TUTOR_SYSTEM}]

    if mode == "socratic":
        messages[0]["content"] += "\n\n当前模式：苏格拉底式教学。通过提问引导。"
    elif mode == "explain":
        messages[0]["content"] += "\n\n当前模式：详细解释模式。"

    # RAG grounding
    if payload.get("use_rag", True):
        knowledge = KnowledgeService(db)
        rag_result = knowledge.search_all(query, top_k=3)
        if rag_result.get("answer"):
            messages[0]["content"] += f"\n\n参考资料：{rag_result['answer'][:1500]}"

    for h in history[-10:]:
        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": query})

    async def generate():
        try:
            for chunk in llm.chat_stream(messages, temperature=0.5, max_tokens=1000):
                yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/health")
def tutor_health():
    llm = get_llm()
    return {"status": "ok", "llm_available": llm.available, "model": "gpt-4o"}
