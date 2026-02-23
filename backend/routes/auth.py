"""Authentication routes — signup, login, me."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from config import db
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter()


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


@router.post("/auth/signup", response_model=AuthResponse)
async def signup(data: SignupRequest):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name.strip(),
        "email": data.email.lower().strip(),
        "password": hash_password(data.password),
        "created_at": now,
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}
