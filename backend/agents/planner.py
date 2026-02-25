"""
Curriculum Planner Agent — a separate agent with its own tools and loop.
Runs during the "planning" phase. Has HITL: asks the user about goals,
timeline, preferences, then builds a curriculum together.
When the user confirms, calls save_curriculum and control returns to the main tutor.
"""

import json
import logging
import uuid as _uuid
from datetime import datetime, timezone
from agents.llm import llm_call, llm_call_stream, consume_stream
from agents.tools import PLANNER_TOOLS
from languages import get_language_name

logger = logging.getLogger(__name__)


class CurriculumPlannerAgent:

    def __init__(self, api_key: str, session_id: str, native_language: str,
                 target_language: str, proficiency_level: str = None,
                 conversation_id: str = None, db=None):
        self.api_key = api_key
        self.session_id = session_id
        self.native_language = native_language
        self.target_language = target_language
        self.native_name = get_language_name(native_language)
        self.target_name = get_language_name(target_language)
        self.proficiency_level = proficiency_level
        self.conversation_id = conversation_id
        self.db = db
        self.system_prompt = self._build_system_prompt()
        self.tools = PLANNER_TOOLS

    def _build_system_prompt(self) -> str:
        level = self.proficiency_level or "unknown"
        return f"""You are the mumble Curriculum Planner — a friendly learning coach who helps create personalized study plans.

## Language
- Write EVERYTHING in **{self.native_name}** (the user's native language).
- The user is learning: **{self.target_name}**
- Their current level: **{level}**

## Your job
Have a short conversation with the user to understand their needs, then build a curriculum together. You need to find out:
1. Their learning GOAL (travel, work, exams, hobby, etc.)
2. Their TIMELINE (how long they want to take, how often they can practice)
3. Any SPECIFIC topics they care about (e.g. business vocabulary, casual conversation, grammar focus)

## CRITICAL: One question at a time
- Ask ONE question per message. Wait for the answer before asking the next.
- After gathering enough info (2-3 questions), propose a curriculum plan.
- Present the plan clearly with numbered lessons.
- Ask the user if they want to change anything.
- Only call `save_curriculum` when the user confirms they're happy with the plan.

## Tone
- Casual, warm, encouraging — like a friend helping you plan a study schedule.
- Keep messages short. No walls of text.
- Use {self.native_name} throughout.

## Flow
1. Ask about their goal -> wait
2. Ask about their timeline -> wait
3. (Optional) Ask about preferences -> wait
4. Propose a curriculum with ~5-10 lessons tailored to their level ({level}), goal, and timeline
5. Let the user tweak it
6. Call `save_curriculum` when confirmed

## Tool
- `save_curriculum`: Call this to save the finalized plan. Only call it when the user says they're happy with it."""

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        """Execute the planner's own tools."""
        if tool_name == "save_curriculum":
            timeline = arguments.get("timeline", "")
            goal = arguments.get("goal", "")
            lessons = arguments.get("lessons", [])
            if self.db is not None and self.conversation_id:
                curriculum_doc = {
                    "id": str(_uuid.uuid4()),
                    "conversation_id": self.conversation_id,
                    "proficiency_level": self.proficiency_level or "beginner",
                    "timeline": timeline,
                    "goal": goal,
                    "lessons": [{**lesson, "status": "not_started"} for lesson in lessons],
                    "current_lesson": 0,
                    "status": "active",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                if curriculum_doc["lessons"]:
                    curriculum_doc["lessons"][0]["status"] = "in_progress"
                await self.db.curricula.insert_one(curriculum_doc)

                # Switch phase back to "learning"
                await self.db.conversations.update_one(
                    {"id": self.conversation_id},
                    {"$set": {"phase": "learning"}}
                )

                # Inject the curriculum result into the TUTOR's context window
                # so the tutor knows the plan when it resumes
                lesson_summaries = [f"{i+1}. {l.get('title', 'Untitled')}" for i, l in enumerate(lessons)]
                result_summary = (
                    f"[Curriculum Plan Complete] Goal: {goal}. Timeline: {timeline}. "
                    f"Level: {self.proficiency_level or 'beginner'}. "
                    f"Lessons: {'; '.join(lesson_summaries)}"
                )
                await self.db.messages.insert_one({
                    "id": str(_uuid.uuid4()),
                    "conversation_id": self.conversation_id,
                    "role": "assistant",
                    "content": result_summary,
                    "tools_used": [],
                    "phase": "learning",
                    "is_internal": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

            first_lesson = lessons[0] if lessons else {}
            return json.dumps({
                "status": "curriculum_saved",
                "total_lessons": len(lessons),
                "first_lesson_title": first_lesson.get("title", ""),
                "first_lesson_topics": first_lesson.get("topics", []),
                "instruction": f"Curriculum saved with {len(lessons)} lessons! Summarize the learning plan briefly for the user. Then tell them Lesson 1 is '{first_lesson.get('title', '')}' and ask them if they're ready to start. The tutor will take over from here."
            })
        return f"Unknown planner tool: {tool_name}"

    async def process_message(self, user_text: str, conversation_history: list, on_event=None, **kwargs) -> dict:
        """The planner's own agent loop with streaming.
        conversation_history already includes the current user message from DB."""
        messages = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in conversation_history[-10:]
        ]

        tools_used = []
        tool_activity = []
        max_iterations = 4

        try:
            for iteration in range(max_iterations):
                if on_event:
                    await on_event({"type": "thinking"})

                stream = await llm_call_stream(
                    api_key=self.api_key, messages=messages,
                    system=self.system_prompt, tools=self.tools, max_tokens=2000
                )
                content, tool_calls, finish_reason = await consume_stream(stream, on_event=on_event)

                # Build assistant message for history
                assistant_msg = {"role": "assistant", "content": content}
                if tool_calls:
                    assistant_msg["tool_calls"] = [
                        {"id": tc["id"], "type": "function",
                         "function": {"name": tc["name"], "arguments": tc["arguments"]}}
                        for tc in tool_calls
                    ]
                messages.append(assistant_msg)

                if finish_reason != "tool_calls" or not tool_calls:
                    return {
                        "response": content or "Let's keep planning your curriculum!",
                        "tools_used": tools_used,
                        "tool_activity": tool_activity,
                        "type": "planning"
                    }

                for tc in tool_calls:
                    tool_name = tc["name"]
                    try:
                        arguments = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Planner Agent] calling tool: {tool_name}({arguments})")
                    tools_used.append(tool_name)

                    from agents.tool_executor import TOOL_LABELS
                    tool_entry = {"tool": tool_name, "label": TOOL_LABELS.get(tool_name, tool_name), "status": "running", "substeps": []}
                    tool_activity.append(tool_entry)
                    if on_event:
                        await on_event({"type": "tool_start", "tool": tool_name, "label": tool_entry["label"]})

                    result = await self._execute_tool(tool_name, arguments)
                    messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result})

                    tool_entry["status"] = "done"
                    if on_event:
                        await on_event({"type": "tool_end", "tool": tool_name, "label": tool_entry["label"]})

            return {
                "response": content or "Let me finalize your study plan.",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
                "type": "planning"
            }

        except Exception as e:
            logger.error(f"Planner agent error: {e}", exc_info=True)
            return {
                "response": "I had a hiccup planning. Could you repeat what you'd like?",
                "tools_used": tools_used,
                "type": "error"
            }

    async def generate_welcome(self, **kwargs) -> str:
        """Generate the planner's opening question in the user's native language."""
        prompt = (
            f"You are starting the curriculum planning conversation. The user's {self.target_name} level is {self.proficiency_level or 'unknown'}.\n"
            f"Write a SHORT opening (1-2 sentences) in {self.native_name} introducing yourself as the learning plan designer. "
            f"Then ask ONE question: what is their goal for learning {self.target_name}?"
        )
        try:
            response = await llm_call(
                api_key=self.api_key, messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt, tools=None, max_tokens=200
            )
            return response.choices[0].message.content or f"Let's plan your {self.target_name} learning journey! What's your main goal?"
        except Exception as e:
            logger.error(f"Planner welcome failed: {e}")
            return f"Let's plan your {self.target_name} learning journey! What's your main goal?"
