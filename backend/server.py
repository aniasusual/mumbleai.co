from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
from agent import LanguageTutorAgent
from tools import SCENARIOS
from languages import SUPPORTED_LANGUAGES, get_all_languages_sorted, get_language_name

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Pydantic Models ---

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    scenario: Optional[str] = None
    native_language: str = "en"
    target_language: str = "en"

class ConversationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    scenario: Optional[str] = None
    native_language: str = "en"
    target_language: str = "en"
    proficiency_level: Optional[str] = None
    created_at: str
    updated_at: str
    message_count: int = 0

class MessageCreate(BaseModel):
    content: str
    scenario_context: Optional[str] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    conversation_id: str
    role: str
    content: str
    tools_used: List[str] = []
    created_at: str

class VocabularyCreate(BaseModel):
    word: str
    definition: str
    example: Optional[str] = None
    context: Optional[str] = None

class VocabularyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    word: str
    definition: str
    example: Optional[str] = None
    context: Optional[str] = None
    created_at: str

class ProgressResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_conversations: int = 0
    total_messages: int = 0
    vocabulary_count: int = 0
    scenarios_practiced: List[str] = []
    tools_usage: dict = {}
    streak_days: int = 0
    recent_activity: List[dict] = []


# --- Conversations ---

@api_router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(data: ConversationCreate):
    now = datetime.now(timezone.utc).isoformat()
    native = data.native_language if data.native_language in SUPPORTED_LANGUAGES else "en"
    target = data.target_language if data.target_language in SUPPORTED_LANGUAGES else "en"
    conv = {
        "id": str(uuid.uuid4()),
        "title": data.title or "New Conversation",
        "scenario": data.scenario,
        "native_language": native,
        "target_language": target,
        "proficiency_level": None,
        "created_at": now,
        "updated_at": now,
        "message_count": 0
    }
    await db.conversations.insert_one(conv)
    conv.pop("_id", None)

    # Always have the agent initiate the conversation in the user's native language
    agent = LanguageTutorAgent(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lingua_{conv['id']}",
        native_language=native,
        target_language=target,
        conversation_id=conv["id"],
        db=db
    )
    welcome_content = await agent.generate_welcome(scenario=data.scenario)
    title = _build_conv_title(native, target, get_language_name(target), data.scenario)

    welcome_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv["id"],
        "role": "assistant",
        "content": welcome_content,
        "tools_used": [],
        "created_at": now
    }
    await db.messages.insert_one(welcome_msg)
    await db.conversations.update_one(
        {"id": conv["id"]},
        {"$set": {"message_count": 1, "title": title}}
    )
    conv["message_count"] = 1
    conv["title"] = title

    return conv


def _build_conv_title(native: str, target: str, target_name: str, scenario: str = None) -> str:
    if scenario:
        labels = {
            "job_interview": "Job Interview Practice",
            "restaurant": "Restaurant Practice",
            "travel": "Travel Practice",
            "small_talk": "Small Talk Practice",
            "business_meeting": "Business Meeting Practice",
            "phone_call": "Phone Call Practice",
            "shopping": "Shopping Practice",
            "doctor_visit": "Doctor Visit Practice",
        }
        return labels.get(scenario, f"{scenario.replace('_', ' ').title()} Practice")
    if native != target:
        return f"Learning {target_name}"
    return f"{target_name} Practice"

@api_router.patch("/conversations/{conv_id}/proficiency")
async def set_proficiency(conv_id: str, data: dict):
    level = data.get("level", "beginner")
    if level not in ("beginner", "intermediate", "advanced"):
        level = "beginner"
    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {"proficiency_level": level}}
    )
    return {"status": "updated", "proficiency_level": level}

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations():
    convs = await db.conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return convs

@api_router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: str):
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@api_router.delete("/conversations/all")
async def delete_all_conversations():
    conv_ids = await db.conversations.distinct("id")
    if conv_ids:
        await db.messages.delete_many({"conversation_id": {"$in": conv_ids}})
    await db.conversations.delete_many({})
    return {"status": "deleted", "count": len(conv_ids)}

@api_router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    await db.conversations.delete_one({"id": conv_id})
    await db.messages.delete_many({"conversation_id": conv_id})
    return {"status": "deleted"}

@api_router.get("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
async def get_messages(conv_id: str):
    messages = await db.messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages


# --- Send Message (Agent Interaction) ---

@api_router.post("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
async def send_message(conv_id: str, data: MessageCreate):
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()

    # Save user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": data.content,
        "tools_used": [],
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    # Get conversation history
    history = await db.messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)

    history_for_agent = [
        {"role": m["role"], "content": m["content"]}
        for m in history
    ]

    # Process through agent
    native_lang = conv.get("native_language", "en")
    target_lang = conv.get("target_language", "en")
    proficiency = conv.get("proficiency_level")
    agent = LanguageTutorAgent(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lingua_{conv_id}",
        native_language=native_lang,
        target_language=target_lang,
        proficiency_level=proficiency,
        conversation_id=conv_id,
        db=db
    )

    result = await agent.process_message(
        user_text=data.content,
        conversation_history=history_for_agent,
        scenario_context=data.scenario_context or conv.get("scenario")
    )

    # Save AI response
    ai_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "assistant",
        "content": result["response"],
        "tools_used": result.get("tools_used", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(ai_msg)

    # Update conversation
    update_title = conv.get("title", "New Conversation")
    if update_title == "New Conversation" and len(data.content) > 3:
        update_title = data.content[:50] + ("..." if len(data.content) > 50 else "")

    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "title": update_title
        },
        "$inc": {"message_count": 2}}
    )

    # Track progress
    await _track_activity(data.content, result.get("tools_used", []), conv.get("scenario"))

    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)
    return [user_msg, ai_msg]


# --- Voice Message (Speech-to-Text → Agent → Text-to-Speech) ---

@api_router.post("/conversations/{conv_id}/voice-message")
async def send_voice_message(
    conv_id: str,
    audio: UploadFile = File(...),
    scenario_context: Optional[str] = Form(None)
):
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    native_lang = conv.get("native_language", "en")
    target_lang = conv.get("target_language", "en")

    # Step 1: Transcribe audio with Whisper (in the TARGET language the user is practicing)
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    audio_bytes = await audio.read()

    # Save to temp file for Whisper
    suffix = ".webm"
    if audio.content_type:
        ext_map = {"audio/webm": ".webm", "audio/wav": ".wav", "audio/mp3": ".mp3", "audio/mpeg": ".mp3", "audio/ogg": ".ogg", "audio/mp4": ".mp4"}
        suffix = ext_map.get(audio.content_type, ".webm")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            transcript_response = await stt.transcribe(
                file=f,
                model="whisper-1",
                language=target_lang,
                response_format="json",
                temperature=0.0
            )
        user_text = transcript_response.text
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="Could not process audio. Please make sure you're speaking clearly and try again.")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not user_text or not user_text.strip():
        raise HTTPException(status_code=400, detail="Could not understand the audio. Please try speaking again.")

    # Save user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": user_text.strip(),
        "tools_used": [],
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    # Step 2: Process through agent
    history = await db.messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)

    history_for_agent = [
        {"role": m["role"], "content": m["content"]}
        for m in history
    ]

    agent = LanguageTutorAgent(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lingua_{conv_id}",
        native_language=native_lang,
        target_language=target_lang,
        proficiency_level=conv.get("proficiency_level"),
        conversation_id=conv_id,
        db=db
    )

    result = await agent.process_message(
        user_text=user_text.strip(),
        conversation_history=history_for_agent,
        scenario_context=scenario_context or conv.get("scenario")
    )

    ai_text = result["response"]

    # Save AI message
    ai_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "assistant",
        "content": ai_text,
        "tools_used": result.get("tools_used", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(ai_msg)

    # Step 3: Generate TTS audio for AI response
    audio_base64 = None
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        # Truncate for TTS if too long (4096 char limit)
        tts_text = ai_text[:4000] if len(ai_text) > 4000 else ai_text
        tts_audio = await tts.generate_speech(
            text=tts_text,
            model="tts-1",
            voice="nova",
            response_format="mp3",
            speed=1.0
        )
        audio_base64 = base64.b64encode(tts_audio).decode("utf-8")
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        # Non-fatal: return text without audio

    # Update conversation
    update_title = conv.get("title", "New Conversation")
    if update_title == "New Conversation" and len(user_text) > 3:
        update_title = user_text[:50] + ("..." if len(user_text) > 50 else "")

    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "title": update_title
        },
        "$inc": {"message_count": 2}}
    )

    await _track_activity(user_text, result.get("tools_used", []), conv.get("scenario"))

    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)

    return JSONResponse(content={
        "user_message": {
            "id": user_msg["id"],
            "conversation_id": conv_id,
            "role": "user",
            "content": user_msg["content"],
            "tools_used": [],
            "created_at": user_msg["created_at"]
        },
        "ai_message": {
            "id": ai_msg["id"],
            "conversation_id": conv_id,
            "role": "assistant",
            "content": ai_msg["content"],
            "tools_used": ai_msg["tools_used"],
            "created_at": ai_msg["created_at"]
        },
        "ai_audio_base64": audio_base64,
        "transcribed_text": user_text.strip()
    })


# --- Text-to-Speech for existing messages ---

@api_router.post("/tts")
async def text_to_speech(data: dict):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        tts_text = text[:4000] if len(text) > 4000 else text
        tts_audio = await tts.generate_speech(
            text=tts_text,
            model="tts-1",
            voice="nova",
            response_format="mp3",
            speed=1.0
        )
        audio_b64 = base64.b64encode(tts_audio).decode("utf-8")
        return {"audio_base64": audio_b64}
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate speech")

@api_router.post("/vocabulary", response_model=VocabularyResponse)
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

@api_router.get("/vocabulary", response_model=List[VocabularyResponse])
async def list_vocabulary():
    vocab = await db.vocabulary.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return vocab

@api_router.delete("/vocabulary/{vocab_id}")
async def delete_vocabulary(vocab_id: str):
    await db.vocabulary.delete_one({"id": vocab_id})
    return {"status": "deleted"}


# --- Scenarios ---

@api_router.get("/scenarios")
async def get_scenarios():
    return [
        {"id": key, **{k: v for k, v in val.items() if k != "starter_prompts"}, "prompts": val["starter_prompts"]}
        for key, val in SCENARIOS.items()
    ]


# --- Languages ---

@api_router.get("/languages")
async def get_languages():
    popular, others = get_all_languages_sorted()
    return {"popular": popular, "others": others}


# --- Progress ---

@api_router.get("/progress", response_model=ProgressResponse)
async def get_progress():
    total_convs = await db.conversations.count_documents({})
    total_msgs = await db.messages.count_documents({})
    vocab_count = await db.vocabulary.count_documents({})

    # Get scenarios practiced
    scenario_convs = await db.conversations.find(
        {"scenario": {"$ne": None}}, {"_id": 0, "scenario": 1}
    ).to_list(100)
    scenarios = list(set(c["scenario"] for c in scenario_convs if c.get("scenario")))

    # Get tools usage stats
    pipeline = [
        {"$unwind": "$tools_used"},
        {"$group": {"_id": "$tools_used", "count": {"$sum": 1}}}
    ]
    tools_agg = await db.messages.aggregate(pipeline).to_list(20)
    tools_usage = {t["_id"]: t["count"] for t in tools_agg}

    # Calculate streak
    activity_pipeline = [
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}}},
        {"$sort": {"_id": -1}},
        {"$limit": 30}
    ]
    activity_days = await db.messages.aggregate(activity_pipeline).to_list(30)
    streak = _calculate_streak([d["_id"] for d in activity_days])

    # Recent activity
    recent = await db.messages.find(
        {"role": "user"}, {"_id": 0, "content": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)

    return {
        "total_conversations": total_convs,
        "total_messages": total_msgs,
        "vocabulary_count": vocab_count,
        "scenarios_practiced": scenarios,
        "tools_usage": tools_usage,
        "streak_days": streak,
        "recent_activity": recent
    }


async def _track_activity(user_text: str, tools_used: list, scenario: str = None):
    """Track user activity for progress."""
    await db.activity.insert_one({
        "id": str(uuid.uuid4()),
        "text_length": len(user_text),
        "tools_used": tools_used,
        "scenario": scenario,
        "created_at": datetime.now(timezone.utc).isoformat()
    })


def _calculate_streak(date_strings: list) -> int:
    """Calculate consecutive days of activity."""
    if not date_strings:
        return 0
    from datetime import timedelta
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dates = sorted(set(date_strings), reverse=True)

    if dates[0] != today:
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        if dates[0] != yesterday:
            return 0

    streak = 1
    for i in range(1, len(dates)):
        prev = datetime.strptime(dates[i-1], "%Y-%m-%d")
        curr = datetime.strptime(dates[i], "%Y-%m-%d")
        if (prev - curr).days == 1:
            streak += 1
        else:
            break
    return streak


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
