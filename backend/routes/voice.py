"""Voice message (STT -> Agent -> TTS) and standalone TTS routes."""

import os
import uuid
import asyncio
import base64
import logging
import tempfile
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from langdetect import detect as detect_language

from config import db, EMERGENT_LLM_KEY
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
from services.agent_factory import create_agent_for_conversation
from routes.conversations import _track_activity
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


def _pick_best_transcription(native_text, target_text, native_lang, target_lang):
    """
    Given two Whisper transcriptions (one forced to native lang, one to target lang),
    detect which language the user actually spoke and return the best transcription.
    """
    if not native_text:
        return target_text
    if not target_text:
        return native_text

    # If both are identical, language doesn't matter
    if native_text.strip().lower() == target_text.strip().lower():
        return native_text

    # Use langdetect to figure out which language the user actually spoke
    try:
        detected = detect_language(native_text)
    except Exception:
        detected = native_lang

    detected_normalized = detected.split("-")[0].lower()
    target_normalized = target_lang.split("-")[0].lower()

    if detected_normalized == target_normalized:
        return target_text
    else:
        return native_text


async def generate_tts(text: str) -> Optional[str]:
    """Shared TTS helper — returns base64 audio or None on failure."""
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        tts_text = text[:4000] if len(text) > 4000 else text
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
    user: dict = Depends(get_current_user),
):
    conv = await db.conversations.find_one({"id": conv_id, "user_id": user["id"]}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc).isoformat()
    native_lang = conv.get("native_language", "en")
    target_lang = conv.get("target_language", "en")

    # Step 1: Transcribe with constrained dual-language Whisper
    # Instead of auto-detect (all languages), we run two parallel passes
    # constrained to only the two languages the user actually uses.
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    audio_bytes = await audio.read()

    suffix = ".webm"
    if audio.content_type:
        ext_map = {"audio/webm": ".webm", "audio/wav": ".wav", "audio/mp3": ".mp3",
                    "audio/mpeg": ".mp3", "audio/ogg": ".ogg", "audio/mp4": ".mp4"}
        suffix = ext_map.get(audio.content_type, ".webm")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        if native_lang == target_lang:
            # Same language — single Whisper call with language hint
            with open(tmp_path, "rb") as f:
                response = await stt.transcribe(
                    file=f, model="whisper-1",
                    response_format="json", temperature=0.0,
                    language=native_lang
                )
            user_text = response.text
            charitable_text = None
        else:
            # Different languages — run two Whisper calls in parallel
            async def transcribe_with_lang(lang):
                with open(tmp_path, "rb") as f:
                    return await stt.transcribe(
                        file=f, model="whisper-1",
                        response_format="json", temperature=0.0,
                        language=lang
                    )

            native_result, target_result = await asyncio.gather(
                transcribe_with_lang(native_lang),
                transcribe_with_lang(target_lang),
                return_exceptions=True
            )

            native_text = native_result.text if not isinstance(native_result, Exception) else None
            target_text = target_result.text if not isinstance(target_result, Exception) else None

            if not native_text and not target_text:
                raise Exception("Both transcription passes failed")

            # Pick the best transcription using language detection
            user_text = _pick_best_transcription(
                native_text, target_text, native_lang, target_lang
            )

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

    # Save user message tagged with current phase
    current_phase = conv.get("phase", "learning")
    user_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "user",
        "content": user_text.strip(),
        "tools_used": [],
        "phase": current_phase,
        "created_at": now
    }
    await db.messages.insert_one(user_msg)

    # Step 2: Process through agent — load only this agent's phase history
    history = await db.messages.find(
        {"conversation_id": conv_id, "phase": current_phase}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    history_for_agent = [{"role": m["role"], "content": m["content"]} for m in history]

    agent = await create_agent_for_conversation(conv, conv_id)
    result = await agent.process_message(
        user_text=user_text.strip(),
        conversation_history=history_for_agent,
        scenario_context=scenario_context or conv.get("scenario")
    )

    ai_text = result["response"]

    # Save AI message tagged with current phase
    ai_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "role": "assistant",
        "content": ai_text,
        "tools_used": result.get("tools_used", []),
        "phase": current_phase,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(ai_msg)

    # Step 3: Generate TTS
    audio_base64 = await generate_tts(ai_text)

    # Update conversation
    update_title = conv.get("title", "New Conversation")
    if update_title == "New Conversation" and len(user_text) > 3:
        update_title = user_text[:50] + ("..." if len(user_text) > 50 else "")

    await db.conversations.update_one(
        {"id": conv_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "title": update_title},
         "$inc": {"message_count": 2}}
    )

    await _track_activity(user_text, result.get("tools_used", []), conv.get("scenario"))

    # Phase transition: if planner saved curriculum, switch to learning
    if "save_curriculum" in result.get("tools_used", []) and current_phase == "planning":
        await db.conversations.update_one(
            {"id": conv_id},
            {"$set": {"phase": "learning"}}
        )

    user_msg.pop("_id", None)
    ai_msg.pop("_id", None)

    return JSONResponse(content={
        "user_message": {
            "id": user_msg["id"], "conversation_id": conv_id, "role": "user",
            "content": user_msg["content"], "tools_used": [], "created_at": user_msg["created_at"]
        },
        "ai_message": {
            "id": ai_msg["id"], "conversation_id": conv_id, "role": "assistant",
            "content": ai_msg["content"], "tools_used": ai_msg["tools_used"], "created_at": ai_msg["created_at"]
        },
        "ai_audio_base64": audio_base64,
        "transcribed_text": user_text.strip()
    })


@router.post("/tts")
async def text_to_speech(data: dict, user: dict = Depends(get_current_user)):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    audio_b64 = await generate_tts(text)
    if not audio_b64:
        raise HTTPException(status_code=500, detail="Failed to generate speech")
    return {"audio_base64": audio_b64}
