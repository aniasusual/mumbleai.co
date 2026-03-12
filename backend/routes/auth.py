"""Authentication routes — signup, login, Google OAuth, me."""

import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import db
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter()

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")


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
    if not user or not user.get("password") or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


class GoogleAuthRequest(BaseModel):
    credential: str | None = None
    access_token: str | None = None


async def _resolve_google_identity(data: GoogleAuthRequest) -> dict:
    """Return user info from either a Google ID-token or an access-token."""
    if data.credential:
        try:
            idinfo = id_token.verify_oauth2_token(
                data.credential, google_requests.Request(), GOOGLE_CLIENT_ID
            )
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        return idinfo

    if data.access_token:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {data.access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google access token")
        return resp.json()

    raise HTTPException(status_code=400, detail="Provide credential or access_token")


@router.post("/auth/google", response_model=AuthResponse)
async def google_auth(data: GoogleAuthRequest):
    """Verify Google ID token or access token and login or create user."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    idinfo = await _resolve_google_identity(data)

    email = idinfo.get("email", "").lower().strip()
    name = idinfo.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Find or create user
    user = await db.users.find_one({"email": email})
    if not user:
        now = datetime.now(timezone.utc).isoformat()
        user = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password": None,  # Google-only users have no password
            "google_id": idinfo.get("sub"),
            "avatar": idinfo.get("picture"),
            "created_at": now,
        }
        await db.users.insert_one(user)
    else:
        # Update google_id and avatar if not set
        updates = {}
        if not user.get("google_id"):
            updates["google_id"] = idinfo.get("sub")
        if not user.get("avatar") and idinfo.get("picture"):
            updates["avatar"] = idinfo.get("picture")
        if updates:
            await db.users.update_one({"email": email}, {"$set": updates})

    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
    }


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}
