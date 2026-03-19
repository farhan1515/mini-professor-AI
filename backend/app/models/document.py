from sqlalchemy import Column, String, ForeignKey, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    chunk_count = Column(Integer, default=0)
    status = Column(Enum("processing", "ready", "failed", name="doc_status"), default="processing")