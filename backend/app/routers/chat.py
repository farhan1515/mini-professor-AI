from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.course import Course
from app.models.professor_persona import ProfessorPersona
from app.services.rag.retriever import retrieve_context, generate_answer_stream
import json, uuid
from app.models.chat_message import ChatMessage as DBChatMessage
from app.core.auth import get_current_user
import json as json_lib

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    course_id: str
    question: str
    history: list[ChatMessage] = []

class QuizRequest(BaseModel):
    course_id: str
    num_questions: int = 5

class FlashcardRequest(BaseModel):
    course_id: str
    num_cards: int = 6

class SummaryRequest(BaseModel):
    course_id: str

class AssignmentRequest(BaseModel):
    course_id: str
    assignment_text: str

async def get_course_and_persona(course_id: str, db: AsyncSession):
    course_result = await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")

    persona_result = await db.execute(select(ProfessorPersona).where(ProfessorPersona.course_id == uuid.UUID(course_id)))
    persona_obj = persona_result.scalar_one_or_none()

    persona = None
    if persona_obj:
        persona = {
            "teaching_style": persona_obj.teaching_style,
            "tone": persona_obj.tone,
            "teaching_philosophy": persona_obj.teaching_philosophy,
            "key_emphasis": persona_obj.key_emphasis,
            "sensitive_topics": persona_obj.sensitive_topics,
            "restrictions": persona_obj.restrictions,
            "example_qa": persona_obj.example_qa,
            "voice_id": persona_obj.voice_id,
        }

    return course, persona

@router.post("/")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    course, persona = await get_course_and_persona(request.course_id, db)

    # Save user message immediately
    user_msg = DBChatMessage(
        id=uuid.uuid4(),
        course_id=uuid.UUID(request.course_id),
        student_id=uuid.UUID(user["user_id"]),
        role="user",
        content=request.question
    )
    db.add(user_msg)
    await db.commit()

    context_chunks = await retrieve_context(
        query=request.question,
        collection_name=course.qdrant_collection,
        course_id=request.course_id
    )

    if not context_chunks:
        async def empty():
            yield f"data: {json.dumps({'token': 'No materials uploaded yet.'})}\n\n"
            yield f"data: {json.dumps({'done': True, 'sources': []})}\n\n"
        return StreamingResponse(empty(), media_type="text/event-stream")

    full_response = []
    response_sources = []

    async def stream():
        s = await generate_answer_stream(
            query=request.question,
            context_chunks=context_chunks,
            history=[{"role": m.role, "content": m.content} for m in request.history],
            professor_name=course.professor_name,
            course_name=course.name,
            persona=persona
        )
        async for chunk in s:
            delta = chunk.choices[0].delta.content
            if delta:
                full_response.append(delta)
                yield f"data: {json.dumps({'token': delta})}\n\n"

        sources = [{"filename": c["filename"], "page": c["page"]} for c in context_chunks]
        response_sources.extend(sources)
        yield f"data: {json.dumps({'sources': sources, 'done': True})}\n\n"

        # Save assistant message after streaming completes
        assistant_msg = DBChatMessage(
            id=uuid.uuid4(),
            course_id=uuid.UUID(request.course_id),
            student_id=uuid.UUID(user["user_id"]),
            role="assistant",
            content="".join(full_response),
            sources=json.dumps(sources)
        )
        db.add(assistant_msg)
        await db.commit()

    return StreamingResponse(stream(), media_type="text/event-stream")


async def _llm_call(prompt: str, system: str = "Return ONLY valid JSON, no markdown.") -> str:
    from openai import AsyncOpenAI
    from app.core.config import settings
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    r = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        max_tokens=2000
    )
    content = r.choices[0].message.content.strip()
    return content.replace("```json","").replace("```","").strip()


@router.post("/quiz")
async def generate_quiz(request: QuizRequest, db: AsyncSession = Depends(get_db)):
    course, persona = await get_course_and_persona(request.course_id, db)
    chunks = await retrieve_context("key concepts definitions important topics", course.qdrant_collection, request.course_id, top_k=8)
    if not chunks:
        raise HTTPException(400, "No materials uploaded")
    context = "\n\n".join([c["text"] for c in chunks])
    style_note = f"Professor {course.professor_name}'s teaching style is: {persona.get('teaching_style', 'balanced')}. " if persona else ""
    result = await _llm_call(f"""{style_note}Generate {request.num_questions} MCQ questions from this material.
Return JSON: {{"questions": [{{"question":"...","options":["A....","B....","C....","D...."],"answer":"A","explanation":"..."}}]}}
Material: {context}""")
    return {"success": True, "data": json.loads(result)}


@router.post("/flashcards")
async def generate_flashcards(request: FlashcardRequest, db: AsyncSession = Depends(get_db)):
    course, persona = await get_course_and_persona(request.course_id, db)
    chunks = await retrieve_context("definitions concepts terms explain", course.qdrant_collection, request.course_id, top_k=10)
    if not chunks:
        raise HTTPException(400, "No materials uploaded")
    context = "\n\n".join([c["text"] for c in chunks])
    result = await _llm_call(f"""Create {request.num_cards} flashcards from this material for Professor {course.professor_name}'s {course.name} course.
Return JSON: {{"flashcards": [{{"front": "question", "back": "answer"}}]}}
Material: {context}""")
    return {"success": True, "data": json.loads(result)}


@router.post("/summarize")
async def summarize(request: SummaryRequest, db: AsyncSession = Depends(get_db)):
    course, persona = await get_course_and_persona(request.course_id, db)
    chunks = await retrieve_context("main topics overview summary key concepts", course.qdrant_collection, request.course_id, top_k=10)
    if not chunks:
        raise HTTPException(400, "No materials uploaded")
    context = "\n\n".join([c["text"] for c in chunks])
    result = await _llm_call(f"""Analyze Professor {course.professor_name}'s {course.name} materials.
Return JSON: {{"overview":"2-3 sentence summary","key_topics":["topic1","topic2","topic3","topic4","topic5"],"suggested_questions":["q1","q2","q3","q4"]}}
Materials: {context}""")
    return {"success": True, "data": json.loads(result)}


@router.post("/assignment-help")
async def assignment_help(request: AssignmentRequest, db: AsyncSession = Depends(get_db)):
    course, persona = await get_course_and_persona(request.course_id, db)
    chunks = await retrieve_context(request.assignment_text, course.qdrant_collection, request.course_id, top_k=8)
    context = "\n\n".join([c["text"] for c in chunks]) if chunks else "No specific materials found."
    restrictions = f"Note: Professor {course.professor_name} has said: '{persona.get('restrictions', '')}'" if persona and persona.get("restrictions") else ""
    result = await _llm_call(f"""Help a student with this assignment for {course.name} by Professor {course.professor_name}.
{restrictions}
Assignment: "{request.assignment_text}"
Return JSON: {{"understanding":"what it asks","key_concepts":["c1","c2","c3"],"approach":["Step 1:...","Step 2:...","Step 3:..."],"hints":["hint1","hint2"],"warning":"common mistake"}}
Course materials: {context}""")
    return {"success": True, "data": json.loads(result)}

@router.get("/history/{course_id}")
async def get_chat_history(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Get chat history for a student in a course."""
    result = await db.execute(
        select(DBChatMessage)
        .where(
            DBChatMessage.course_id == uuid.UUID(course_id),
            DBChatMessage.student_id == uuid.UUID(user["user_id"])
        )
        .order_by(DBChatMessage.created_at.asc())
    )
    messages = result.scalars().all()
    return {"success": True, "data": [
        {
            "role": m.role,
            "content": m.content,
            "sources": json_lib.loads(m.sources) if m.sources else None,
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]}


@router.post("/history/{course_id}/save")
async def save_message(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    role: str = "",
    content: str = "",
    sources: list = []
):
    """Save a single message to history."""
    msg = DBChatMessage(
        id=uuid.uuid4(),
        course_id=uuid.UUID(course_id),
        student_id=uuid.UUID(user["user_id"]),
        role=role,
        content=content,
        sources=json_lib.dumps(sources) if sources else None
    )
    db.add(msg)
    await db.commit()
    return {"success": True}


@router.delete("/history/{course_id}")
async def clear_history(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Clear chat history for a student in a course."""
    from sqlalchemy import delete
    await db.execute(
        delete(DBChatMessage).where(
            DBChatMessage.course_id == uuid.UUID(course_id),
            DBChatMessage.student_id == uuid.UUID(user["user_id"])
        )
    )
    await db.commit()
    return {"success": True}