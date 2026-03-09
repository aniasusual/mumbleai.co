"""
Revision Agent — reviews and re-teaches weak areas from test results.
Called by the main tutor via `start_revision` tool (phase-based handoff).
Drills vocabulary, re-explains concepts, and builds confidence on weak spots.
"""

import json
import logging
import uuid as _uuid
from datetime import datetime, timezone

from agents.llm import llm_call_stream, consume_stream
from agents.tool_executor import TOOL_LABELS

logger = logging.getLogger(__name__)

LANG_NAMES = {
    "en": "English", "es": "Spanish", "fr": "French", "de": "German",
    "it": "Italian", "pt": "Portuguese", "ja": "Japanese", "ko": "Korean",
    "zh": "Chinese", "ar": "Arabic", "hi": "Hindi", "ru": "Russian",
    "tr": "Turkish", "nl": "Dutch", "sv": "Swedish", "pl": "Polish",
    "th": "Thai", "vi": "Vietnamese", "id": "Indonesian", "el": "Greek",
}

REVISION_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "finish_revision",
            "description": "Call this when the revision session is complete. Summarize what was reviewed, what improved, and what still needs work.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topics_reviewed": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of topics or words that were reviewed"
                    },
                    "improved": {"type": "string", "description": "What the user improved on during this revision"},
                    "still_weak": {"type": "string", "description": "What still needs more practice"},
                    "recommendation": {"type": "string", "description": "What to do next"}
                },
                "required": ["topics_reviewed", "improved", "recommendation"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information to help with revision examples.",
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


class RevisionAgent:
    """Reviews weak areas from tests and re-teaches concepts the user struggled with."""

    def __init__(self, api_key, session_id, native_language, target_language,
                 proficiency_level, conversation_id, db, curriculum=None,
                 vocabulary=None, test_results=None, revision_context="", learning_summary=""):
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
        self.test_results = test_results or []
        self.revision_context = revision_context
        self.learning_summary = learning_summary
        self.tools = REVISION_TOOLS
        self.on_event = None
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        level = self.proficiency_level or "unknown"
        same_language = self.native_language == self.target_language

        # Build proficiency-specific revision instructions
        proficiency_revision_guide = ""
        if level == "beginner":
            proficiency_revision_guide = """
## Revision Style for BEGINNER
- Re-teach from scratch using even simpler language and examples than before.
- Break each concept into the smallest possible pieces.
- Use lots of repetition: say it, practice it, repeat it in a new context.
- For vocabulary: give the word, meaning, phonetic guide, one simple example, then ask them to say it.
- If they still struggle with a word, try a mnemonic or a fun association.
- Be extra patient and encouraging. Build their confidence back up after a rough test.
- Never move to the next concept until they've gotten the current one right at least once."""
        elif level == "intermediate":
            proficiency_revision_guide = """
## Revision Style for INTERMEDIATE
- Re-teach using a different angle or context than the original lesson.
- Contrast the correct form with the common mistake they made: "You said X, but it should be Y because..."
- For vocabulary: give the word in a new sentence, explain the nuance, and ask them to use it in their own sentence.
- For grammar: show the pattern clearly and give 2-3 quick practice examples.
- Keep it efficient — they don't need hand-holding, just targeted practice on weak spots."""
        elif level == "advanced":
            proficiency_revision_guide = """
## Revision Style for ADVANCED
- Focus on WHY their answer was wrong or unnatural, not just what the correct answer is.
- For vocabulary: discuss the subtle difference between what they said and the more natural alternative.
- For grammar: explain the nuance — they probably know the rule but misapplied it in context.
- Use real-world examples: "A native speaker would say it like this because..."
- Challenge them to self-correct before giving the answer.
- Keep it peer-to-peer. They don't need encouragement — they need precision."""

        # Build test results context
        test_info = ""
        if self.test_results:
            test_entries = []
            for tr in self.test_results[:3]:
                entry = f"Score: {tr.get('score', 'N/A')}"
                if tr.get("weaknesses"):
                    entry += f", Weaknesses: {tr['weaknesses']}"
                if tr.get("words_to_review"):
                    entry += f", Words to review: {', '.join(tr['words_to_review'])}"
                test_entries.append(entry)
            test_info = f"""
## Recent Test Results (focus your revision on these weak areas)
{chr(10).join('- ' + e for e in test_entries)}"""

        # Build vocabulary context
        vocab_info = ""
        if self.vocabulary:
            vocab_items = [f"- {v.get('word', '')}: {v.get('definition', '')}" for v in self.vocabulary[:30]]
            vocab_info = f"""
## User's Saved Vocabulary ({len(self.vocabulary)} words)
{chr(10).join(vocab_items)}"""

        # Curriculum context
        curriculum_info = ""
        if self.curriculum and self.curriculum.get("lessons"):
            current_idx = self.curriculum.get("current_lesson", 0)
            lessons = self.curriculum["lessons"]
            current = lessons[current_idx] if current_idx < len(lessons) else None
            curriculum_info = f"""
## Curriculum Context
- Current lesson: {current.get('title', 'unknown') if current else 'none'}
- Topics: {', '.join(current.get('topics', [])) if current else 'none'}"""

        revision_ctx = ""
        if self.revision_context:
            revision_ctx = f"""
## Revision Request
{self.revision_context}"""

        # Learning summary from the tutor's conversation
        learning_ctx = ""
        if self.learning_summary:
            learning_ctx = f"""
## Recent Lesson Activity (what the tutor taught and the student practiced)
This is a summary of the recent tutor-student conversation. Use this to understand what was covered, what the student struggled with, and what they practiced. Focus your revision on areas where the student had difficulty.
{self.learning_summary}"""

        if same_language:
            lang_instructions = f"""
## Language
- Communicate in {self.target_name}.
- Review the user's {self.target_name} weak areas at {level} level."""
        else:
            lang_instructions = f"""
## Language
- The user speaks {self.native_name} and is learning {self.target_name}.
- Level: {level}.
- Give explanations in {self.native_name}.
- Practice material and examples in {self.target_name}. Always explain meanings naturally."""

        return f"""You are the mumble Revision Coach, a patient and encouraging tutor who helps users strengthen their weak spots.

## CRITICAL: VOICE-FIRST — your text is SPOKEN ALOUD via TTS
- Your response is both displayed on screen AND spoken aloud. Write naturally like a person talking.
- You CAN use **bold** to highlight key words — TTS strips formatting automatically.
- No parentheses for side notes. Weave info naturally into sentences.
- Keep it conversational, warm, and encouraging.
{lang_instructions}
{test_info}
{vocab_info}
{curriculum_info}
{revision_ctx}
{learning_ctx}
{proficiency_revision_guide}

## Your Job
Revisit and re-teach the areas where the user struggled. The revision may cover weak areas accumulated across MULTIPLE lessons and tests. Focus on test weaknesses and words they got wrong.

## Revision Approach
- Start by briefly telling the user what you'll review, based on their test results above.
- Re-teach ONE concept or word at a time. Explain it clearly, give a fresh example, then ask the user to practice it.
- If they get it right, move to the next weak area. If they still struggle, try a different angle or simpler example.
- Be extra patient and encouraging. The point is to build confidence, not to test again.
- After covering 3-5 weak areas, call `finish_revision` to wrap up.

## Revision Techniques
- For vocabulary: give the word, its meaning, a new example sentence, and ask the user to use it in their own sentence.
- For grammar: show the correct pattern, contrast it with the common mistake, give a practice sentence.
- For pronunciation: give the phonetic guide naturally and ask them to say the word.
- For comprehension: rephrase the concept in simpler terms.

## Tools
- finish_revision: Call when the revision session is done. Summarize what improved and what still needs work.
- web_search: Search for additional examples or context if needed.

## MANDATORY: Expected Response Language Tag
End EVERY response with [EXPECT_LANG:xx] where xx is the ISO 639-1 code.
For {self.target_name} practice: [EXPECT_LANG:{self.target_language}]
For {self.native_name} instructions: [EXPECT_LANG:{self.native_language}]"""

    async def _execute_tool(self, tool_name: str, arguments: dict) -> str:
        """Execute revision agent's own tools."""
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

        if tool_name == "finish_revision":
            topics_reviewed = arguments.get("topics_reviewed", [])
            improved = arguments.get("improved", "")
            still_weak = arguments.get("still_weak", "")
            recommendation = arguments.get("recommendation", "")

            if self.on_event:
                await self.on_event({"type": "substep", "parent": "finish_revision", "substep": "saving", "label": "Saving revision summary"})

            feedback = (
                f"[Revision Complete] Topics reviewed: {', '.join(topics_reviewed)}. "
                f"Improved: {improved}. "
                f"Still needs work: {still_weak or 'nothing major'}. "
                f"Recommendation: {recommendation}"
            )

            if self.db is not None and self.conversation_id:
                # Inject feedback into tutor's learning phase
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
                "status": "revision_complete",
                "instruction": "Revision is done. Give the user a brief encouraging wrap-up. The tutor will receive your feedback automatically."
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
                        "response": content or "Let's keep reviewing!",
                        "tools_used": tools_used,
                        "tool_activity": tool_activity,
                        "type": "revision",
                        "usage": total_usage,
                    }

                for tc in tool_calls:
                    tool_name = tc["name"]
                    try:
                        arguments = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Revision Agent] calling tool: {tool_name}({arguments})")
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
                "response": content or "Great revision session!",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
                "type": "revision",
                "usage": total_usage,
            }

        except Exception as e:
            logger.error(f"Revision agent error: {e}", exc_info=True)
            return {
                "response": "I had a small hiccup, but no worries, let's continue reviewing!",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
                "type": "revision",
                "usage": total_usage,
            }

    async def generate_welcome(self) -> str:
        """Generate the revision agent's opening message."""
        messages = [{"role": "user", "content": "Start the revision session. Tell me what we'll review based on my test results and start with the first weak area."}]

        try:
            stream = await llm_call_stream(
                api_key=self.api_key, messages=messages,
                system=self.system_prompt, tools=self.tools, max_tokens=2000
            )
            content, _, _, _ = await consume_stream(stream)
            return content or "Let's review what you found tricky. I'll walk you through each area."
        except Exception as e:
            logger.error(f"Revision agent welcome error: {e}")
            return "Let's go over the areas you found tricky and strengthen them."
