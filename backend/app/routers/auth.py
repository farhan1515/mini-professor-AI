from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_token
from app.models.user import User
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "professor" or "student"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if data.role not in ["professor", "student"]:
        raise HTTPException(400, "Role must be professor or student")

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        id=uuid.uuid4(),
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token({"user_id": str(user.id), "role": user.role, "name": user.name, "email": user.email})
    return {"success": True, "data": {"token": token, "user": {"id": str(user.id), "name": user.name, "role": user.role}}}

@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")

    token = create_token({"user_id": str(user.id), "role": user.role, "name": user.name, "email": user.email})
    return {"success": True, "data": {"token": token, "user": {"id": str(user.id), "name": user.name, "role": user.role}}}