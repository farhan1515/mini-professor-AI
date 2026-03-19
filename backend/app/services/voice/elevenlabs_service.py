import httpx
import os
from app.core.config import settings

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"

async def clone_voice(audio_bytes: bytes, professor_name: str, course_name: str) -> dict:
    """Send audio sample to ElevenLabs and create a voice clone."""
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{ELEVENLABS_BASE}/voices/add",
            headers={"xi-api-key": settings.elevenlabs_api_key},
            data={
                "name": f"{professor_name} - {course_name}",
                "description": f"AI voice clone for Mini Professor: {course_name}"
            },
            files={"files": ("voice_sample.mp3", audio_bytes, "audio/mpeg")}
        )
        if response.status_code != 200:
            raise Exception(f"ElevenLabs error: {response.text}")
        data = response.json()
        return {"voice_id": data["voice_id"], "voice_name": data["name"]}


async def text_to_speech(text: str, voice_id: str) -> bytes:
    """Convert text to speech using professor's cloned voice."""

    # Truncate long responses for audio (first 500 chars)
    if len(text) > 500:
        text = text[:500] + "... For the full answer, please read the response above."

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.2,
                    "use_speaker_boost": True
                }
            }
        )
        if response.status_code != 200:
            raise Exception(f"TTS error: {response.text}")
        return response.content


async def delete_voice(voice_id: str):
    """Delete a cloned voice from ElevenLabs."""
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{ELEVENLABS_BASE}/voices/{voice_id}",
            headers={"xi-api-key": settings.elevenlabs_api_key}
        )