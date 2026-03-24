from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Detect if we're connecting to a remote DB (Neon) and enable SSL
connect_args = {}
if "neon.tech" in settings.database_url or "amazonaws" in settings.database_url:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def create_tables():
    async with engine.begin() as conn:
        from app.models import user, course, document
        from app.models import professor_persona, enrollment
        from app.models import chat_message
        await conn.run_sync(Base.metadata.create_all)