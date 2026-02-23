"""
Custom Agent Framework for LinguaFlow — built from scratch, no SDK.
Uses GPT-5.2 native tool calling via litellm + Emergent proxy.

Architecture:
  Main Tutor Agent
    ├── tool: grammar_check      → runs Grammar Subagent (own loop + tools)
    ├── tool: vocabulary_lookup   → runs Vocabulary Subagent (own loop + tools)
    ├── tool: pronunciation_guide → runs Pronunciation Subagent (own loop + tools)
    ├── tool: evaluate_response   → runs Evaluation Subagent (own loop + tools)
    ├── tool: plan_curriculum     → hands off to Curriculum Planner Agent (HITL, multi-turn)
    ├── tool: start_scenario      → direct tool (returns scenario setup)
    ├── tool: advance_lesson      → direct tool (progresses curriculum)
    └── tool: set_proficiency_level → direct tool (saves level, triggers planning)

  Curriculum Planner Agent (separate agent, runs during "planning" phase)
    └── tool: save_curriculum → saves plan to DB, transitions back to main tutor
"""

import json
import logging
from typing import Optional
import litellm

from languages import get_language_name

logger = logging.getLogger(__name__)

PROXY_URL = "https://integrations.emergentagent.com/llm"
MODEL = "gpt-5.2"


# ──────────────────────────────────────────────────
# Tool Definitions (JSON schemas for the LLM)
# ──────────────────────────────────────────────────

MAIN_AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "grammar_check",
            "description": "Analyze the user's text for grammar errors and provide detailed corrections with explanations. Use this when the user's message has grammar issues or they ask for grammar help.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to check for grammar errors"
                    },
                    "target_language": {
                        "type": "string",
                        "description": "The language the text is written in"
                    }
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "vocabulary_lookup",
            "description": "Look up a word or phrase — provide definition, synonyms, antonyms, example sentences, and usage notes. Use when the user asks about a word's meaning or wants vocabulary help.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word or phrase to look up"
                    },
                    "target_language": {
                        "type": "string",
                        "description": "The language of the word"
                    },
                    "context": {
                        "type": "string",
                        "description": "Sentence or context where the word was used"
                    }
                },
                "required": ["word"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "pronunciation_guide",
            "description": "Provide detailed pronunciation guidance for a word — IPA transcription, syllable breakdown, stress patterns, common mistakes, mouth position tips. Use when the user asks how to pronounce something.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word to provide pronunciation guidance for"
                    },
                    "target_language": {
                        "type": "string",
                        "description": "The language of the word"
                    }
                },
                "required": ["word"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_response",
            "description": "Evaluate the user's response for fluency, grammar, vocabulary, and naturalness. Give a score and specific feedback. Use when you want to assess the user's language skills after they speak.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_text": {
                        "type": "string",
                        "description": "The user's text to evaluate"
                    },
                    "conversation_context": {
                        "type": "string",
                        "description": "The context of what the user was responding to"
                    },
                    "target_language": {
                        "type": "string",
                        "description": "The language being practiced"
                    }
                },
                "required": ["user_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "start_scenario",
            "description": "Start a role-play conversation scenario. Returns the scenario setup and your opening line. Use when the user wants to practice a real-world situation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_type": {
                        "type": "string",
                        "enum": ["job_interview", "restaurant", "travel", "small_talk", "business_meeting", "phone_call", "shopping", "doctor_visit"],
                        "description": "Type of scenario"
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Difficulty level"
                    }
                },
                "required": ["scenario_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_proficiency_level",
            "description": "Set the user's proficiency level after assessing their language skills through conversation. Call this after you've had 2-3 exchanges and can determine their level. This saves the level for future sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "The assessed proficiency level"
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Brief explanation of why this level was chosen based on the conversation"
                    }
                },
                "required": ["level", "reasoning"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "advance_lesson",
            "description": "Move to the next lesson in the curriculum. Call this when the user has sufficiently practiced the current lesson's topics and is ready to progress.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Brief summary of what the user learned/practiced in the current lesson"
                    }
                },
                "required": ["summary"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "plan_curriculum",
            "description": "Hand off to the Curriculum Planner subagent to create a personalized learning plan. Call this AFTER setting the user's proficiency level. The planner will take over the conversation to ask the user about their goals and timeline, then build a curriculum together.",
            "parameters": {
                "type": "object",
                "properties": {
                    "proficiency_level": {
                        "type": "string",
                        "description": "The user's assessed proficiency level"
                    },
                    "initial_context": {
                        "type": "string",
                        "description": "Any context about the user's goals gathered so far"
                    }
                },
                "required": ["proficiency_level"]
            }
        }
    }
]


# ──────────────────────────────────────────────────
# LLM Call Helper
# ──────────────────────────────────────────────────

async def llm_call(api_key: str, messages: list, system: str = None, tools: list = None, max_tokens: int = 1500):
    """Make a single LLM call via the Emergent proxy. Returns the raw response."""
    full_messages = []
    if system:
        full_messages.append({"role": "system", "content": system})
    full_messages.extend(messages)

    params = {
        "model": MODEL,
        "api_key": api_key,
        "api_base": PROXY_URL,
        "custom_llm_provider": "openai",
        "messages": full_messages,
        "max_tokens": max_tokens,
    }
    if tools:
        params["tools"] = tools

    return await litellm.acompletion(**params)


# ──────────────────────────────────────────────────
# Subagents — each is a specialized agent loop
# ──────────────────────────────────────────────────

async def run_grammar_subagent(api_key: str, text: str, target_language: str = "English") -> str:
    """Grammar checker subagent with its own tools and loop."""

    subagent_tools = [
        {
            "type": "function",
            "function": {
                "name": "identify_errors",
                "description": "Identify all grammar errors in the text systematically",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string"},
                        "language": {"type": "string"}
                    },
                    "required": ["text"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "suggest_correction",
                "description": "Suggest a corrected version of a phrase with explanation",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "original": {"type": "string", "description": "Original incorrect phrase"},
                        "corrected": {"type": "string", "description": "Corrected version"},
                        "rule": {"type": "string", "description": "Grammar rule explanation"}
                    },
                    "required": ["original", "corrected", "rule"]
                }
            }
        }
    ]

    system = f"""You are a grammar analysis specialist for {target_language}. 
Analyze the given text for grammar errors. Use your tools to systematically identify errors, 
then provide corrections with clear rule explanations. 
Be thorough but concise. Format your response clearly with original → corrected pairs."""

    messages = [{"role": "user", "content": f"Check this {target_language} text for grammar: \"{text}\""}]

    for _ in range(5):  # max 5 iterations
        response = await llm_call(api_key, messages, system=system, tools=subagent_tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": _serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or "No grammar issues found."

        # Execute subagent tools (these are "virtual" — the LLM uses them to structure its analysis)
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            if tc.function.name == "identify_errors":
                result = f"Analyzing '{args.get('text', text)}' in {args.get('language', target_language)}: proceed with error identification."
            elif tc.function.name == "suggest_correction":
                result = f"Correction noted: '{args.get('original','')}' → '{args.get('corrected','')}' (Rule: {args.get('rule','')})"
            else:
                result = "Done."
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", "Grammar check completed.")


async def run_vocabulary_subagent(api_key: str, word: str, target_language: str = "English", context: str = "") -> str:
    """Vocabulary lookup subagent with its own loop."""

    subagent_tools = [
        {
            "type": "function",
            "function": {
                "name": "define_word",
                "description": "Provide detailed definition including part of speech, register, etymology",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": {"type": "string"},
                        "definitions": {"type": "string", "description": "Comprehensive definitions"},
                        "part_of_speech": {"type": "string"},
                        "register": {"type": "string", "description": "formal/informal/neutral"}
                    },
                    "required": ["word", "definitions"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "find_examples",
                "description": "Generate example sentences showing the word in different contexts",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": {"type": "string"},
                        "examples": {"type": "string", "description": "3-5 example sentences"}
                    },
                    "required": ["word", "examples"]
                }
            }
        }
    ]

    system = f"""You are a vocabulary specialist for {target_language}. 
When given a word, provide a rich, helpful breakdown: definitions, synonyms, antonyms, 
example sentences in context, collocations, and register (formal/informal). 
If the word is in a language other than English, also provide the English translation."""

    ctx = f" (used in context: '{context}')" if context else ""
    messages = [{"role": "user", "content": f"Explain the {target_language} word/phrase: \"{word}\"{ctx}"}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=subagent_tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": _serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or f"Definition of '{word}' not found."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            if tc.function.name == "define_word":
                result = f"Definition structured: {args.get('definitions', '')} [{args.get('part_of_speech', '')}] ({args.get('register', 'neutral')})"
            elif tc.function.name == "find_examples":
                result = f"Examples compiled: {args.get('examples', '')}"
            else:
                result = "Done."
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", f"Vocabulary lookup for '{word}' completed.")


async def run_pronunciation_subagent(api_key: str, word: str, target_language: str = "English") -> str:
    """Pronunciation guide subagent."""

    subagent_tools = [
        {
            "type": "function",
            "function": {
                "name": "phonetic_breakdown",
                "description": "Break down word into phonetic components with IPA",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "word": {"type": "string"},
                        "ipa": {"type": "string", "description": "IPA transcription"},
                        "syllables": {"type": "string", "description": "Syllable breakdown with stress"},
                        "common_mistakes": {"type": "string", "description": "Common pronunciation errors"}
                    },
                    "required": ["word", "ipa"]
                }
            }
        }
    ]

    system = f"""You are a pronunciation coach for {target_language}. 
Provide detailed pronunciation guidance: IPA transcription, syllable-by-syllable breakdown, 
stress patterns, rhyming words, and common mistakes. 
Describe mouth/tongue positions for difficult sounds."""

    messages = [{"role": "user", "content": f"How do I pronounce \"{word}\" in {target_language}?"}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=subagent_tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": _serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or f"Pronunciation guide for '{word}'."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = f"Phonetics: IPA={args.get('ipa','')}, Syllables={args.get('syllables','')}, Mistakes={args.get('common_mistakes','')}"
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", f"Pronunciation guide for '{word}' completed.")


async def run_evaluation_subagent(api_key: str, user_text: str, context: str = "", target_language: str = "English") -> str:
    """Evaluates user's response for fluency, grammar, vocabulary, naturalness."""

    subagent_tools = [
        {
            "type": "function",
            "function": {
                "name": "score_response",
                "description": "Score the response on multiple criteria",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "grammar_score": {"type": "integer", "description": "1-10"},
                        "vocabulary_score": {"type": "integer", "description": "1-10"},
                        "fluency_score": {"type": "integer", "description": "1-10"},
                        "naturalness_score": {"type": "integer", "description": "1-10"},
                        "overall_feedback": {"type": "string"}
                    },
                    "required": ["grammar_score", "vocabulary_score", "fluency_score", "naturalness_score", "overall_feedback"]
                }
            }
        }
    ]

    system = f"""You are a language evaluation specialist for {target_language}. 
Score the user's response on grammar (1-10), vocabulary richness (1-10), 
fluency (1-10), and naturalness (1-10). Provide specific improvement suggestions."""

    ctx = f"\nConversation context: {context}" if context else ""
    messages = [{"role": "user", "content": f"Evaluate this {target_language} response: \"{user_text}\"{ctx}"}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=subagent_tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": _serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or "Evaluation completed."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = (
                f"Scores — Grammar: {args.get('grammar_score', 0)}/10, "
                f"Vocabulary: {args.get('vocabulary_score', 0)}/10, "
                f"Fluency: {args.get('fluency_score', 0)}/10, "
                f"Naturalness: {args.get('naturalness_score', 0)}/10. "
                f"Feedback: {args.get('overall_feedback', '')}"
            )
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", "Evaluation completed.")


# ──────────────────────────────────────────────────
# Direct Tools (no subagent needed)
# ──────────────────────────────────────────────────

SCENARIOS = {
    "job_interview": {"title": "Job Interview", "description": "Practice answering interview questions professionally"},
    "restaurant": {"title": "At a Restaurant", "description": "Practice ordering food and dining conversations"},
    "travel": {"title": "Travel & Directions", "description": "Practice navigating airports, hotels, directions"},
    "small_talk": {"title": "Small Talk", "description": "Master casual conversation and making friends"},
    "business_meeting": {"title": "Business Meeting", "description": "Practice professional meeting discussions"},
    "phone_call": {"title": "Phone Call", "description": "Practice phone conversations and call etiquette"},
    "shopping": {"title": "Shopping", "description": "Practice buying things, prices, and returns"},
    "doctor_visit": {"title": "Doctor Visit", "description": "Practice describing symptoms and medical visits"},
}


def start_scenario(scenario_type: str, difficulty: str = "intermediate") -> str:
    scenario = SCENARIOS.get(scenario_type, SCENARIOS["small_talk"])
    return json.dumps({
        "scenario": scenario["title"],
        "description": scenario["description"],
        "difficulty": difficulty,
        "instruction": f"Start role-playing as the other person in '{scenario['title']}'. Adjust to {difficulty} level. After each user response, give brief feedback."
    })


# ──────────────────────────────────────────────────
# Tool Router — maps tool name → execution
# ──────────────────────────────────────────────────

async def execute_tool(api_key: str, tool_name: str, arguments: dict, conversation_id: str = None, db=None) -> str:
    """Route a tool call to the appropriate handler (subagent or direct tool)."""
    target_lang = arguments.get("target_language", "English")

    if tool_name == "grammar_check":
        return await run_grammar_subagent(api_key, arguments["text"], target_lang)

    elif tool_name == "vocabulary_lookup":
        return await run_vocabulary_subagent(
            api_key, arguments["word"], target_lang, arguments.get("context", "")
        )

    elif tool_name == "pronunciation_guide":
        return await run_pronunciation_subagent(api_key, arguments["word"], target_lang)

    elif tool_name == "evaluate_response":
        return await run_evaluation_subagent(
            api_key, arguments["user_text"],
            arguments.get("conversation_context", ""),
            target_lang
        )

    elif tool_name == "start_scenario":
        return start_scenario(
            arguments["scenario_type"],
            arguments.get("difficulty", "intermediate")
        )

    elif tool_name == "set_proficiency_level":
        level = arguments.get("level", "beginner")
        reasoning = arguments.get("reasoning", "")
        # Save to DB and transition to planning phase
        if db is not None and conversation_id:
            await db.conversations.update_one(
                {"id": conversation_id},
                {"$set": {"proficiency_level": level, "phase": "planning"}}
            )
        return json.dumps({
            "status": "saved",
            "level": level,
            "reasoning": reasoning,
            "instruction": f"Level set to {level}. IMPORTANT: The conversation will now transition to curriculum planning mode. In your FINAL response for this turn, tell the user their level has been assessed and that you'd now like to create a personalized learning plan together. Ask them ONE question: what is their goal for learning this language?"
        })

    elif tool_name == "save_curriculum":
        timeline = arguments.get("timeline", "")
        goal = arguments.get("goal", "")
        lessons = arguments.get("lessons", [])
        if db is not None and conversation_id:
            from datetime import datetime, timezone
            import uuid as _uuid
            curriculum_doc = {
                "id": str(_uuid.uuid4()),
                "conversation_id": conversation_id,
                "proficiency_level": arguments.get("proficiency_level", "beginner"),
                "timeline": timeline,
                "goal": goal,
                "lessons": [
                    {**l, "status": "not_started"} for l in lessons
                ],
                "current_lesson": 0,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            # Mark first lesson as in_progress
            if curriculum_doc["lessons"]:
                curriculum_doc["lessons"][0]["status"] = "in_progress"
            await db.curricula.insert_one(curriculum_doc)
            curriculum_doc.pop("_id", None)
            # Transition to learning phase
            await db.conversations.update_one(
                {"id": conversation_id},
                {"$set": {"phase": "learning"}}
            )
        first_lesson = lessons[0] if lessons else {}
        return json.dumps({
            "status": "curriculum_saved",
            "total_lessons": len(lessons),
            "instruction": f"Curriculum saved! Now transition to teaching mode. Start with Lesson 1: {first_lesson.get('title', '')}. Topics: {', '.join(first_lesson.get('topics', []))}. Begin with ONE topic from this lesson."
        })

    elif tool_name == "advance_lesson":
        summary = arguments.get("summary", "")
        if db is not None and conversation_id:
            curr = await db.curricula.find_one({"conversation_id": conversation_id}, {"_id": 0})
            if curr:
                current = curr.get("current_lesson", 0)
                lessons = curr.get("lessons", [])
                # Mark current as completed
                if current < len(lessons):
                    await db.curricula.update_one(
                        {"conversation_id": conversation_id},
                        {"$set": {f"lessons.{current}.status": "completed", f"lessons.{current}.summary": summary}}
                    )
                # Move to next
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


# ──────────────────────────────────────────────────
# Utility: serialize tool_calls for message history
# ──────────────────────────────────────────────────

def _serialize_tool_calls(tool_calls):
    """Convert tool_calls to serializable format for message history."""
    if not tool_calls:
        return None
    return [
        {
            "id": tc.id,
            "type": "function",
            "function": {
                "name": tc.function.name,
                "arguments": tc.function.arguments
            }
        }
        for tc in tool_calls
    ]


# ──────────────────────────────────────────────────
# Main Agent Loop
# ──────────────────────────────────────────────────

def build_tutor_system_prompt(native_language: str = "en", target_language: str = "en") -> str:
    native_name = get_language_name(native_language)
    target_name = get_language_name(target_language)

    # Same language = user just wants to improve their existing language
    if native_language == target_language:
        return f"""You are LinguaFlow, a warm and expert {target_name} language tutor.

## Your role
Help the user improve their {target_name}. They already speak {target_name} and want to get better.

## Your tools
- grammar_check: analyze user's text for errors (delegates to grammar specialist)
- vocabulary_lookup: explain words, synonyms, examples (delegates to vocabulary specialist)
- pronunciation_guide: IPA, syllable breakdown, mouth tips (delegates to pronunciation coach)
- evaluate_response: score user's fluency/grammar/vocabulary (delegates to evaluation specialist)
- start_scenario: begin a role-play situation

## When to use tools
- Use grammar_check when the user writes something with errors OR asks for grammar help
- Use vocabulary_lookup when the user asks about a word meaning, synonym, or translation
- Use pronunciation_guide when the user asks how to pronounce a word
- Use evaluate_response when you want to give the user a detailed assessment of their speaking
- Use start_scenario when the user wants to practice a real-world situation

## Personality & Tone
- You're like a really chill friend who happens to be great at languages. NOT a textbook, NOT a formal teacher.
- Use casual, natural phrasing. Say things like "Nice one!", "Oh that's a tricky one", "Haha yeah, everyone mixes that up".
- NEVER say "Great question!", "Certainly!", "I'd be happy to help!" or other robotic AI phrases.
- Keep responses SHORT and punchy — 2-4 sentences max per thought, then prompt the user. Don't lecture.
- When correcting mistakes, be gentle and matter-of-fact. "Almost! You said X — it's actually Y because..."
- Share little "insider tips" like a native speaker would: "Honestly, most people just say X in everyday speech."
- Celebrate real progress genuinely: "Hey you nailed that conjugation — that one trips up a lot of people."

## CRITICAL: One thing at a time
- NEVER ask the user to do multiple things in one message. ONE question, ONE task, ONE prompt per response.
- Bad: "Try saying X. Also, what does Y mean? And can you use Z in a sentence?"
- Good: "Try saying X — how would you use it in a sentence?"
- If you correct something AND want to teach something new, pick ONE. Save the other for the next turn.
- Always end with exactly ONE simple prompt or question that the user can respond to easily."""

    # Different languages = user learning a new language
    return f"""You are LinguaFlow, a warm and expert {target_name} language tutor.

## Language Setup
- The user speaks: **{native_name}** (their fluent language)
- The user is learning: **{target_name}** (the language they want to practice)

## CRITICAL RULES for language use:
1. **Explain** all concepts, grammar rules, corrections, and tips in **{native_name}** — this is the language the user understands.
2. **Practice material** (example sentences, role-play dialogue, exercises) should be in **{target_name}** — this is what the user is learning.
3. When showing {target_name} text, always include a **{native_name} translation** next to it.
4. Format: {target_name} phrase → ({native_name} translation)
5. When correcting errors, explain WHY in {native_name}, show the correction in {target_name}.

## Example interaction pattern:
User says something in {target_name} (possibly with errors)
→ You acknowledge in {native_name}
→ If errors: explain ONE correction in {native_name}, show corrected {target_name}
→ End with ONE follow-up question or prompt (not multiple)

## Your tools (pass target_language="{target_name}" when calling them)
- grammar_check: analyze user's {target_name} text for errors
- vocabulary_lookup: explain {target_name} words with {native_name} translations
- pronunciation_guide: {target_name} pronunciation tips explained in {native_name}
- evaluate_response: score user's {target_name} proficiency
- start_scenario: begin a role-play in {target_name}
- set_proficiency_level: IMPORTANT — after 2-3 exchanges when you can assess the user's level, call this tool to save their proficiency (beginner/intermediate/advanced). This adapts the lesson difficulty.

## Proficiency Assessment Flow
If the conversation starts with an assessment question (like "How would you introduce yourself in {target_name}?"):
1. After the user responds, ask 1-2 more progressively harder questions in {target_name}
2. Based on their responses, call `set_proficiency_level` with the detected level
3. Then transition smoothly into a regular lesson at that level
4. Questions to ask progressively:
   - Q1: Simple introduction (tests basic vocabulary)
   - Q2: Describe what they did yesterday (tests past tense)
   - Q3: Give an opinion on a topic (tests complex expression)

## When to use tools
- Use grammar_check when the user writes {target_name} with errors OR asks for grammar help
- Use vocabulary_lookup when the user asks about a {target_name} word, or wants to know how to say something
- Use pronunciation_guide when the user asks how to pronounce a {target_name} word
- Use evaluate_response to assess the user's {target_name} skills
- Use start_scenario when the user wants to practice a real-world situation in {target_name}
- Use set_proficiency_level after assessing the user (2-3 exchanges during onboarding)

## Personality & Tone
- You're like a really chill friend who happens to be great at {target_name}. NOT a textbook, NOT a formal teacher.
- Use casual, natural phrasing. Say things like "Nice one!", "Oh that's a tricky one", "Haha yeah, everyone mixes that up".
- NEVER say "Great question!", "Certainly!", "I'd be happy to help!" or other robotic AI phrases.
- Keep responses SHORT and punchy — 2-4 sentences max per thought, then prompt the user. Don't lecture.
- When correcting, be gentle and real: "Almost! You said X — it's actually Y because..."
- Share "insider tips" like a native speaker would: "Honestly, most people just say X in everyday {target_name}."
- Celebrate real progress: "Hey you nailed that — that one trips up a lot of people."
- For complete beginners: mostly {native_name} with gradual {target_name} introduction
- For intermediate: mix of both, more {target_name} practice
- For advanced: mostly {target_name} with {native_name} only for complex explanations

## CRITICAL: One thing at a time
- NEVER give the user multiple tasks, questions, or exercises in one message. ONE thing per response.
- Bad: "Nice job! Now try saying X. Also, what does Y mean? And practice Z too."
- Good: "Nice job! Now try saying X — how would you use it in a sentence?"
- If you correct something AND want to teach something new, pick ONE. Save the other for the next turn.
- During proficiency assessment: ask ONE question per message, wait for the answer, then ask the next.
- Always end with exactly ONE simple prompt or question."""


# ──────────────────────────────────────────────────
# Curriculum Planning Tools & Prompt
# ──────────────────────────────────────────────────

PLANNING_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "save_curriculum",
            "description": "Save the finalized curriculum/learning plan after the user has agreed to it. Call this ONLY after the user confirms they're happy with the plan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timeline": {
                        "type": "string",
                        "description": "The learning timeline, e.g. '4 weeks, 1 hour/day' or '2 months, 3 sessions/week'"
                    },
                    "goal": {
                        "type": "string",
                        "description": "The user's learning goal, e.g. 'Travel to Japan' or 'Pass B2 exam'"
                    },
                    "lessons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "lesson_number": {"type": "integer"},
                                "title": {"type": "string"},
                                "topics": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "objective": {"type": "string"}
                            },
                            "required": ["lesson_number", "title", "topics", "objective"]
                        },
                        "description": "Ordered list of lessons in the curriculum"
                    }
                },
                "required": ["timeline", "goal", "lessons"]
            }
        }
    }
]


def build_curriculum_planner_prompt(native_language: str, target_language: str, proficiency_level: str = None) -> str:
    native_name = get_language_name(native_language)
    target_name = get_language_name(target_language)
    level = proficiency_level or "unknown"

    return f"""You are the LinguaFlow Curriculum Planner — a friendly learning coach who helps create personalized study plans.

## Language
- Write EVERYTHING in **{native_name}** (the user's native language).
- The user is learning: **{target_name}**
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
- Use {native_name} throughout.

## Flow
1. Ask about their goal → wait
2. Ask about their timeline → wait
3. (Optional) Ask about preferences → wait
4. Propose a curriculum with ~5-10 lessons tailored to their level ({level}), goal, and timeline
5. Let the user tweak it
6. Call `save_curriculum` when confirmed

## Tool
- `save_curriculum`: Call this to save the finalized plan. Only call it when the user says they're happy with it."""


def _build_curriculum_context(curriculum: dict) -> str:
    """Add curriculum context to the tutor's system prompt."""
    lessons = curriculum.get("lessons", [])
    current = curriculum.get("current_lesson", 0)
    goal = curriculum.get("goal", "")
    timeline = curriculum.get("timeline", "")

    if not lessons:
        return ""

    current_lesson = lessons[current] if current < len(lessons) else lessons[-1]
    total = len(lessons)
    progress = f"{current + 1}/{total}"

    ctx = f"\n\n## Active Curriculum"
    ctx += f"\n- Goal: {goal}"
    ctx += f"\n- Timeline: {timeline}"
    ctx += f"\n- Progress: Lesson {progress}"
    ctx += f"\n\n## Current Lesson: {current_lesson.get('title', '')}"
    ctx += f"\n- Objective: {current_lesson.get('objective', '')}"
    ctx += f"\n- Topics to cover: {', '.join(current_lesson.get('topics', []))}"
    ctx += f"\n\nFocus this conversation on the current lesson's topics. When the user has practiced enough on these topics, call `advance_lesson` to move to the next one."

    # Show what's coming next
    if current + 1 < total:
        next_lesson = lessons[current + 1]
        ctx += f"\n\n## Next up: Lesson {current + 2} — {next_lesson.get('title', '')}"

    return ctx


class LanguageTutorAgent:
    """
    Main tutor agent with a proper tool-calling loop.
    No SDK — just an LLM call → tool execution → feed results back → repeat.
    """

    def __init__(self, api_key: str, session_id: str, native_language: str = "en", target_language: str = "en", proficiency_level: str = None, conversation_id: str = None, db=None, phase: str = "learning", curriculum: dict = None):
        self.api_key = api_key
        self.session_id = session_id
        self.native_language = native_language
        self.target_language = target_language
        self.native_name = get_language_name(native_language)
        self.target_name = get_language_name(target_language)
        self.proficiency_level = proficiency_level
        self.conversation_id = conversation_id
        self.db = db
        self.phase = phase
        self.curriculum = curriculum

        # Build prompt based on phase
        if phase == "planning":
            self.system_prompt = build_curriculum_planner_prompt(native_language, target_language, proficiency_level)
            self.tools = PLANNING_TOOLS
        else:
            self.system_prompt = build_tutor_system_prompt(native_language, target_language)
            if proficiency_level:
                self.system_prompt += f"\n\n## User's Proficiency: {proficiency_level.upper()}\nAdapt all content to {proficiency_level} level."
            if curriculum and curriculum.get("lessons"):
                self.system_prompt += _build_curriculum_context(curriculum)
            self.tools = MAIN_AGENT_TOOLS

    async def process_message(
        self,
        user_text: str,
        conversation_history: list,
        scenario_context: Optional[str] = None
    ) -> dict:
        """
        The agent loop:
          user message → LLM decides tool calls → execute tools → feed results → repeat until done
        """
        # Build message history
        messages = []
        for msg in conversation_history[-10:]:  # last 10 messages for context
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

        # Compose current user message
        user_content = user_text
        if scenario_context:
            user_content = f"[Active scenario: {scenario_context}]\n{user_text}"

        messages.append({"role": "user", "content": user_content})

        tools_used = []
        max_iterations = 6  # safety limit

        try:
            for iteration in range(max_iterations):
                response = await llm_call(
                    api_key=self.api_key,
                    messages=messages,
                    system=self.system_prompt,
                    tools=self.tools,
                    max_tokens=2000
                )

                msg = response.choices[0].message
                finish_reason = response.choices[0].finish_reason

                # Append assistant message to history
                assistant_msg = {"role": "assistant", "content": msg.content or ""}
                if msg.tool_calls:
                    assistant_msg["tool_calls"] = _serialize_tool_calls(msg.tool_calls)
                messages.append(assistant_msg)

                # If done (no more tool calls), return the text
                if finish_reason != "tool_calls" or not msg.tool_calls:
                    final_text = msg.content or "I'm here to help — could you try rephrasing that?"
                    logger.info(f"Agent completed in {iteration + 1} iteration(s), tools: {tools_used}")
                    return {
                        "response": final_text,
                        "tools_used": tools_used,
                        "type": "scenario" if scenario_context else "chat"
                    }

                # Execute each tool call
                for tc in msg.tool_calls:
                    tool_name = tc.function.name
                    try:
                        arguments = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Agent] calling tool: {tool_name}({arguments})")
                    tools_used.append(tool_name)

                    # Execute tool (may spawn a subagent)
                    result = await execute_tool(self.api_key, tool_name, arguments, self.conversation_id, self.db)

                    # Feed result back to LLM
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result or "Tool completed."
                    })

            # Safety: if we hit max iterations, return last content
            return {
                "response": msg.content or "Let me help you with that — could you try again?",
                "tools_used": tools_used,
                "type": "chat"
            }

        except Exception as e:
            logger.error(f"Agent error: {e}", exc_info=True)
            return {
                "response": "I had a hiccup processing that. Could you try saying it again?",
                "tools_used": tools_used,
                "type": "error"
            }

    async def generate_welcome(self, scenario: str = None) -> str:
        """Generate a welcome message in the user's native language."""
        if scenario:
            context = f"The user chose the '{scenario.replace('_', ' ')}' role-play scenario. Set the scene and start with one line of in-character dialogue. If this is a cross-language session, the role-play dialogue should be in {self.target_name}."
        elif self.native_language != self.target_language:
            context = f"This is the user's first message. You need to assess their {self.target_name} level. Ask them ONE simple thing: to introduce themselves in {self.target_name}."
        else:
            context = f"The user wants to practice {self.target_name}. Ask them ONE question: what they'd like to work on today."

        prompt = (
            f"You are starting a new conversation. Write your opening message.\n"
            f"IMPORTANT: Write the message in {self.native_name} (the user's native language). "
            f"Only use {self.target_name} for example phrases or practice material.\n"
            f"Keep it to 2-3 short sentences. End with exactly ONE question or prompt.\n"
            f"Context: {context}"
        )

        try:
            response = await llm_call(
                api_key=self.api_key,
                messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt,
                tools=None,
                max_tokens=300
            )
            return response.choices[0].message.content or self._fallback_welcome(scenario)
        except Exception as e:
            logger.error(f"Welcome generation failed: {e}")
            return self._fallback_welcome(scenario)

    def _fallback_welcome(self, scenario: str = None) -> str:
        """Static English fallback if LLM call fails."""
        if scenario:
            return f"Let's practice a {scenario.replace('_', ' ')} scenario! I'll start — just respond naturally."
        if self.native_language != self.target_language:
            return f"Hey! Let's figure out your {self.target_name} level. Try introducing yourself in {self.target_name}!"
        return f"Hey! What would you like to work on today?"
