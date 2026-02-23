"""Vocabulary CRUD routes."""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends

from config import db
from models import VocabularyCreate, VocabularyResponse
from auth import get_current_user

router = APIRouter()


@router.post("/vocabulary", response_model=VocabularyResponse)
async def save_vocabulary(data: VocabularyCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    vocab = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "word": data.word,
        "definition": data.definition,
        "example": data.example,
        "context": data.context,
        "created_at": now
    }
    await db.vocabulary.insert_one(vocab)
    vocab.pop("_id", None)
    return vocab


@router.get("/vocabulary", response_model=List[VocabularyResponse])
async def list_vocabulary(user: dict = Depends(get_current_user)):
    return await db.vocabulary.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.delete("/vocabulary/{vocab_id}")
async def delete_vocabulary(vocab_id: str, user: dict = Depends(get_current_user)):
    await db.vocabulary.delete_one({"id": vocab_id, "user_id": user["id"]})
    return {"status": "deleted"}
