from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.core.database import Base

class ProfessorPersona(Base):
    """
    This is what makes Mini-Professor unique.
    The professor trains their AI clone here.
    """
    __tablename__ = "professor_personas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False, unique=True)
    professor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # How the professor wants to communicate
    teaching_style = Column(String, default="balanced")
    # options: "socratic" | "direct" | "encouraging" | "strict" | "balanced"

    tone = Column(String, default="professional")
    # options: "formal" | "friendly" | "casual" | "professional"

    # Professor's own words about how they teach
    teaching_philosophy = Column(Text, default="")
    # e.g. "I always connect theory to real-world examples. 
    #        I encourage students to think before I give answers."

    # What the professor always emphasizes
    key_emphasis = Column(Text, default="")
    # e.g. "Always mention time complexity in algorithms questions.
    #        Always relate back to the exam topics."

    # Topics to be extra careful about
    sensitive_topics = Column(Text, default="")
    # e.g. "For exam questions, don't give direct answers, guide them."

    # Example Q&A pairs the professor provides to shape the AI's style
    example_qa = Column(Text, default="")
    # JSON string of [{question, answer}] pairs

    # Things the AI should NEVER do
    restrictions = Column(Text, default="")
    # e.g. "Never solve assignments directly. Never give exam answers."

    # Custom greeting the professor wants students to see
    greeting_message = Column(Text, default="")
    # e.g. "Hi! I'm Prof. Smith's AI assistant. I'm here to help you 
    #        understand concepts, not do your homework for you!"

    # ElevenLabs voice ID (set after voice cloning)
    voice_id = Column(String, nullable=True)
    voice_name = Column(String, nullable=True)