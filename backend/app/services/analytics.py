from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.models.chat_message import ChatMessage
from app.models.document import Document
from app.models.enrollment import Enrollment
from app.models.user import User
import uuid
from openai import AsyncOpenAI
from app.core.config import settings
import json

openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

async def get_course_analytics(course_id: str, db: AsyncSession) -> dict:
    course_uuid = uuid.UUID(course_id)

    # Total enrolled students
    enrollment_result = await db.execute(
        select(func.count(Enrollment.id))
        .where(Enrollment.course_id == course_uuid)
    )
    total_students = enrollment_result.scalar() or 0

    # Total questions asked
    questions_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(
            ChatMessage.course_id == course_uuid,
            ChatMessage.role == "user"
        )
    )
    total_questions = questions_result.scalar() or 0

    # Total answers given
    answers_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(
            ChatMessage.course_id == course_uuid,
            ChatMessage.role == "assistant"
        )
    )
    total_answers = answers_result.scalar() or 0

    # Total documents
    docs_result = await db.execute(
        select(func.count(Document.id))
        .where(Document.course_id == course_uuid)
    )
    total_docs = docs_result.scalar() or 0

    # Get all student questions for AI analysis
    messages_result = await db.execute(
        select(ChatMessage.content, ChatMessage.created_at)
        .where(
            ChatMessage.course_id == course_uuid,
            ChatMessage.role == "user"
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(100)
    )
    questions = messages_result.all()
    question_texts = [q.content for q in questions]

    # Get unique students who asked questions
    active_result = await db.execute(
        select(func.count(func.distinct(ChatMessage.student_id)))
        .where(
            ChatMessage.course_id == course_uuid,
            ChatMessage.role == "user"
        )
    )
    active_students = active_result.scalar() or 0

    # AI-powered question analysis
    analysis = {"top_topics": [], "confusion_areas": [], "suggested_additions": [], "recent_questions": []}

    if question_texts:
        analysis = await analyze_questions_with_ai(question_texts, course_id)

    return {
        "stats": {
            "total_students": total_students,
            "active_students": active_students,
            "total_questions": total_questions,
            "total_answers": total_answers,
            "total_documents": total_docs,
            "engagement_rate": round((active_students / total_students * 100) if total_students > 0 else 0, 1)
        },
        "analysis": analysis,
        "recent_questions": [
            {"question": q.content, "asked_at": q.created_at.isoformat()}
            for q in questions[:10]
        ]
    }


async def analyze_questions_with_ai(questions: list[str], course_id: str) -> dict:
    """Use GPT to analyze what students are struggling with."""
    if not questions:
        return {"top_topics": [], "confusion_areas": [], "suggested_additions": []}

    questions_text = "\n".join([f"- {q}" for q in questions[:50]])

    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an educational analytics expert. Return ONLY valid JSON."},
            {"role": "user", "content": f"""Analyze these student questions and return insights for the professor.

Student questions:
{questions_text}

Return ONLY this JSON:
{{
  "top_topics": [
    {{"topic": "topic name", "count": 5, "percentage": 30}}
  ],
  "confusion_areas": [
    {{"area": "concept students struggle with", "severity": "high/medium/low", "sample_question": "example question"}}
  ],
  "suggested_additions": [
    "Suggestion for professor to improve course materials"
  ],
  "sentiment": "positive/neutral/confused"
}}"""}
        ],
        max_tokens=800
    )

    content = response.choices[0].message.content.strip()
    content = content.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(content)
    except:
        return {"top_topics": [], "confusion_areas": [], "suggested_additions": []}