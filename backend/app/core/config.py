from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    database_url: str
    qdrant_url: str = ""
    qdrant_api_key: str = ""
    upload_dir: str = "./uploads"
    secret_key: str = ""
    elevenlabs_api_key: str = ""
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    frontend_url: str = "http://localhost:3000"

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        # Handle all postgres URL formats
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg doesn't understand sslmode — we handle SSL via connect_args
        url = url.replace("?sslmode=require", "").replace("&sslmode=require", "")
        return url

    class Config:
        env_file = ".env"

settings = Settings()