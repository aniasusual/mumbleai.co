"""Vocabulary CRUD routes."""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter

from config import db
from models import VocabularyCreate, VocabularyResponse

router = APIRouter()


@router.post("/vocabulary", response_model=VocabularyResponse)
async def save_vocabulary(data: VocabularyCreate):
    now = datetime.now(timezone.utc).isoformat()
    vocab = {
        "id": str(uuid.uuid4()),
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
async def list_vocabulary():
    return await db.vocabulary.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.delete("/vocabulary/{vocab_id}")
async def delete_vocabulary(vocab_id: str):
    await db.vocabulary.delete_one({"id": vocab_id})
    return {"status": "deleted"}
