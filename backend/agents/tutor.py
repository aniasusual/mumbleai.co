"""
Main Tutor Agent — the primary agent that handles language tutoring.
Uses a tool-calling loop: LLM decides tools -> execute -> feed results -> repeat.
"""

import json
import logging
from typing import Optional
from agents.llm import llm_call, serialize_tool_calls
from agents.tools import MAIN_AGENT_TOOLS
from agents.tool_executor import execute_tool
from agents.prompts import build_tutor_system_prompt, build_curriculum_context
from languages import get_language_name

logger = logging.getLogger(__name__)


class LanguageTutorAgent:

    def __init__(self, api_key: str, session_id: str, native_language: str = "en",
                 target_language: str = "en", proficiency_level: str = None,
                 conversation_id: str = None, db=None, phase: str = "learning",
                 curriculum: dict = None):
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

        self.system_prompt = build_tutor_system_prompt(native_language, target_language)
        if proficiency_level:
            self.system_prompt += f"\n\n## User's Proficiency: {proficiency_level.upper()}\nAdapt all content to {proficiency_level} level."
        if curriculum and curriculum.get("lessons"):
            self.system_prompt += build_curriculum_context(curriculum)
        self.tools = MAIN_AGENT_TOOLS

    async def process_message(self, user_text: str, conversation_history: list,
                              scenario_context: Optional[str] = None) -> dict:
        """
        The agent loop:
          user message -> LLM decides tool calls -> execute tools -> feed results -> repeat until done.
        """
        messages = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in conversation_history[-10:]
        ]

        user_content = f"[Active scenario: {scenario_context}]\n{user_text}" if scenario_context else user_text
        messages.append({"role": "user", "content": user_content})

        tools_used = []
        max_iterations = 6

        try:
            for iteration in range(max_iterations):
                response = await llm_call(
                    api_key=self.api_key, messages=messages,
                    system=self.system_prompt, tools=self.tools, max_tokens=2000
                )

                msg = response.choices[0].message
                finish_reason = response.choices[0].finish_reason

                assistant_msg = {"role": "assistant", "content": msg.content or ""}
                if msg.tool_calls:
                    assistant_msg["tool_calls"] = serialize_tool_calls(msg.tool_calls)
                messages.append(assistant_msg)

                if finish_reason != "tool_calls" or not msg.tool_calls:
                    final_text = msg.content or "I'm here to help — could you try rephrasing that?"
                    logger.info(f"Agent completed in {iteration + 1} iteration(s), tools: {tools_used}")
                    return {
                        "response": final_text,
                        "tools_used": tools_used,
                        "type": "scenario" if scenario_context else "chat"
                    }

                for tc in msg.tool_calls:
                    tool_name = tc.function.name
                    try:
                        arguments = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Agent] calling tool: {tool_name}({arguments})")
                    tools_used.append(tool_name)

                    result = await execute_tool(self.api_key, tool_name, arguments, self.conversation_id, self.db)
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": result or "Tool completed."})

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
                api_key=self.api_key, messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt, tools=None, max_tokens=300
            )
            return response.choices[0].message.content or self._fallback_welcome(scenario)
        except Exception as e:
            logger.error(f"Welcome generation failed: {e}")
            return self._fallback_welcome(scenario)

    def _fallback_welcome(self, scenario: str = None) -> str:
        if scenario:
            return f"Let's practice a {scenario.replace('_', ' ')} scenario! I'll start — just respond naturally."
        if self.native_language != self.target_language:
            return f"Hey! Let's figure out your {self.target_name} level. Try introducing yourself in {self.target_name}!"
        return "Hey! What would you like to work on today?"
