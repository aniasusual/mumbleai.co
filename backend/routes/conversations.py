"""Conversation CRUD + message sending routes (including SSE streaming)."""

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
        "phase": "assessment" if native != target and not data.scenario else "learning",
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


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations():
    return await db.conversations.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(conv_id: str):
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.delete("/conversations/all")
async def delete_all_conversations():
    conv_ids = await db.conversations.distinct("id")
    if conv_ids:
        await db.messages.delete_many({"conversation_id": {"$in": conv_ids}})
        await db.curricula.delete_many({"conversation_id": {"$in": conv_ids}})
    await db.conversations.delete_many({})
    return {"status": "deleted", "count": len(conv_ids)}


@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    await db.conversations.delete_one({"id": conv_id})
    await db.messages.delete_many({"conversation_id": conv_id})
    await db.curricula.delete_many({"conversation_id": conv_id})
    return {"status": "deleted"}


@router.patch("/conversations/{conv_id}/proficiency")
async def set_proficiency(conv_id: str, data: dict):
    level = data.get("level", "beginner")
    if level not in ("beginner", "intermediate", "advanced"):
        level = "beginner"
    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {"proficiency_level": level}}
    )
    return {"status": "updated", "proficiency_level": level}


@router.get("/conversations/{conv_id}/curriculum")
async def get_curriculum(conv_id: str):
    curr = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})
    if not curr:
        raise HTTPException(status_code=404, detail="No curriculum found")
    return curr


# --- Messages ---

@router.get("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
async def get_messages(conv_id: str):
    return await db.messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)


@router.post("/conversations/{conv_id}/messages", response_model=List[MessageResponse])
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

    # Get history and create agent
    history = await db.messages.find(
        {"conversation_id": conv_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    history_for_agent = [{"role": m["role"], "content": m["content"]} for m in history]

    agent = await create_agent_for_conversation(conv, conv_id)
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
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "title": update_title},
         "$inc": {"message_count": 2}}
    )

    await _track_activity(data.content, result.get("tools_used", []), conv.get("scenario"))

    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)
    return [user_msg, ai_msg]


@router.post("/conversations/{conv_id}/messages/stream")
async def send_message_stream(conv_id: str, data: MessageCreate):
    """SSE streaming endpoint — sends tool activity events in real-time, then the final messages."""
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

    async def event_generator():
        event_queue = asyncio.Queue()

        async def on_event(event):
            await event_queue.put(event)

        async def run_agent():
            history = await db.messages.find(
                {"conversation_id": conv_id}, {"_id": 0}
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

        # Save AI response
        ai_msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "role": "assistant",
            "content": result["response"],
            "tools_used": result.get("tools_used", []),
            "tool_activity": result.get("tool_activity", []),
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

        user_msg_out = {k: v for k, v in user_msg.items() if k != "_id"}
        ai_msg_out = {k: v for k, v in ai_msg.items() if k != "_id"}

        yield f"data: {json.dumps({'type': 'done', 'user_message': user_msg_out, 'ai_message': ai_msg_out})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
