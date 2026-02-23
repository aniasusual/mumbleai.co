"""
Custom AI Agent for LinguaFlow - Built from scratch, no agent SDK.
Uses OpenAI GPT-5.2 function calling for tool routing.
Supports 50+ languages.
"""

import logging
from typing import Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

from tools import execute_tool
from languages import get_language_name

logger = logging.getLogger(__name__)


def build_system_prompt(target_language: str = "en") -> str:
    lang_name = get_language_name(target_language)

    if target_language == "en":
        return """You are LinguaFlow, a warm, encouraging, and expert English language tutor. Your mission is to help users improve their spoken English through conversation practice, grammar correction, vocabulary building, and real-world scenario practice.

## Your Personality
- Patient and encouraging - celebrate small wins
- Adapt to the user's level automatically
- Use simple explanations with relatable examples
- Be conversational, not lecturing
- Inject gentle humor when appropriate

## Your Approach
1. **Conversation Practice**: Engage naturally while noting areas for improvement
2. **Grammar Correction**: When you spot errors, correct them kindly with explanations
3. **Vocabulary Building**: Introduce new words naturally in context
4. **Pronunciation Tips**: Offer phonetic guidance when relevant
5. **Scenario Practice**: Role-play real-world situations

## Tool Usage Guidelines
- Use `grammar_check` when the user writes something with noticeable errors or asks for grammar help
- Use `vocabulary_lookup` when the user asks about a word or you want to teach a new word
- Use `pronunciation_guide` when the user asks how to pronounce something
- Use `start_scenario` when the user wants to practice a specific situation
- Use `evaluate_response` during scenario practice to give structured feedback

## Response Format
- Keep responses concise but helpful
- Use formatting (bold, bullet points) for clarity
- When correcting, show the original vs corrected version
- Always end with encouragement or a follow-up question to keep the conversation going

## Important Rules
- NEVER be condescending about mistakes - they're learning opportunities
- If the user's English is great, challenge them with advanced vocabulary and complex topics
- Remember the conversation context and reference earlier topics
- If the user seems stuck, offer helpful prompts or simplify your language"""

    return f"""You are LinguaFlow, a warm, encouraging, and expert {lang_name} language tutor. Your mission is to help users improve their spoken {lang_name} through conversation practice, grammar correction, vocabulary building, and real-world scenario practice.

## Target Language: {lang_name}
You MUST conduct the conversation primarily in {lang_name}. When teaching, you should:
- Speak and respond in {lang_name}
- Provide explanations in both {lang_name} and English when needed for clarity
- Show the correct {lang_name} form alongside English translations
- Use {lang_name} script/characters naturally

## Your Personality
- Patient and encouraging - celebrate small wins
- Adapt to the user's level automatically
- Use simple explanations with relatable examples
- Be conversational, not lecturing
- Inject gentle humor when appropriate

## Your Approach
1. **Conversation Practice**: Engage in {lang_name}, noting areas for improvement
2. **Grammar Correction**: Correct {lang_name} grammar mistakes kindly with explanations
3. **Vocabulary Building**: Introduce new {lang_name} words in context with translations
4. **Pronunciation Tips**: Offer pronunciation guidance specific to {lang_name} sounds
5. **Scenario Practice**: Role-play real-world situations in {lang_name}

## Response Format
- Keep responses concise but helpful
- Use formatting (bold, bullet points) for clarity
- When correcting: show original → corrected version with English translation
- Always end with encouragement or a follow-up question in {lang_name}
- For beginners, include English translations in parentheses

## Important Rules
- NEVER be condescending about mistakes - they're learning opportunities
- Adapt difficulty to the user's level - start simple and gradually increase complexity
- Remember conversation context and reference earlier topics
- If the user is struggling, simplify and provide more English support
- Use culturally appropriate examples and phrases for {lang_name}
- Teach cultural context alongside language when relevant"""


class LanguageTutorAgent:
    """Custom agent with tool-calling capabilities for language tutoring."""

    def __init__(self, api_key: str, session_id: str, target_language: str = "en"):
        self.api_key = api_key
        self.session_id = session_id
        self.target_language = target_language
        self.lang_name = get_language_name(target_language)

        system_prompt = build_system_prompt(target_language)
        self.chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_prompt
        )
        self.chat.with_model("openai", "gpt-5.2")

    async def process_message(
        self,
        user_text: str,
        conversation_history: list,
        scenario_context: Optional[str] = None
    ) -> dict:
        """
        Process a user message through the agent.
        Returns dict with 'response', 'tools_used', and optional metadata.
        """
        context_messages = self._build_context(conversation_history, scenario_context)

        full_prompt = user_text
        if context_messages:
            full_prompt = f"[Conversation context: {context_messages}]\n\nUser's message: {user_text}"

        # Add language context
        if self.target_language != "en":
            full_prompt += f"\n[Target language: {self.lang_name} ({self.target_language})]"

        user_msg = UserMessage(text=full_prompt)

        try:
            response_text = await self.chat.send_message(user_msg)

            tools_used = []
            tool_results = self._detect_and_execute_tools(response_text, user_text)

            if tool_results:
                tools_used = [t["name"] for t in tool_results]
                tool_context = "\n".join([f"Tool '{t['name']}' result: {t['result']}" for t in tool_results])

                lang_note = ""
                if self.target_language != "en":
                    lang_note = f"\nRemember: respond primarily in {self.lang_name} with English translations where helpful."

                followup_msg = UserMessage(
                    text=f"Based on these tool results, provide your response to the user:\n{tool_context}\n\nOriginal user message: {user_text}{lang_note}"
                )
                response_text = await self.chat.send_message(followup_msg)

            return {
                "response": response_text,
                "tools_used": tools_used,
                "type": "scenario" if scenario_context else "chat"
            }

        except Exception as e:
            logger.error(f"Agent error: {e}")
            return {
                "response": "I'm having a moment - could you try saying that again? Sometimes even tutors need a second!",
                "tools_used": [],
                "type": "error"
            }

    def _build_context(self, history: list, scenario_context: Optional[str] = None) -> str:
        if not history and not scenario_context:
            return ""

        parts = []
        if scenario_context:
            parts.append(f"Active scenario: {scenario_context}")

        recent = history[-6:] if len(history) > 6 else history
        for msg in recent:
            role = msg.get("role", "user")
            text = msg.get("content", "")[:200]
            parts.append(f"{role}: {text}")

        return " | ".join(parts)

    def _detect_and_execute_tools(self, response: str, user_text: str) -> list:
        results = []
        text_lower = user_text.lower()

        # Grammar check triggers (multilingual)
        grammar_triggers = [
            "check my grammar", "is this correct", "correct my",
            "grammar check", "fix my sentence", "is this right",
            "did i say that correctly", "any mistakes",
            "correct this", "grammar", "corrige", "corriger",
            "ist das richtig", "esto correcto"
        ]
        if any(phrase in text_lower for phrase in grammar_triggers):
            result = execute_tool("grammar_check", {"user_text": user_text})
            results.append({"name": "grammar_check", "result": result})

        # Vocabulary triggers (multilingual)
        vocab_triggers = [
            "what does", "meaning of", "define ", "what is the word",
            "synonym", "antonym", "how do you use the word",
            "vocabulary", "what means", "translate",
            "que significa", "was bedeutet", "que veut dire",
            "what is", "how to say"
        ]
        if any(phrase in text_lower for phrase in vocab_triggers):
            words = user_text.split()
            target_word = words[-1] if len(words) > 2 else user_text
            for w in words:
                if w.lower() not in ["what", "does", "mean", "meaning", "of", "the", "is", "a", "define", "word", "translate", "how", "to", "say"]:
                    target_word = w
                    break
            result = execute_tool("vocabulary_lookup", {"word": target_word, "context": user_text})
            results.append({"name": "vocabulary_lookup", "result": result})

        # Pronunciation triggers (multilingual)
        pronunciation_triggers = [
            "how to pronounce", "pronunciation", "how do you say",
            "how is it pronounced", "phonetic",
            "como se pronuncia", "wie spricht man", "comment prononcer"
        ]
        if any(phrase in text_lower for phrase in pronunciation_triggers):
            words = user_text.split()
            target_word = words[-1]
            for w in reversed(words):
                if w.lower() not in ["how", "to", "pronounce", "pronunciation", "do", "you", "say", "is", "it", "pronounced", "the", "word"]:
                    target_word = w
                    break
            result = execute_tool("pronunciation_guide", {"word": target_word})
            results.append({"name": "pronunciation_guide", "result": result})

        # Scenario triggers (multilingual)
        scenario_triggers = [
            "practice", "role play", "scenario", "let's practice",
            "simulate", "pretend", "practicar", "uben", "pratiquer",
            "let's do a"
        ]
        if any(phrase in text_lower for phrase in scenario_triggers):
            scenario_type = "small_talk"
            if "interview" in text_lower or "job" in text_lower or "entrevista" in text_lower:
                scenario_type = "job_interview"
            elif "restaurant" in text_lower or "food" in text_lower or "order" in text_lower:
                scenario_type = "restaurant"
            elif "travel" in text_lower or "airport" in text_lower or "hotel" in text_lower or "viaje" in text_lower:
                scenario_type = "travel"
            elif "business" in text_lower or "meeting" in text_lower:
                scenario_type = "business_meeting"
            elif "phone" in text_lower or "call" in text_lower:
                scenario_type = "phone_call"
            elif "shop" in text_lower or "buy" in text_lower or "comprar" in text_lower:
                scenario_type = "shopping"
            elif "doctor" in text_lower or "health" in text_lower or "medico" in text_lower:
                scenario_type = "doctor_visit"

            result = execute_tool("start_scenario", {"scenario_type": scenario_type, "difficulty": "intermediate"})
            results.append({"name": "start_scenario", "result": result})

        return results
