from sqlalchemy import Column, String, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String)
    subject = Column(String)           # e.g. "Computer Science"
    professor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    professor_name = Column(String, nullable=False)
    qdrant_collection = Column(String, nullable=False)
    is_published = Column(Boolean, default=False)  # professor publishes when ready