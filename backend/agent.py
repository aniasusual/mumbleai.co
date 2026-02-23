"""
Custom Agent Framework for LinguaFlow — built from scratch, no SDK.
Uses GPT-5.2 native tool calling via litellm + Emergent proxy.

Architecture:
  Main Tutor Agent
    ├── tool: grammar_check → runs Grammar Subagent (own loop + tools)
    ├── tool: vocabulary_lookup → runs Vocabulary Subagent (own loop + tools)
    ├── tool: pronunciation_guide → runs Pronunciation Subagent (own loop + tools)
    ├── tool: evaluate_response → runs Evaluation Subagent (own loop + tools)
    ├── tool: start_scenario → direct tool (returns scenario setup)
    └── tool: save_vocabulary → direct tool (saves word to DB)
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
        # Save to DB if available
        if db is not None and conversation_id:
            await db.conversations.update_one(
                {"id": conversation_id},
                {"$set": {"proficiency_level": level}}
            )
        return json.dumps({
            "status": "saved",
            "level": level,
            "reasoning": reasoning,
            "instruction": f"Level set to {level}. Now adapt your teaching to this level. For {level}: "
                + {"beginner": "use simple words, short sentences, lots of native language support, basic vocabulary",
                   "intermediate": "mix of target and native language, introduce idioms, more complex grammar, encourage longer responses",
                   "advanced": "mostly target language, complex topics, nuanced grammar, cultural references, minimal native language"}[level]
        })

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

## Personality
- Patient, encouraging, celebrate progress
- Conversational — not lecturing
- Adapt to user's level. Beginners get simpler language, advanced get challenges.
- End each response with a follow-up question or prompt to keep the conversation going.
- When correcting, show original vs corrected clearly."""

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
→ If errors: explain the correction in {native_name}, show corrected {target_name}
→ Teach a new word/phrase in {target_name} with {native_name} explanation
→ Ask a follow-up question in {target_name} (with {native_name} hint if needed)

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

## Personality
- Patient, encouraging, celebrate progress
- Conversational — make learning feel like chatting with a knowledgeable friend
- For complete beginners: mostly {native_name} with gradual {target_name} introduction
- For intermediate: mix of both, more {target_name} practice
- For advanced: mostly {target_name} with {native_name} only for complex explanations
- Always end with a prompt that encourages the user to try {target_name}"""


class LanguageTutorAgent:
    """
    Main tutor agent with a proper tool-calling loop.
    No SDK — just an LLM call → tool execution → feed results back → repeat.
    """

    def __init__(self, api_key: str, session_id: str, native_language: str = "en", target_language: str = "en", proficiency_level: str = None, conversation_id: str = None, db=None):
        self.api_key = api_key
        self.session_id = session_id
        self.native_language = native_language
        self.target_language = target_language
        self.native_name = get_language_name(native_language)
        self.target_name = get_language_name(target_language)
        self.proficiency_level = proficiency_level
        self.conversation_id = conversation_id
        self.db = db
        self.system_prompt = build_tutor_system_prompt(native_language, target_language)
        # Add proficiency context if known
        if proficiency_level:
            self.system_prompt += f"\n\n## User's Proficiency: {proficiency_level.upper()}\nAdapt all content to {proficiency_level} level."

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
                    tools=MAIN_AGENT_TOOLS,
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
