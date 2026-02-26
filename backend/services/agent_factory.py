"""
Agent factory — single place to create the correct agent based on conversation phase.
Eliminates duplication between text and voice message handlers.
"""

from config import EMERGENT_LLM_KEY, db
from agents.tutor import LanguageTutorAgent
from agents.planner import CurriculumPlannerAgent


async def create_agent_for_conversation(conv: dict, conv_id: str):
    """
    Create the correct agent based on conversation phase.
    Returns either a LanguageTutorAgent or CurriculumPlannerAgent.
    """
    native_lang = conv.get("native_language", "en")
    target_lang = conv.get("target_language", "en")
    proficiency = conv.get("proficiency_level")
    phase = conv.get("phase", "learning")

    if phase == "planning":
        return CurriculumPlannerAgent(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lingua_planner_{conv_id}",
            native_language=native_lang,
            target_language=target_lang,
            proficiency_level=proficiency,
            conversation_id=conv_id,
            db=db
        )

    curriculum = None
    if phase == "learning":
        curriculum = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})
        if not curriculum and native_lang != target_lang:
            # No curriculum yet — force back to assessment so the tutor hands off to planner
            phase = "assessment"
            await db.conversations.update_one(
                {"id": conv_id},
                {"$set": {"phase": "assessment"}}
            )

    return LanguageTutorAgent(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"lingua_{conv_id}",
        native_language=native_lang,
        target_language=target_lang,
        proficiency_level=proficiency,
        conversation_id=conv_id,
        db=db,
        phase=phase,
        curriculum=curriculum
    )
