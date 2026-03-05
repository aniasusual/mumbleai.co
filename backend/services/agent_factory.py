"""
Agent factory — single place to create the correct agent based on conversation phase.
Eliminates duplication between text and voice message handlers.
"""

from config import EMERGENT_LLM_KEY, db
from agents.tutor import LanguageTutorAgent
from agents.planner import CurriculumPlannerAgent
from agents.testing_agent import TestingAgent
from agents.revision_agent import RevisionAgent
from agents.tool_executor import _build_learning_summary


async def create_agent_for_conversation(conv: dict, conv_id: str):
    """
    Create the correct agent based on conversation phase.
    Returns LanguageTutorAgent, CurriculumPlannerAgent, TestingAgent, or RevisionAgent.
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

    if phase == "testing":
        curriculum = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})
        user_vocab = await db.vocabulary.find(
            {"user_id": conv.get("user_id")}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        learning_summary = await _build_learning_summary(db, conv_id)
        return TestingAgent(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lingua_tester_{conv_id}",
            native_language=native_lang,
            target_language=target_lang,
            proficiency_level=proficiency,
            conversation_id=conv_id,
            db=db,
            curriculum=curriculum,
            vocabulary=user_vocab,
            learning_summary=learning_summary
        )

    if phase == "revision":
        curriculum = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})
        user_vocab = await db.vocabulary.find(
            {"user_id": conv.get("user_id")}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        test_results = await db.test_results.find(
            {"conversation_id": conv_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(3)
        learning_summary = await _build_learning_summary(db, conv_id)
        return RevisionAgent(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"lingua_revisor_{conv_id}",
            native_language=native_lang,
            target_language=target_lang,
            proficiency_level=proficiency,
            conversation_id=conv_id,
            db=db,
            curriculum=curriculum,
            vocabulary=user_vocab,
            test_results=test_results,
            learning_summary=learning_summary
        )

    curriculum = None
    if phase == "learning":
        curriculum = await db.curricula.find_one({"conversation_id": conv_id}, {"_id": 0})

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
