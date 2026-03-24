import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_tables
from app.routers import auth, courses, chat, persona, voice, analytics
from app.core.config import settings

app = FastAPI(title="Mini Professor API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        settings.frontend_url,
        "https://mini-professor.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(chat.router)
app.include_router(persona.router)
app.include_router(voice.router)
app.include_router(analytics.router)

@app.on_event("startup")
async def startup():
    await create_tables()
    print("✅ Mini Professor v2 ready")

@app.get("/")
async def root():
    return {"message": "Mini Professor API v2.0"}