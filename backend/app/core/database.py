import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Log the DB host for debugging (hide password)
db_url = settings.database_url
_host = db_url.split("@")[-1].split("/")[0] if "@" in db_url else "localhost"
print(f"📡 Database host: {_host}")

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
    """Create all tables with retry logic for Neon cold starts."""
    from app.models import user, course, document
    from app.models import professor_persona, enrollment
    from app.models import chat_message

    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print(f"✅ Database tables ready (attempt {attempt})")
            return
        except Exception as e:
            print(f"⚠️ DB connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                print(f"   Retrying in 3 seconds (Neon may be waking up)...")
                await asyncio.sleep(3)
            else:
                print("❌ All DB connection attempts failed!")
                raise