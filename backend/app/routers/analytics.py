from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_professor
from app.models.course import Course
from app.services.analytics import get_course_analytics
import uuid

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/{course_id}")
async def course_analytics(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_professor)
):
    """Get full analytics for a course."""
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")

    try:
        data = await get_course_analytics(course_id, db)
    except Exception as e:
        print(f"⚠️ Analytics error: {e}")
        # Return empty analytics instead of crashing
        data = {
            "stats": {
                "total_students": 0, "active_students": 0,
                "total_questions": 0, "total_answers": 0,
                "total_documents": 0, "engagement_rate": 0
            },
            "analysis": {
                "top_topics": [], "confusion_areas": [],
                "suggested_additions": [], "sentiment": "neutral"
            },
            "recent_questions": []
        }
    return {"success": True, "data": data}