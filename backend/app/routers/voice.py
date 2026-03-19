from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_professor, get_current_user
from app.models.professor_persona import ProfessorPersona
from app.models.course import Course
from app.services.voice.elevenlabs_service import clone_voice, text_to_speech
import uuid

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/{course_id}/clone")
async def upload_voice_sample(
    course_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(require_professor)
):
    """Professor uploads voice sample → creates ElevenLabs voice clone."""

    # Get course info
    course_result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")

    # Read audio bytes
    audio_bytes = await file.read()
    if len(audio_bytes) < 10000:
        raise HTTPException(400, "Audio sample too short. Please record at least 30 seconds.")

    # Clone voice via ElevenLabs
    result = await clone_voice(
        audio_bytes=audio_bytes,
        professor_name=course.professor_name,
        course_name=course.name
    )

    # Save voice_id to persona
    persona_result = await db.execute(
        select(ProfessorPersona).where(
            ProfessorPersona.course_id == uuid.UUID(course_id)
        )
    )
    persona = persona_result.scalar_one_or_none()
    if persona:
        persona.voice_id = result["voice_id"]
        persona.voice_name = result["voice_name"]
        await db.commit()

    return {
        "success": True,
        "data": {
            "voice_id": result["voice_id"],
            "message": "Voice cloned successfully! Students will now hear your voice."
        }
    }


class TTSRequest(BaseModel):
    course_id: str
    text: str


@router.post("/speak")
async def speak(
    request: TTSRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """Convert AI response text to professor's voice audio."""

    persona_result = await db.execute(
        select(ProfessorPersona).where(
            ProfessorPersona.course_id == uuid.UUID(request.course_id)
        )
    )
    persona = persona_result.scalar_one_or_none()

    if not persona or not persona.voice_id:
        raise HTTPException(400, "Professor hasn't set up voice yet")

    audio_bytes = await text_to_speech(
        text=request.text,
        voice_id=persona.voice_id
    )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=response.mp3"}
    )


@router.get("/{course_id}/status")
async def voice_status(
    course_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Check if a course has voice cloning set up."""
    persona_result = await db.execute(
        select(ProfessorPersona).where(
            ProfessorPersona.course_id == uuid.UUID(course_id)
        )
    )
    persona = persona_result.scalar_one_or_none()
    has_voice = persona and persona.voice_id is not None

    return {
        "success": True,
        "data": {
            "has_voice": has_voice,
            "voice_name": persona.voice_name if has_voice else None
        }
    }


@router.delete("/{course_id}/voice")
async def remove_voice(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_professor)
):
    """Remove voice clone."""
    from app.services.voice.elevenlabs_service import delete_voice

    persona_result = await db.execute(
        select(ProfessorPersona).where(
            ProfessorPersona.course_id == uuid.UUID(course_id)
        )
    )
    persona = persona_result.scalar_one_or_none()
    if persona and persona.voice_id:
        await delete_voice(persona.voice_id)
        persona.voice_id = None
        persona.voice_name = None
        await db.commit()

    return {"success": True, "data": {"message": "Voice removed"}}