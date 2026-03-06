"""
Credit service — handles credit checking, deduction, and transaction logging.
"""

import math
from datetime import datetime, timezone
from config import db, logger


# Credit rates
LLM_INPUT_RATE = 1      # 1 credit per 1K input tokens
LLM_OUTPUT_RATE = 3     # 3 credits per 1K output tokens
STT_RATE = 0.3          # 0.3 credits per second of audio
TTS_RATE = 1            # 1 credit per 500 characters


class InsufficientCreditsError(Exception):
    pass


async def get_user_credits(user_id: str) -> int:
    """Get user's current credit balance."""
    sub = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    if not sub:
        # Auto-create free plan subscription
        sub = {
            "user_id": user_id,
            "plan": "free",
            "credits": 100,
            "max_conversations": 3,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.subscriptions.insert_one({**sub})
    return sub.get("credits", 0)


async def check_credits(user_id: str) -> int:
    """Check if user has credits. Returns balance. Raises InsufficientCreditsError if 0."""
    balance = await get_user_credits(user_id)
    if balance <= 0:
        raise InsufficientCreditsError("You've run out of credits. Please upgrade your plan to continue.")
    return balance


def calc_llm_credits(input_tokens: int, output_tokens: int) -> int:
    """Calculate credits for an LLM call."""
    input_credits = math.ceil(input_tokens / 1000) * LLM_INPUT_RATE
    output_credits = math.ceil(output_tokens / 1000) * LLM_OUTPUT_RATE
    return input_credits + output_credits


def calc_stt_credits(audio_seconds: float) -> int:
    """Calculate credits for STT (Whisper)."""
    return math.ceil(audio_seconds * STT_RATE)


def calc_tts_credits(char_count: int) -> int:
    """Calculate credits for TTS."""
    return math.ceil(char_count / 500) * 1


async def deduct_credits(user_id: str, conversation_id: str, breakdown: dict) -> int:
    """
    Deduct credits and log the transaction.
    breakdown: {
        "llm_input_tokens": int, "llm_output_tokens": int,
        "stt_seconds": float, "tts_characters": int
    }
    Returns the total credits deducted.
    """
    llm_input = breakdown.get("llm_input_tokens", 0)
    llm_output = breakdown.get("llm_output_tokens", 0)
    stt_sec = breakdown.get("stt_seconds", 0)
    tts_chars = breakdown.get("tts_characters", 0)

    llm_credits = calc_llm_credits(llm_input, llm_output) if (llm_input or llm_output) else 0
    stt_credits = calc_stt_credits(stt_sec) if stt_sec else 0
    tts_credits = calc_tts_credits(tts_chars) if tts_chars else 0

    total = llm_credits + stt_credits + tts_credits
    if total <= 0:
        return 0

    # Deduct atomically
    result = await db.subscriptions.find_one_and_update(
        {"user_id": user_id},
        {"$inc": {"credits": -total}},
        return_document=True,
        projection={"_id": 0, "credits": 1},
    )

    balance_after = result["credits"] if result else 0

    # Log transaction
    await db.credit_transactions.insert_one({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "type": "usage",
        "amount": -total,
        "balance_after": balance_after,
        "breakdown": {
            "llm_input_tokens": llm_input,
            "llm_output_tokens": llm_output,
            "llm_credits": llm_credits,
            "stt_seconds": round(stt_sec, 2),
            "stt_credits": stt_credits,
            "tts_characters": tts_chars,
            "tts_credits": tts_credits,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    logger.info(f"Credits deducted: {total} (LLM:{llm_credits} STT:{stt_credits} TTS:{tts_credits}) user={user_id} balance={balance_after}")
    return total


async def get_max_conversations(user_id: str) -> int:
    """Get the max conversations allowed for the user's plan. -1 = unlimited."""
    sub = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0, "max_conversations": 1})
    if not sub:
        return 3  # free plan default
    return sub.get("max_conversations", 3)
