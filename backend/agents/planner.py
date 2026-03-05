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
        self.on_event = None
        self.system_prompt = self._build_system_prompt()
        self.tools = PLANNER_TOOLS

    def _build_system_prompt(self) -> str:
        level = self.proficiency_level or "unknown"
        return f"""You are the mumble Curriculum Planner — a friendly learning coach who helps create personalized study plans.

## CRITICAL: VOICE-FIRST — your text is SPOKEN ALOUD via TTS
- Your response is both displayed on screen AND spoken aloud. Write naturally like a person talking.
- You CAN use **bold** to highlight lesson titles and key terms — the TTS strips formatting automatically.
- No parentheses for side notes. No labels or annotations.
- Keep it conversational and short.

## Language
- Speak in {self.native_name} (the user's native language).
- The user is learning {self.target_name}.
- Their current level is {level}.

## Your job
Gather the user's needs quickly and build a curriculum. You need to know their learning goal, their timeline, and any specific topics they care about.

## CRITICAL: Ask all questions at once
- In your FIRST message, ask all 3 questions together briefly. Don't ask one by one.
- After the user answers, immediately propose a curriculum plan. Don't ask follow-ups unless something critical is missing.
- Present the plan as a natural spoken list of lessons.
- Ask the user if they want to change anything.
- Only call save_curriculum when the user confirms.

## CRITICAL: Stay in your lane
- You are the PLANNER, not the tutor. NEVER teach lessons, vocabulary, grammar, or practice exercises.
- Your ONLY job is to design the curriculum. Once saved, the tutor takes over.

## Tone
- Casual, warm, encouraging — like a friend helping plan a study schedule.
- Keep messages short.

## Tools
- web_search: Search the web for info to build a better plan.
- save_curriculum: Save a NEW curriculum when the user confirms.
- revise_curriculum: Save a REVISED curriculum when the user confirms changes. Provide the FULL updated lesson list.
- When revising, first SHOW the proposed changes. ONLY call revise_curriculum after the user confirms.

## MANDATORY: Expected Response Language Tag
You MUST end EVERY single response with a language tag. NO EXCEPTIONS.
Format: [EXPECT_LANG:xx] where xx is the ISO 639-1 code.
Since you communicate in {self.native_name}, always use: [EXPECT_LANG:{self.native_language}]
This tag is invisible to the user. If you forget it, the voice system breaks."""

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        """Execute the planner's own tools."""
        if tool_name == "web_search":
            query = arguments.get("query", "")
            if self.on_event:
                await self.on_event({"type": "substep", "parent": "web_search", "substep": "searching", "label": f"Searching: {query[:50]}"})
            try:
                from duckduckgo_search import DDGS
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=5))
                if not results:
                    return "No results found for this search."
                formatted = []
                for r in results:
                    formatted.append(f"**{r.get('title', '')}**\n{r.get('body', '')}\nSource: {r.get('href', '')}")
                return "\n\n---\n\n".join(formatted)
            except Exception as e:
                return f"Web search failed: {str(e)}"

        if tool_name in ("save_curriculum", "revise_curriculum"):
            timeline = arguments.get("timeline", "")
            goal = arguments.get("goal", "")
            lessons = arguments.get("lessons", [])
            if self.on_event:
                label = "Saving your learning plan" if tool_name == "save_curriculum" else "Updating your learning plan"
                await self.on_event({"type": "substep", "parent": tool_name, "substep": "saving", "label": label})
            if self.db is not None and self.conversation_id:
                # Upsert: replace any existing curriculum for this conversation
                curriculum_doc = {
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

                existing = await self.db.curricula.find_one({"conversation_id": self.conversation_id})
                if existing:
                    await self.db.curricula.update_one(
                        {"conversation_id": self.conversation_id},
                        {"$set": curriculum_doc}
                    )
                else:
                    curriculum_doc["id"] = str(_uuid.uuid4())
                    await self.db.curricula.insert_one(curriculum_doc)

                # Inject the curriculum result into the TUTOR's context window
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
            action = "revised" if tool_name == "revise_curriculum" else "saved"
            return json.dumps({
                "status": f"curriculum_{action}",
                "total_lessons": len(lessons),
                "first_lesson_title": first_lesson.get("title", ""),
                "first_lesson_topics": first_lesson.get("topics", []),
                "instruction": f"Curriculum {action} with {len(lessons)} lessons! Summarize the plan briefly. Tell the user Lesson 1 is '{first_lesson.get('title', '')}' and ask if they're ready to start."
            })
        return f"Unknown planner tool: {tool_name}"

    async def process_message(self, user_text: str, conversation_history: list, on_event=None, **kwargs) -> dict:
        self.on_event = on_event
        """The planner's own agent loop with streaming.
        conversation_history already includes the current user message from DB."""
        messages = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in conversation_history
        ]

        tools_used = []
        tool_activity = []
        total_usage = {"prompt_tokens": 0, "completion_tokens": 0}
        max_iterations = 4

        try:
            for iteration in range(max_iterations):
                if on_event:
                    await on_event({"type": "thinking"})

                stream = await llm_call_stream(
                    api_key=self.api_key, messages=messages,
                    system=self.system_prompt, tools=self.tools, max_tokens=4000
                )
                content, tool_calls, finish_reason, usage = await consume_stream(stream, on_event=on_event)
                total_usage["prompt_tokens"] += usage.get("prompt_tokens", 0)
                total_usage["completion_tokens"] += usage.get("completion_tokens", 0)

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
                        "type": "planning",
                        "usage": total_usage,
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
                "type": "planning",
                "usage": total_usage,
            }

        except Exception as e:
            logger.error(f"Planner agent error: {e}", exc_info=True)
            return {
                "response": "I had a hiccup planning. Could you repeat what you'd like?",
                "tools_used": tools_used,
                "type": "error",
                "usage": total_usage,
            }

    async def generate_welcome(self, **kwargs) -> str:
        """Generate the planner's opening — asks all planning questions at once."""
        prompt = (
            f"You are starting the curriculum planning conversation. The user's {self.target_name} level is {self.proficiency_level or 'unknown'}.\n"
            f"Write a SHORT opening (1-2 sentences) in {self.native_name} introducing yourself as the learning plan designer. "
            f"Then ask ALL THREE questions in a brief numbered list: "
            f"1) What's their goal for learning {self.target_name}? "
            f"2) What's their timeline and how often can they practice? "
            f"3) Any specific topics they want to focus on? "
            f"Keep it casual and concise — no more than 4-5 lines total."
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


    async def generate_revision_proposal(self, change_request: str, existing_curriculum: dict) -> str:
        """Generate a revision proposal — present the changes and ask user to confirm."""
        lesson_summaries = [f"{i+1}. {l.get('title', '')}" for i, l in enumerate(existing_curriculum.get("lessons", []))]
        prompt = (
            f"The user has an existing curriculum:\n"
            f"Goal: {existing_curriculum.get('goal', '')}\n"
            f"Timeline: {existing_curriculum.get('timeline', '')}\n"
            f"Lessons: {'; '.join(lesson_summaries)}\n\n"
            f"They want to change: {change_request}\n\n"
            f"Write a SHORT response in {self.native_name}:\n"
            f"1. Show the REVISED plan with numbered lessons (incorporate their change)\n"
            f"2. Highlight what changed\n"
            f"3. Ask if they're happy with this or want more tweaks\n"
            f"Do NOT save it yet — wait for user confirmation."
        )
        try:
            response = await llm_call(
                api_key=self.api_key, messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt, tools=None, max_tokens=600
            )
            return response.choices[0].message.content or "Here's the revised plan — let me know if this works!"
        except Exception as e:
            logger.error(f"Planner revision proposal failed: {e}")
            return "Here's what I'd change — let me know if you'd like to adjust anything!"
