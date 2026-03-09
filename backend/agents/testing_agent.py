"""
Testing Agent — quizzes the user on what they've learned.
Called by the main tutor via `start_test` tool (phase-based handoff).
Interacts with the user for multiple turns, then produces feedback
that gets injected back into the tutor's context.
"""

import json
import logging
import uuid as _uuid
from datetime import datetime, timezone

from agents.llm import llm_call_stream, consume_stream
from agents.tool_executor import TOOL_LABELS

logger = logging.getLogger(__name__)

# Language name lookup (same as in other agents)
LANG_NAMES = {
    "en": "English", "es": "Spanish", "fr": "French", "de": "German",
    "it": "Italian", "pt": "Portuguese", "ja": "Japanese", "ko": "Korean",
    "zh": "Chinese", "ar": "Arabic", "hi": "Hindi", "ru": "Russian",
    "tr": "Turkish", "nl": "Dutch", "sv": "Swedish", "pl": "Polish",
    "th": "Thai", "vi": "Vietnamese", "id": "Indonesian", "el": "Greek",
}

# Testing agent's own tools
TESTING_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "finish_test",
            "description": "Call this when the test is complete. Provide a summary of the user's performance including score, strengths, weaknesses, and specific words or concepts they need to review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "score": {"type": "string", "description": "Overall performance, e.g., '7/10' or '85%' or 'Good'"},
                    "strengths": {"type": "string", "description": "What the user did well"},
                    "weaknesses": {"type": "string", "description": "What the user struggled with"},
                    "words_to_review": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific words or phrases the user got wrong or hesitated on"
                    },
                    "recommendation": {"type": "string", "description": "What the user should focus on next"}
                },
                "required": ["score", "strengths", "weaknesses", "recommendation"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information to create better test questions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    }
]


class TestingAgent:
    """Quizzes the user on learned material and produces performance feedback."""

    def __init__(self, api_key, session_id, native_language, target_language,
                 proficiency_level, conversation_id, db, curriculum=None, vocabulary=None,
                 test_context="", learning_summary=""):
        self.api_key = api_key
        self.session_id = session_id
        self.native_language = native_language
        self.target_language = target_language
        self.native_name = LANG_NAMES.get(native_language, native_language)
        self.target_name = LANG_NAMES.get(target_language, target_language)
        self.proficiency_level = proficiency_level
        self.conversation_id = conversation_id
        self.db = db
        self.curriculum = curriculum
        self.vocabulary = vocabulary or []
        self.test_context = test_context
        self.learning_summary = learning_summary
        self.tools = TESTING_TOOLS
        self.on_event = None
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        level = self.proficiency_level or "unknown"
        same_language = self.native_language == self.target_language

        # Build proficiency-specific testing instructions
        proficiency_test_guide = ""
        if level == "beginner":
            proficiency_test_guide = f"""
## Testing Style for BEGINNER
- Use simple, direct question types: "What does ___ mean?", "How do you say ___ in {self.target_name}?", "Pick the correct word: A or B."
- Focus on vocabulary recall and basic translation.
- Give hints if they're stuck — don't let them fail repeatedly. Confidence matters more than rigor.
- Keep questions short. One concept per question.
- Provide multiple-choice options when possible to reduce anxiety.
- Be extra encouraging. Celebrate correct answers warmly."""
        elif level == "intermediate":
            proficiency_test_guide = """
## Testing Style for INTERMEDIATE
- Mix question types: fill-in-the-blank, sentence building, translation of short sentences, context-based vocabulary.
- Test grammar patterns, not just vocabulary.
- Ask them to construct sentences, not just recall words.
- Challenge them with questions that require understanding context or choosing between similar words.
- Give brief feedback — they can handle honest assessment."""
        elif level == "advanced":
            proficiency_test_guide = """
## Testing Style for ADVANCED
- Use open-ended questions: "How would you explain ___ to someone?", "What's the difference between ___ and ___?", "Translate this nuanced sentence."
- Test cultural appropriateness, register, and subtle word choices.
- Include questions about idioms, formal vs informal usage, and natural phrasing.
- Don't give multiple-choice — make them produce answers from scratch.
- Be direct and precise with feedback. They want to know exactly what was wrong and why."""

        # Build curriculum context
        curriculum_info = ""
        if self.curriculum and self.curriculum.get("lessons"):
            current_idx = self.curriculum.get("current_lesson", 0)
            lessons = self.curriculum["lessons"]
            completed = [ls for ls in lessons if ls.get("status") == "completed"]
            current = lessons[current_idx] if current_idx < len(lessons) else None
            curriculum_info = f"""
## Curriculum Context
- Goal: {self.curriculum.get('goal', 'general practice')}
- Completed lessons: {len(completed)} of {len(lessons)}
- Current lesson: {current.get('title', 'unknown') if current else 'none'}
- Current lesson topics: {', '.join(current.get('topics', [])) if current else 'none'}"""

        # Build vocabulary context
        vocab_info = ""
        if self.vocabulary:
            vocab_items = [f"- {v.get('word', '')}: {v.get('definition', '')}" for v in self.vocabulary[:30]]
            vocab_info = f"""
## User's Saved Vocabulary ({len(self.vocabulary)} words)
{chr(10).join(vocab_items)}"""

        # Test context from the tutor
        test_ctx = ""
        if self.test_context:
            test_ctx = f"""
## Test Request Context
{self.test_context}"""

        # Learning summary from the tutor's conversation
        learning_ctx = ""
        if self.learning_summary:
            learning_ctx = f"""
## Recent Lesson Activity (what the tutor taught and the student practiced)
This is a summary of the recent tutor-student conversation. Use this to create targeted test questions about what was ACTUALLY covered, not just what's in the curriculum.
{self.learning_summary}"""

        if same_language:
            lang_instructions = f"""
## Language
- Communicate in {self.target_name}.
- Test the user's {self.target_name} skills at {level} level."""
        else:
            lang_instructions = f"""
## Language
- The user speaks {self.native_name} and is learning {self.target_name}.
- Level: {level}.
- Give instructions and feedback in {self.native_name}.
- Test questions and exercises should be in {self.target_name}."""

        return f"""You are the mumble Testing Agent, a friendly but thorough quiz master.

## CRITICAL: VOICE-FIRST — your text is SPOKEN ALOUD via TTS
- Your response is both displayed on screen AND spoken aloud. Write naturally like a person talking.
- You CAN use **bold** to highlight key words — TTS strips formatting automatically.
- No parentheses for side notes. Weave info naturally.
- Keep it conversational and encouraging.
{lang_instructions}
{curriculum_info}
{vocab_info}
{test_ctx}
{learning_ctx}
{proficiency_test_guide}

## Your Job
Test the user on what they have learned. Create a focused, interactive quiz with 5-7 questions.

## Test Design Rules
- Mix question types: vocabulary recall, translation, fill-in-the-blank, sentence building, listening comprehension cues.
- Ask ONE question at a time. Wait for the user's answer before moving to the next.
- After each answer, give brief feedback: correct or incorrect, and if wrong, explain the right answer naturally.
- Keep track of how many they get right and what they struggle with.
- Be encouraging but honest. Celebrate correct answers, gently correct wrong ones.
- Adapt difficulty: if they're doing well, make it slightly harder. If struggling, give a hint on the next one.

## Flow
1. Start by briefly explaining what you'll test them on, based on the curriculum and vocabulary above.
2. Ask questions one at a time.
3. After all questions, call `finish_test` with a performance summary.
4. After calling finish_test, give the user a brief encouraging wrap-up.

## Tools
- finish_test: Call when the quiz is complete. Provide score, strengths, weaknesses, words to review, and recommendation.
- web_search: Search for info if needed to create better questions.

## MANDATORY: Expected Response Language Tag
End EVERY response with [EXPECT_LANG:xx] where xx is the ISO 639-1 code of the language you expect the user to reply in.
For {self.target_name} practice: [EXPECT_LANG:{self.target_language}]
For {self.native_name} instructions: [EXPECT_LANG:{self.native_language}]"""

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        """Execute testing agent's own tools."""
        if tool_name == "web_search":
            query = arguments.get("query", "")
            if self.on_event:
                await self.on_event({"type": "substep", "parent": "web_search", "substep": "searching", "label": f"Searching: {query}"})
            try:
                from ddgs import DDGS
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=3))
                return json.dumps(results[:3]) if results else "No results found."
            except Exception as e:
                return f"Search failed: {e}"

        if tool_name == "finish_test":
            score = arguments.get("score", "N/A")
            strengths = arguments.get("strengths", "")
            weaknesses = arguments.get("weaknesses", "")
            words_to_review = arguments.get("words_to_review", [])
            recommendation = arguments.get("recommendation", "")

            if self.on_event:
                await self.on_event({"type": "substep", "parent": "finish_test", "substep": "saving_results", "label": "Saving test results"})

            # Build feedback summary for the tutor
            # Parse score to determine if revision is recommended
            score_str = str(score)
            needs_revision = False
            try:
                # Handle formats like "4/7", "60%", "3 out of 5"
                if "/" in score_str:
                    parts = score_str.split("/")
                    score_pct = float(parts[0].strip()) / float(parts[1].strip()) * 100
                elif "%" in score_str:
                    score_pct = float(score_str.replace("%", "").strip())
                else:
                    score_pct = float(score_str)
                needs_revision = score_pct < 60
            except (ValueError, ZeroDivisionError):
                needs_revision = False

            revision_note = ""
            if needs_revision:
                revision_note = (
                    " ACTION REQUIRED: The user scored below 60%. You SHOULD suggest starting a revision session "
                    "by calling start_revision to review the weak areas before advancing to the next lesson. "
                    "Say something like: 'Looks like a few things tripped you up — want to go over those before we move on?'"
                )
            else:
                revision_note = (
                    " The user did well! You can now call advance_lesson to move to the next lesson. "
                    "Congratulate them and ask if they're ready to continue."
                )

            feedback = (
                f"[Test Results] Score: {score}. "
                f"Strengths: {strengths}. "
                f"Weaknesses: {weaknesses}. "
                f"Words to review: {', '.join(words_to_review) if words_to_review else 'none'}. "
                f"Recommendation: {recommendation}.{revision_note}"
            )

            if self.db is not None and self.conversation_id:
                # Save test results to DB
                test_result = {
                    "id": str(_uuid.uuid4()),
                    "conversation_id": self.conversation_id,
                    "score": score,
                    "strengths": strengths,
                    "weaknesses": weaknesses,
                    "words_to_review": words_to_review,
                    "recommendation": recommendation,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.test_results.insert_one(test_result)

                # Inject feedback into the TUTOR's context (learning phase)
                await self.db.messages.insert_one({
                    "id": str(_uuid.uuid4()),
                    "conversation_id": self.conversation_id,
                    "role": "assistant",
                    "content": feedback,
                    "tools_used": [],
                    "phase": "learning",
                    "is_internal": True,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

            return json.dumps({
                "status": "test_complete",
                "score": score,
                "instruction": "Test is done. Give the user a brief encouraging wrap-up summarizing their performance. The tutor will receive your detailed feedback automatically."
            })

        return f"Unknown tool: {tool_name}"

    async def process_message(self, user_text: str, conversation_history: list, on_event=None, **kwargs) -> dict:
        self.on_event = on_event
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
                        "response": content or "Let's continue with the test!",
                        "tools_used": tools_used,
                        "tool_activity": tool_activity,
                        "type": "testing",
                        "usage": total_usage,
                    }

                for tc in tool_calls:
                    tool_name = tc["name"]
                    try:
                        arguments = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Testing Agent] calling tool: {tool_name}({arguments})")
                    tools_used.append(tool_name)

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
                "response": content or "Great job on the test!",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
                "type": "testing",
                "usage": total_usage,
            }

        except Exception as e:
            logger.error(f"Testing agent error: {e}", exc_info=True)
            return {
                "response": "I had a small issue, but no worries, we can try the test again!",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
                "type": "testing",
                "usage": total_usage,
            }

    async def generate_welcome(self) -> str:
        """Generate the testing agent's opening message."""
        messages = [{"role": "user", "content": "Start the test. Introduce what you'll be testing and ask the first question."}]

        try:
            stream = await llm_call_stream(
                api_key=self.api_key, messages=messages,
                system=self.system_prompt, tools=self.tools, max_tokens=2000
            )
            content, _, _, _ = await consume_stream(stream)
            return content or "Let's test what you've learned! Here's your first question."
        except Exception as e:
            logger.error(f"Testing agent welcome error: {e}")
            return "Let's test what you've learned! I'll ask you a few questions."
