import os, uuid, json
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import require_professor, get_current_user
from app.models.course import Course
from app.models.professor_persona import ProfessorPersona
from app.models.enrollment import Enrollment
from app.models.document import Document
from app.services.rag.ingestor import ingest_pdf
from app.core.config import settings

router = APIRouter(prefix="/courses", tags=["courses"])

class CourseCreate(BaseModel):
    name: str
    description: str = ""
    subject: str = ""

@router.post("/")
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db), user=Depends(require_professor)):
    course_id = uuid.uuid4()
    collection = f"course_{str(course_id).replace('-','_')}"

    course = Course(
        id=course_id, name=data.name, description=data.description,
        subject=data.subject, professor_id=uuid.UUID(user["user_id"]),
        professor_name=user["name"], qdrant_collection=collection
    )
    db.add(course)

    # Auto-create empty persona
    persona = ProfessorPersona(
        id=uuid.uuid4(), course_id=course_id,
        professor_id=uuid.UUID(user["user_id"]),
        greeting_message=f"Hi! I'm {user['name']}'s AI teaching assistant. Ask me anything about the course!"
    )
    db.add(persona)
    await db.commit()

    return {"success": True, "data": {"id": str(course_id), "name": course.name, "collection_name": collection}}

@router.get("/my-courses")
async def professor_courses(db: AsyncSession = Depends(get_db), user=Depends(require_professor)):
    result = await db.execute(select(Course).where(Course.professor_id == uuid.UUID(user["user_id"])))
    courses = result.scalars().all()
    return {"success": True, "data": [
        {"id": str(c.id), "name": c.name, "description": c.description,
         "subject": c.subject, "professor_name": c.professor_name,
         "is_published": c.is_published, "collection_name": c.qdrant_collection}
        for c in courses
    ]}

@router.get("/browse")
async def browse_courses(db: AsyncSession = Depends(get_db)):
    """Students browse all published courses."""
    result = await db.execute(select(Course).where(Course.is_published == True))
    courses = result.scalars().all()
    return {"success": True, "data": [
        {"id": str(c.id), "name": c.name, "description": c.description,
         "subject": c.subject, "professor_name": c.professor_name}
        for c in courses
    ]}

@router.post("/{course_id}/publish")
async def publish_course(course_id: str, db: AsyncSession = Depends(get_db), user=Depends(require_professor)):
    result = await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")
    course.is_published = True
    await db.commit()
    return {"success": True, "data": {"message": "Course published! Students can now enroll."}}

@router.post("/{course_id}/enroll")
async def enroll(course_id: str, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    enrollment = Enrollment(
        id=uuid.uuid4(), student_id=uuid.UUID(user["user_id"]),
        course_id=uuid.UUID(course_id)
    )
    db.add(enrollment)
    await db.commit()
    return {"success": True, "data": {"message": "Enrolled successfully!"}}

@router.get("/enrolled")
async def enrolled_courses(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    result = await db.execute(
        select(Course).join(Enrollment, Course.id == Enrollment.course_id)
        .where(Enrollment.student_id == uuid.UUID(user["user_id"]))
    )
    courses = result.scalars().all()
    return {"success": True, "data": [
        {"id": str(c.id), "name": c.name, "professor_name": c.professor_name,
         "subject": c.subject, "collection_name": c.qdrant_collection}
        for c in courses
    ]}

@router.post("/{course_id}/upload")
async def upload_document(course_id: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user=Depends(require_professor)):
    result = await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(404, "Course not found")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files supported")

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    chunk_count = await ingest_pdf(file_path, file.filename, course_id, course.qdrant_collection)

    doc = Document(id=uuid.uuid4(), filename=file.filename, course_id=uuid.UUID(course_id), chunk_count=chunk_count, status="ready")
    db.add(doc)
    await db.commit()

    return {"success": True, "data": {"filename": file.filename, "chunks_created": chunk_count}}

@router.get("/{course_id}/documents")
async def get_documents(course_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.course_id == uuid.UUID(course_id)))
    docs = result.scalars().all()
    return {"success": True, "data": [
        {"id": str(d.id), "filename": d.filename, "chunk_count": d.chunk_count, "status": d.status}
        for d in docs
    ]}