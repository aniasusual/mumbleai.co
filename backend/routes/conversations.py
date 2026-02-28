"""Conversation CRUD + message sending routes (including SSE streaming)."""

import re
import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from starlette.responses import StreamingResponse

from config import db, EMERGENT_LLM_KEY
from models import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
from agents.tutor import LanguageTutorAgent
from services.agent_factory import create_agent_for_conversation
from auth import get_current_user
from languages import SUPPORTED_LANGUAGES, get_language_name

router = APIRouter()

_EXPECT_LANG_RE = re.compile(r'\s*\[EXPECT_LANG:(\w+(?:-\w+)?)\]\s*$')


def _strip_expect_lang(text: str):
    """Strip [EXPECT_LANG:xx] tag from AI response. Returns (clean_text, lang_code or None)."""
    m = _EXPECT_LANG_RE.search(text)
    if m:
        return text[:m.start()].rstrip(), m.group(1)
    return text, None

import base64
import logging
from emergentintegrations.llm.openai import OpenAITextToSpeech

_tts_logger = logging.getLogger(__name__)

async def _generate_tts(text: str):
    """Generate TTS audio, returns base64 string or None."""
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        tts_text = text[:4000]
        audio = await tts.generate_speech(
            text=tts_text, model="tts-1", voice="nova",
            response_format="mp3", speed=1.0
        )
        return base64.b64encode(audio).decode("utf-8")
    except Exception as e:
        _tts_logger.error(f"TTS failed: {e}")
        return None


# --- Helpers ---

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


async def _track_activity(user_text: str, tools_used: list, scenario: str = None):
    await db.activity.insert_one({
        "id": str(uuid.uuid4()),
        "text_length": len(user_text),
        "tools_used": tools_used,
        "scenario": scenario,
        "created_at": datetime.now(timezone.utc).isoformat()
    })


# --- Conversation CRUD ---

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(data: ConversationCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    native = data.native_language if data.native_language in SUPPORTED_LANGUAGES else "en"
    target = data.target_language if data.target_language in SUPPORTED_LANGUAGES else "en"

    conv = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": data.title or "New Conversation",
        "scenario": data.scenario,
        "native_language": native,
        "target_language": target,
        "proficiency_level": None,
        "phase": "learning",
        "created_at": now,
        "updated_at": now,
        "message_count": 0
    }
    await db.conversations.insert_one(conv)
    conv.pop("_id", None)

    # Agent initiates the conversation in the user's native language
    agent = LanguageTutorAgent(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lingua_{conv['id']}",
        native_language=native,
        target_language=target,
        conversation_id=conv["id"],
        db=db
    )
    welcome_content = await agent.generate_welcome(scenario=data.scenario)
    clean_welcome, expect_lang = _strip_expect_lang(welcome_content)
    title = _build_conv_title(native, target, get_language_name(target), data.scenario)

    welcome_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv["id"],
        "role": "assistant",
        "content": clean_welcome,
        "tools_used": [],
        "phase": conv["phase"],
        "created_at": now
    }
    await db.messages.insert_one(welcome_msg)

    update_fields = {"message_count": 1, "title": title}
    if expect_lang:
        update_fields["expected_response_language"] = expect_lang
    await db.conversations.update_one(
        {"id": conv["id"]},
        {"$set": update_fields}
    )
    conv["message_count"] = 1
    conv["title"] = title
    return conv


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(user: dict = Depends(get_current_user)):
    return await db.conversations.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/all")
async def delete_all_conversations(user: dict = Depends(get_current_user)):
    conv_ids = await db.conversations.distinct("id", {"user_id": user["id"]})
    if conv_ids:
        await db.messages.delete_many({"conversation_id": {"$in": conv_ids}})
        await db.curricula.delete_many({"conversation_id": {"$in": conv_ids}})
    await db.conversations.delete_many({"user_id": user["id"]})
    return {"status": "deleted", "count": len(conv_ids)}


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str, user: dict = Depends(get_current_user)):
    await db.conversations.delete_one({"id": conv_id, "user_id": user["id"]})
    await db.messages.delete_many({"conversation_id": conv_id})
    await db.curricula.delete_many({"conversation_id": conv_id})
    return {"status": "deleted"}


@router.patch("/conversations/{conv_id}/proficiency")
async def set_proficiency(conv_id: str, data: dict, user: dict = Depends(get_current_user)):
    level = data.get("level", "beginner")
    if level not in ("beginner", "intermediate", "advanced"):
        level = "beginner"
    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {"proficiency_level": level}}
    )
    return {"status": "updated", "proficiency_level": level}


@router.get("/conversations/{conv_id}/curriculum")
async def get_curriculum(conv_id: str, user: dict = Depends(get_current_user)):
    curr = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})
    if not curr:
        raise HTTPException(status_code=404, detail="No curriculum found")
    return curr


# --- Messages ---

@router.get("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
async def get_messages(conv_id: str, user: dict = Depends(get_current_user)):
    """Return all visible messages (exclude internal handoff messages)."""
    return await db.messages.find(
        {"conversation_id": conv_id, "is_internal": {"$ne": True}}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)


@router.post("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
async def send_message(conv_id: str, data: MessageCreate, user: dict = Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    current_phase = conv.get("phase", "learning")

    # Save user message tagged with the current phase
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": data.content,
        "tools_used": [],
        "phase": current_phase,
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    # Load history ONLY for the current agent's phase (separate context window)
    history = await db.messages.find(
        {"conversation_id": conv_id, "phase": current_phase}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    history_for_agent = [{"role": m["role"], "content": m["content"]} for m in history]

    agent = await create_agent_for_conversation(conv, conv_id)
    result = await agent.process_message(
        user_text=data.content,
        conversation_history=history_for_agent,
        scenario_context=data.scenario_context or conv.get("scenario")
    )

    # Save AI response with the same phase as the user's message
    ai_text = result["response"]
    clean_ai_text, expect_lang = _strip_expect_lang(ai_text)
    ai_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "assistant",
        "content": clean_ai_text,
        "tools_used": result.get("tools_used", []),
        "phase": current_phase,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(ai_msg)

    # Update conversation
    update_title = conv.get("title", "New Conversation")
    if update_title == "New Conversation" and len(data.content) > 3:
        update_title = data.content[:50] + ("..." if len(data.content) > 50 else "")

    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat(), "title": update_title}
    if expect_lang:
        update_fields["expected_response_language"] = expect_lang
    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": update_fields, "$inc": {"message_count": 2}}
    )

    await _track_activity(data.content, result.get("tools_used", []), conv.get("scenario"))

    # Phase transition: if planner saved curriculum, switch to learning
    if ("save_curriculum" in result.get("tools_used", []) or "revise_curriculum" in result.get("tools_used", [])) and current_phase == "planning":
        await db.conversations.update_one(
            {"id": conv_id},
            {"$set": {"phase": "learning"}}
        )

    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)
    return [user_msg, ai_msg]


@router.post("/conversations/{conv_id}/messages/stream")
async def send_message_stream(conv_id: str, data: MessageCreate, user: dict = Depends(get_current_user)):
    """SSE streaming endpoint — sends tool activity events in real-time, then the final messages."""
    conv = await db.conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    current_phase = conv.get("phase", "learning")

    # Save user message tagged with the current phase
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": data.content,
        "tools_used": [],
        "phase": current_phase,
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    async def event_generator():
        event_queue = asyncio.Queue()

        async def on_event(event):
            await event_queue.put(event)

        async def run_agent():
            # Load history ONLY for the current agent's phase (separate context window)
            history = await db.messages.find(
                {"conversation_id": conv_id, "phase": current_phase}, {"_id": 0}
            ).sort("created_at", 1).to_list(50)
            history_for_agent = [{"role": m["role"], "content": m["content"]} for m in history]

            agent = await create_agent_for_conversation(conv, conv_id)
            return await agent.process_message(
                user_text=data.content,
                conversation_history=history_for_agent,
                scenario_context=data.scenario_context or conv.get("scenario"),
                on_event=on_event
            )

        task = asyncio.create_task(run_agent())

        # Stream events as they arrive
        while not task.done():
            try:
                event = await asyncio.wait_for(event_queue.get(), timeout=0.3)
                yield f"data: {json.dumps(event)}\n\n"
            except asyncio.TimeoutError:
                continue

        # Drain any remaining events
        while not event_queue.empty():
            event = event_queue.get_nowait()
            yield f"data: {json.dumps(event)}\n\n"

        result = task.result()

        # Generate TTS in parallel with saving the message
        ai_text = result["response"]
        tts_task = asyncio.create_task(_generate_tts(ai_text))

        # Save AI response with the same phase as the user's message
        ai_msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "role": "assistant",
            "content": ai_text,
            "tools_used": result.get("tools_used", []),
            "tool_activity": result.get("tool_activity", []),
            "phase": current_phase,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.messages.insert_one(ai_msg)

        update_title = conv.get("title", "New Conversation")
        if update_title == "New Conversation" and len(data.content) > 3:
            update_title = data.content[:50] + ("..." if len(data.content) > 50 else "")
        await db.conversations.update_one(
            {"id": conv_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "title": update_title},
             "$inc": {"message_count": 2}}
        )
        await _track_activity(data.content, result.get("tools_used", []), conv.get("scenario"))

        # Phase transition: if planner saved curriculum, switch to learning
        tools_used = result.get("tools_used", [])
        if ("save_curriculum" in tools_used or "revise_curriculum" in tools_used) and current_phase == "planning":
            await db.conversations.update_one(
                {"id": conv_id},
                {"$set": {"phase": "learning"}}
            )

        # Wait for TTS to finish (was running in parallel with DB writes)
        audio_base64 = await tts_task

        user_msg_out = {k: v for k, v in user_msg.items() if k != "_id"}
        ai_msg_out = {k: v for k, v in ai_msg.items() if k != "_id"}

        done_event = {'type': 'done', 'user_message': user_msg_out, 'ai_message': ai_msg_out}
        if audio_base64:
            done_event['ai_audio_base64'] = audio_base64
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
