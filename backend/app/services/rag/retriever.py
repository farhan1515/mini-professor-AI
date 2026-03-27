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

# Minimum cosine similarity score to include a chunk
MIN_RELEVANCE_SCORE = 0.3
# Below this score, chunks are labeled as "brief mention"
LOW_RELEVANCE_THRESHOLD = 0.5

async def retrieve_context(query, collection_name, course_id, top_k=5):
    response = await openai_client.embeddings.create(
        model="text-embedding-3-small", input=[query]
    )
    query_embedding = response.data[0].embedding

    results = qdrant_client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        query_filter=Filter(must=[FieldCondition(key="course_id", match=MatchValue(value=course_id))]),
        limit=top_k,
        with_payload=True
    )

    # Filter out very low relevance results
    filtered = [r for r in results if r.score >= MIN_RELEVANCE_SCORE]
    
    chunks = []
    for r in filtered:
        chunk = {
            "text": r.payload["text"],
            "filename": r.payload["filename"],
            "page": r.payload["page"],
            "score": r.score
        }
        chunks.append(chunk)
    
    print(f"📊 RAG: {len(results)} raw → {len(chunks)} after filtering (min score: {MIN_RELEVANCE_SCORE})")
    for c in chunks:
        relevance = "HIGH" if c["score"] >= LOW_RELEVANCE_THRESHOLD else "LOW"
        print(f"   [{relevance}] score={c['score']:.3f} | {c['filename']} p.{c['page']} | {c['text'][:80]}...")
    
    return chunks

async def generate_answer_stream(query, context_chunks, history=[], professor_name="Professor", course_name="this course", persona=None):
    # Build context with relevance indicators
    context_parts = []
    for c in context_chunks:
        relevance_label = ""
        if c["score"] < LOW_RELEVANCE_THRESHOLD:
            relevance_label = " ⚠️ LOW RELEVANCE - this chunk only briefly mentions the topic, may be a table of contents or outline"
        context_parts.append(
            f"[Source: {c['filename']}, page {c['page']}] [Relevance: {c['score']:.2f}]{relevance_label}\n{c['text']}"
        )
    
    context = "\n\n".join(context_parts)

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