"""
Tool executor — routes tool calls from the main agent to the correct handler.
Maps tool name -> subagent or direct execution.
Passes on_event callback to subagents for real-time activity tracking.
"""

import json
import re
import uuid
import logging
from datetime import datetime, timezone
from agents.subagents import (
    run_grammar_subagent,
    run_vocabulary_subagent,
    run_pronunciation_subagent,
    run_evaluation_subagent,
)
from scenarios import SCENARIOS

logger = logging.getLogger(__name__)

_EXPECT_LANG_RE = re.compile(r'\s*\[EXPECT_LANG:(\w+(?:-\w+)?)\]\s*$')

def _strip_lang_tag(text: str) -> str:
    """Strip [EXPECT_LANG:xx] tag from text, return clean text."""
    return _EXPECT_LANG_RE.sub('', text).rstrip()

# Human-readable labels for tools
TOOL_LABELS = {
    "grammar_check": "Checking grammar",
    "vocabulary_lookup": "Looking up vocabulary",
    "pronunciation_guide": "Preparing pronunciation guide",
    "evaluate_response": "Evaluating your response",
    "start_scenario": "Setting up scenario",
    "set_proficiency_level": "Assessing your level",
    "plan_curriculum": "Connecting with planner",
    "advance_lesson": "Advancing to next lesson",
    "save_curriculum": "Saving your learning plan",
    "revise_curriculum": "Revising your learning plan",
    "web_search": "Searching the web",
}


def start_scenario(scenario_type: str, difficulty: str = "intermediate") -> str:
    scenario = SCENARIOS.get(scenario_type, SCENARIOS["small_talk"])
    return json.dumps({
        "scenario": scenario["title"],
        "description": scenario["description"],
        "difficulty": difficulty,
        "instruction": f"Start role-playing as the other person in '{scenario['title']}'. Adjust to {difficulty} level. After each user response, give brief feedback."
    })


async def execute_tool(api_key: str, tool_name: str, arguments: dict, conversation_id: str = None, db=None, on_event=None) -> str:
    """Route a tool call to the appropriate handler (subagent or direct tool)."""
    target_lang = arguments.get("target_language", "English")

    if tool_name == "grammar_check":
        return await run_grammar_subagent(api_key, arguments["text"], target_lang, on_event=on_event)

    elif tool_name == "vocabulary_lookup":
        return await run_vocabulary_subagent(
            api_key, arguments["word"], target_lang, arguments.get("context", ""), on_event=on_event
        )

    elif tool_name == "pronunciation_guide":
        return await run_pronunciation_subagent(api_key, arguments["word"], target_lang, on_event=on_event)

    elif tool_name == "evaluate_response":
        return await run_evaluation_subagent(
            api_key, arguments["user_text"],
            arguments.get("conversation_context", ""),
            target_lang, on_event=on_event
        )

    elif tool_name == "start_scenario":
        return start_scenario(
            arguments["scenario_type"],
            arguments.get("difficulty", "intermediate")
        )

    elif tool_name == "set_proficiency_level":
        level = arguments.get("level", "beginner")
        reasoning = arguments.get("reasoning", "")
        if db is not None and conversation_id:
            await db.conversations.update_one(
                {"id": conversation_id},
                {"$set": {"proficiency_level": level}}
            )
        return json.dumps({
            "status": "saved",
            "level": level,
            "reasoning": reasoning,
            "instruction": f"Level set to {level}. Now you MUST call the `plan_curriculum` tool to hand off to the Curriculum Planner. Pass proficiency_level='{level}'. The planner will create a personalized study plan with the user."
        })

    elif tool_name == "plan_curriculum":
        proficiency = arguments.get("proficiency_level", "beginner")
        context = arguments.get("context", "initial planning")
        is_revision = False

        if db is not None and conversation_id:
            # Check if there's an existing curriculum (revision vs initial)
            existing = await db.curricula.find_one({"conversation_id": conversation_id}, {"_id": 0})
            is_revision = existing is not None

            # 1) Switch conversation phase to "planning"
            await db.conversations.update_one(
                {"id": conversation_id},
                {"$set": {"phase": "planning"}}
            )

            conv = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
            if conv:
                from agents.planner import CurriculumPlannerAgent
                planner = CurriculumPlannerAgent(
                    api_key=api_key,
                    session_id=f"lingua_planner_{conversation_id}",
                    native_language=conv.get("native_language", "en"),
                    target_language=conv.get("target_language", "en"),
                    proficiency_level=proficiency,
                    conversation_id=conversation_id,
                    db=db
                )

                if is_revision:
                    # Inject the existing curriculum + change request into planner's context
                    lesson_summaries = [f"{i+1}. {l.get('title', '')}" for i, l in enumerate(existing.get("lessons", []))]
                    revision_context = (
                        f"[Curriculum revision requested] "
                        f"Current plan: Goal={existing.get('goal', '')}, "
                        f"Timeline={existing.get('timeline', '')}, "
                        f"Lessons: {'; '.join(lesson_summaries)}. "
                        f"User wants: {context}"
                    )
                    await db.messages.insert_one({
                        "id": str(uuid.uuid4()),
                        "conversation_id": conversation_id,
                        "role": "user",
                        "content": revision_context,
                        "tools_used": [],
                        "phase": "planning",
                        "is_internal": True,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })

                    # Generate the planner's revision proposal (NOT saving yet — user must confirm)
                    if on_event:
                        await on_event({"type": "tool_start", "tool": "revise_curriculum", "label": "Revising your learning plan"})

                    planner_welcome = _strip_lang_tag(await planner.generate_revision_proposal(context, existing))

                    if on_event:
                        await on_event({"type": "tool_end", "tool": "revise_curriculum", "label": "Revising your learning plan"})

                    # Save planner's proposal into its context (user will interact with planner next)
                    await db.messages.insert_one({
                        "id": str(uuid.uuid4()),
                        "conversation_id": conversation_id,
                        "role": "assistant",
                        "content": planner_welcome,
                        "tools_used": [],
                        "phase": "planning",
                        "is_internal": True,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })

                    return json.dumps({
                        "status": "planner_revision_started",
                        "planner_message": planner_welcome,
                        "instruction": (
                            f"The Curriculum Planner is now active for revision. "
                            f"Relay the planner's message to the user: \"{planner_welcome}\" "
                            f"The planner will handle the rest — the user will interact with it directly."
                        )
                    })

                else:
                    # Initial planning — generate welcome
                    planner_welcome = _strip_lang_tag(await planner.generate_welcome())
                    await db.messages.insert_one({
                        "id": str(uuid.uuid4()),
                        "conversation_id": conversation_id,
                        "role": "assistant",
                        "content": planner_welcome,
                        "tools_used": [],
                        "phase": "planning",
                        "is_internal": True,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })

                    return json.dumps({
                        "status": "planner_started",
                        "planner_message": planner_welcome,
                        "instruction": (
                            f"The Curriculum Planner is now active. "
                            f"Relay the planner's message to the user naturally: \"{planner_welcome}\" "
                            f"You can add a brief transition (1 sentence max), but include the planner's question verbatim."
                        )
                    })

        return json.dumps({
            "status": "handoff_to_planner",
            "instruction": "Phase switched to planning. Tell the user you're connecting them with the learning plan designer."
        })

    elif tool_name == "save_curriculum":
        return json.dumps({"status": "error", "instruction": "save_curriculum is handled by the Curriculum Planner agent, not the main tutor."})

    elif tool_name == "revise_curriculum":
        return json.dumps({"status": "error", "instruction": "revise_curriculum is handled by the Curriculum Planner agent, not the main tutor."})

    elif tool_name == "advance_lesson":
        summary = arguments.get("summary", "")
        if db is not None and conversation_id:
            curr = await db.curricula.find_one({"conversation_id": conversation_id}, {"_id": 0})
            if curr:
                current = curr.get("current_lesson", 0)
                lessons = curr.get("lessons", [])
                if current < len(lessons):
                    await db.curricula.update_one(
                        {"conversation_id": conversation_id},
                        {"$set": {f"lessons.{current}.status": "completed", f"lessons.{current}.summary": summary}}
                    )
                next_idx = current + 1
                if next_idx < len(lessons):
                    await db.curricula.update_one(
                        {"conversation_id": conversation_id},
                        {"$set": {"current_lesson": next_idx, f"lessons.{next_idx}.status": "in_progress"}}
                    )
                    next_lesson = lessons[next_idx]
                    return json.dumps({
                        "status": "advanced",
                        "new_lesson": next_idx + 1,
                        "title": next_lesson.get("title", ""),
                        "topics": next_lesson.get("topics", []),
                        "instruction": f"Great progress! Now start Lesson {next_idx + 1}: {next_lesson.get('title', '')}. Topics: {', '.join(next_lesson.get('topics', []))}. Begin with ONE topic."
                    })
                else:
                    await db.curricula.update_one(
                        {"conversation_id": conversation_id},
                        {"$set": {"status": "completed"}}
                    )
                    return json.dumps({"status": "curriculum_completed", "instruction": "The user has completed all lessons! Congratulate them and suggest what to do next."})
        return json.dumps({"status": "no_curriculum"})

    return f"Unknown tool: {tool_name}"
