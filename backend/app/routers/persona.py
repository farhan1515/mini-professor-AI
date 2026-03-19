from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_professor
from app.models.professor_persona import ProfessorPersona
import uuid, json

router = APIRouter(prefix="/persona", tags=["persona"])

class PersonaUpdate(BaseModel):
    teaching_style: str = "balanced"
    tone: str = "professional"
    teaching_philosophy: str = ""
    key_emphasis: str = ""
    sensitive_topics: str = ""
    restrictions: str = ""
    greeting_message: str = ""
    example_qa: list = []  # [{question, answer}]

@router.get("/{course_id}")
async def get_persona(course_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProfessorPersona).where(ProfessorPersona.course_id == uuid.UUID(course_id))
    )
    persona = result.scalar_one_or_none()
    if not persona:
        return {"success": True, "data": None}

    return {"success": True, "data": {
        "teaching_style": persona.teaching_style,
        "tone": persona.tone,
        "teaching_philosophy": persona.teaching_philosophy,
        "key_emphasis": persona.key_emphasis,
        "sensitive_topics": persona.sensitive_topics,
        "restrictions": persona.restrictions,
        "greeting_message": persona.greeting_message,
        "example_qa": json.loads(persona.example_qa) if persona.example_qa else [],
        "voice_id": persona.voice_id,
        "voice_name": persona.voice_name,
    }}

@router.post("/{course_id}")
async def save_persona(
    course_id: str,
    data: PersonaUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_professor)
):
    result = await db.execute(
        select(ProfessorPersona).where(ProfessorPersona.course_id == uuid.UUID(course_id))
    )
    persona = result.scalar_one_or_none()

    if not persona:
        persona = ProfessorPersona(
            id=uuid.uuid4(),
            course_id=uuid.UUID(course_id),
            professor_id=uuid.UUID(user["user_id"])
        )
        db.add(persona)

    persona.teaching_style = data.teaching_style
    persona.tone = data.tone
    persona.teaching_philosophy = data.teaching_philosophy
    persona.key_emphasis = data.key_emphasis
    persona.sensitive_topics = data.sensitive_topics
    persona.restrictions = data.restrictions
    persona.greeting_message = data.greeting_message
    persona.example_qa = json.dumps(data.example_qa)

    await db.commit()
    return {"success": True, "data": {"message": "Mini Professor trained successfully!"}}