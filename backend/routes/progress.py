"""Progress and stats routes."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

from config import db
from models import ProgressResponse

router = APIRouter()


def _calculate_streak(date_strings: list) -> int:
    """Calculate consecutive days of activity."""
    if not date_strings:
        return 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dates = sorted(set(date_strings), reverse=True)

    if dates[0] != today:
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        if dates[0] != yesterday:
            return 0

    streak = 1
    for i in range(1, len(dates)):
        prev = datetime.strptime(dates[i - 1], "%Y-%m-%d")
        curr = datetime.strptime(dates[i], "%Y-%m-%d")
        if (prev - curr).days == 1:
            streak += 1
        else:
            break
    return streak


@router.get("/progress", response_model=ProgressResponse)
async def get_progress():
    total_convs = await db.conversations.count_documents({})
    total_msgs = await db.messages.count_documents({})
    vocab_count = await db.vocabulary.count_documents({})

    scenario_convs = await db.conversations.find(
        {"scenario": {"$ne": None}}, {"_id": 0, "scenario": 1}
    ).to_list(100)
    scenarios = list(set(c["scenario"] for c in scenario_convs if c.get("scenario")))

    pipeline = [
        {"$unwind": "$tools_used"},
        {"$group": {"_id": "$tools_used", "count": {"$sum": 1}}}
    ]
    tools_agg = await db.messages.aggregate(pipeline).to_list(20)
    tools_usage = {t["_id"]: t["count"] for t in tools_agg}

    activity_pipeline = [
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}}},
        {"$sort": {"_id": -1}},
        {"$limit": 30}
    ]
    activity_days = await db.messages.aggregate(activity_pipeline).to_list(30)
    streak = _calculate_streak([d["_id"] for d in activity_days])

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
