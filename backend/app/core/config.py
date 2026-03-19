from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    database_url: str
    qdrant_url: str = "http://localhost:6333"
    upload_dir: str = "./uploads"
    secret_key: str = "supersecretkey123"
    elevenlabs_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()