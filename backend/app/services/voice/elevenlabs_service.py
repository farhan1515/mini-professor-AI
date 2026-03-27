import httpx
import re
from openai import AsyncOpenAI
from app.core.config import settings

ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)


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
        print(f"✅ Voice cloned! Response: {data}")
        voice_id = data.get("voice_id", "")
        voice_name = data.get("name", f"{professor_name} - {course_name}")
        return {"voice_id": voice_id, "voice_name": voice_name}


async def convert_to_conversational(text: str, professor_name: str = "Professor") -> str:
    """
    Convert a written AI response into natural professor-style speech.
    This is what makes Mini Professor's voice truly unique — the professor
    doesn't just read the text, they EXPLAIN it conversationally.
    """
    # Strip source citations — professors don't say "[Source: file.pdf, page 3]" out loud
    cleaned = re.sub(r'\[Source:.*?\]', '', text).strip()

    # Truncate long text for reasonable audio length (spoken ~150 wpm, aim for ~45 seconds)
    if len(cleaned) > 800:
        cleaned = cleaned[:800]

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are Professor {professor_name}. Convert the following written answer 
into how you would NATURALLY EXPLAIN it to a student during office hours.

Rules:
- Keep it SHORT (3-5 sentences max). This is spoken audio, not a lecture.
- Be conversational and warm. Use natural speech patterns.
- Use filler words sparingly but naturally: "So basically...", "Here's the thing...", "Alright, so..."
- Focus on the KEY INSIGHT, not every detail. The student can read the full text.
- Do NOT include bullet points, numbered lists, or any formatting. Just flowing speech.
- Do NOT say "according to the materials" or cite sources. Just explain naturally.
- End with something encouraging like "Does that make sense?" or "Hope that helps!"
- Sound like a real professor talking, not an AI reading text."""
                },
                {
                    "role": "user",
                    "content": f"Convert this written answer to natural speech:\n\n{cleaned}"
                }
            ],
            max_tokens=250,
            temperature=0.8
        )
        conversational = response.choices[0].message.content.strip()
        print(f"🎤 Conversational TTS: {conversational[:100]}...")
        return conversational
    except Exception as e:
        print(f"⚠️ Conversational conversion failed, using cleaned text: {e}")
        # Fallback: just use the cleaned text without source citations
        return cleaned[:500]


async def text_to_speech(text: str, voice_id: str, professor_name: str = "Professor") -> bytes:
    """Convert text to speech using professor's cloned voice.
    First converts the written answer to conversational speech, then sends to ElevenLabs."""

    # Convert written text → natural conversational speech
    spoken_text = await convert_to_conversational(text, professor_name)

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{ELEVENLABS_BASE}/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": spoken_text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.8,
                    "style": 0.3,
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