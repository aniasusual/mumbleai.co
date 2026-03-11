"""Voice message (STT -> Agent -> TTS) and standalone TTS routes."""

import os
import re
import uuid
import base64
import logging
import tempfile
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends

from config import db, EMERGENT_LLM_KEY
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
from services.agent_factory import create_agent_for_conversation
from services.audio_utils import estimate_audio_duration_seconds, get_audio_suffix
from routes.conversations import _track_activity, _strip_expect_lang
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _strip_markdown_for_tts(text: str) -> str:
    """Strip markdown formatting so TTS reads clean natural text."""
    t = text
    t = re.sub(r'\*\*(.+?)\*\*', r'\1', t)  # bold
    t = re.sub(r'\*(.+?)\*', r'\1', t)        # italic
    t = re.sub(r'__(.+?)__', r'\1', t)        # bold alt
    t = re.sub(r'_(.+?)_', r'\1', t)          # italic alt
    t = re.sub(r'#{1,6}\s*', '', t)           # headers
    t = re.sub(r'^\s*[-*+]\s+', '', t, flags=re.MULTILINE)  # bullet points
    t = re.sub(r'^\s*\d+[.)]\s+', '', t, flags=re.MULTILINE)  # numbered lists
    t = re.sub(r'`(.+?)`', r'\1', t)          # inline code
    return t.strip()


async def generate_tts(text: str) -> Optional[str]:
    """Shared TTS helper — returns base64 audio or None on failure."""
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        clean_text = _strip_markdown_for_tts(text)
        tts_text = clean_text[:4000]
        tts_audio = await tts.generate_speech(
            text=tts_text, model="tts-1", voice="nova",
            response_format="mp3", speed=1.0
        )
        return base64.b64encode(tts_audio).decode("utf-8")
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        return None


@router.post("/conversations/{conv_id}/voice-message")
async def send_voice_message(
    conv_id: str,
    audio: UploadFile = File(...),
    scenario_context: Optional[str] = Form(None),
    language_hint: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    """SSE streaming voice endpoint — STT -> Agent (with live events) -> TTS."""
    from fastapi.responses import StreamingResponse
    from services.credit_service import check_credits, deduct_credits, InsufficientCreditsError
    import asyncio
    import json

    conv = await db.conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Credit check before processing
    try:
        await check_credits(user["id"])
    except InsufficientCreditsError:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

    now = datetime.now(timezone.utc).isoformat()

    # Use the frontend-provided language hint if present, otherwise fall back to LLM-predicted
    whisper_lang = language_hint or conv.get("expected_response_language") or conv.get("native_language", "en")

    # Step 1: Single Whisper call with the expected language
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    audio_bytes = await audio.read()
    audio_duration_sec = estimate_audio_duration_seconds(audio_bytes, audio.content_type)

    suffix = get_audio_suffix(audio.content_type)

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            transcript_response = await stt.transcribe(
                file=f, model="whisper-1",
                response_format="json", temperature=0.0,
                language=whisper_lang
            )
        user_text = transcript_response.text
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=400, detail="Could not process audio. Please make sure you're speaking clearly and try again.")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not user_text or not user_text.strip():
        raise HTTPException(status_code=400, detail="Could not understand the audio. Please try speaking again.")

    user_text = user_text.strip()

    # Save user message tagged with current phase
    current_phase = conv.get("phase", "learning")
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": user_text,
        "tools_used": [],
        "phase": current_phase,
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    async def event_generator():
        event_queue = asyncio.Queue()

        async def on_event(event):
            await event_queue.put(event)

        # Emit transcription event so frontend can show what was heard
        yield f"data: {json.dumps({'type': 'transcription', 'text': user_text})}\n\n"

        async def run_agent():
            history = await db.messages.find(
                {"conversation_id": conv_id, "phase": current_phase}, {"_id": 0}
            ).sort("created_at", 1).to_list(500)
            history_for_agent = [{"role": m["role"], "content": m["content"]} for m in history]

            agent = await create_agent_for_conversation(conv, conv_id)
            return await agent.process_message(
                user_text=user_text,
                conversation_history=history_for_agent,
                scenario_context=scenario_context or conv.get("scenario"),
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
        clean_ai_text, expect_lang = _strip_expect_lang(ai_text)
        if not expect_lang:
            expect_lang = conv.get("native_language", "en")
        tts_task = asyncio.create_task(generate_tts(clean_ai_text))

        # Save AI message tagged with current phase
        ai_msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "role": "assistant",
            "content": clean_ai_text,
            "tools_used": result.get("tools_used", []),
            "tool_activity": result.get("tool_activity", []),
            "phase": current_phase,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.messages.insert_one(ai_msg)

        update_title = conv.get("title", "New Conversation")
        if update_title == "New Conversation" and len(user_text) > 3:
            update_title = user_text[:50] + ("..." if len(user_text) > 50 else "")

        await db.conversations.update_one(
            {"id": conv_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "title": update_title, "expected_response_language": expect_lang},
             "$inc": {"message_count": 2}}
        )

        await _track_activity(user_text, result.get("tools_used", []), conv.get("scenario"))

        # Phase transition: if planner saved curriculum, switch to learning
        tools_used = result.get("tools_used", [])
        if ("save_curriculum" in tools_used or "revise_curriculum" in tools_used) and current_phase == "planning":
            await db.conversations.update_one(
                {"id": conv_id},
                {"$set": {"phase": "learning"}}
            )
        # Phase transition: if testing agent finished, switch back to learning
        if "finish_test" in tools_used and current_phase == "testing":
            await db.conversations.update_one(
                {"id": conv_id},
                {"$set": {"phase": "learning"}}
            )
        # Phase transition: if revision agent finished, switch back to learning
        if "finish_revision" in tools_used and current_phase == "revision":
            await db.conversations.update_one(
                {"id": conv_id},
                {"$set": {"phase": "learning"}}
            )

        # Wait for TTS
        audio_base64 = await tts_task

        # Deduct credits: STT + LLM + TTS
        llm_usage = result.get("usage", {})
        tts_chars = len(clean_ai_text) if audio_base64 else 0
        credits_used = await deduct_credits(user["id"], conv_id, {
            "llm_input_tokens": llm_usage.get("prompt_tokens", 0),
            "llm_output_tokens": llm_usage.get("completion_tokens", 0),
            "stt_seconds": audio_duration_sec,
            "tts_characters": tts_chars,
        })

        user_msg.pop("_id", None)
        ai_msg.pop("_id", None)
        user_msg_out = {k: v for k, v in user_msg.items() if k != "_id"}
        ai_msg_out = {k: v for k, v in ai_msg.items() if k != "_id"}

        done_event = {'type': 'done', 'user_message': user_msg_out, 'ai_message': ai_msg_out, 'transcribed_text': user_text, 'expected_response_language': expect_lang, 'credits_used': credits_used}
        if audio_base64:
            done_event['ai_audio_base64'] = audio_base64
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/tts")
async def text_to_speech(data: dict, user: dict = Depends(get_current_user)):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    audio_b64 = await generate_tts(text)
    if not audio_b64:
        raise HTTPException(status_code=500, detail="Failed to generate speech")
    return {"audio_base64": audio_b64}
