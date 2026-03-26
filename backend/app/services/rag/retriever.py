from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.core.config import settings
from app.services.rag.prompt_builder import build_professor_system_prompt

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
qdrant_client = QdrantClient(
    url=settings.qdrant_url,
    api_key=settings.qdrant_api_key if settings.qdrant_api_key else None,
)

async def retrieve_context(query, collection_name, course_id, top_k=5):
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small", input=[query]
    )
    query_embedding = response.data[0].embedding

    try:
        results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            query_filter=Filter(must=[FieldCondition(key="course_id", match=MatchValue(value=course_id))]),
            limit=top_k,
            with_payload=True
        )
        return [{"text": r.payload["text"], "filename": r.payload["filename"], "page": r.payload["page"], "score": r.score} for r in results]
    except Exception as e:
        print(f"⚠️ Qdrant search failed (likely collection doesn't exist yet): {e}")
        return []

async def generate_answer_stream(query, context_chunks, history=[], professor_name="Professor", course_name="this course", persona=None):
    context = "\n\n".join([
        f"[Source: {c['filename']}, page {c['page']}]\n{c['text']}"
        for c in context_chunks
    ])

    # Build the persona-aware system prompt
    system_prompt = build_professor_system_prompt(professor_name, course_name, persona)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({
        "role": "user",
        "content": f"Course materials context:\n{context}\n\nStudent question: {query}"
    })

    stream = await openai_client.chat.completions.create(
        model="gpt-4o", messages=messages, stream=True, max_tokens=1000
    )
    return stream