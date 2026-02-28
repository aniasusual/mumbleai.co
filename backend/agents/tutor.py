"""
Main Tutor Agent — the primary agent that handles language tutoring.
Uses a tool-calling loop: LLM decides tools -> execute -> feed results -> repeat.
Streams the final text response token-by-token via on_event text_delta events.
"""

import json
import logging
from typing import Optional
from agents.llm import llm_call, llm_call_stream, consume_stream
from agents.tools import MAIN_AGENT_TOOLS
from agents.tool_executor import execute_tool, TOOL_LABELS
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
                              scenario_context: Optional[str] = None, on_event=None) -> dict:
        """
        The agent loop with streaming:
          conversation history (already includes user message) -> streaming LLM call
          -> if tools, execute & loop -> else stream text to client.
        on_event: async callback for real-time tool/text activity tracking.
        """
        messages = [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in conversation_history[-10:]
        ]

        # Add scenario context to the last user message if needed (don't duplicate it)
        if scenario_context and messages and messages[-1]["role"] == "user":
            messages[-1]["content"] = f"[Active scenario: {scenario_context}]\n{messages[-1]['content']}"

        tools_used = []
        tool_activity = []
        max_iterations = 6

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
                    final_text = content or "I'm here to help — could you try rephrasing that?"
                    logger.info(f"Agent completed in {iteration + 1} iteration(s), tools: {tools_used}")
                    return {
                        "response": final_text,
                        "tools_used": tools_used,
                        "tool_activity": tool_activity,
                        "type": "scenario" if scenario_context else "chat"
                    }

                for tc in tool_calls:
                    tool_name = tc["name"]
                    try:
                        arguments = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        arguments = {}

                    logger.info(f"[Agent] calling tool: {tool_name}({arguments})")
                    tools_used.append(tool_name)

                    tool_entry = {"tool": tool_name, "label": TOOL_LABELS.get(tool_name, tool_name), "status": "running", "substeps": []}
                    tool_activity.append(tool_entry)

                    if on_event:
                        await on_event({"type": "tool_start", "tool": tool_name, "label": tool_entry["label"]})

                    async def substep_callback(evt, _entry=tool_entry):
                        if on_event:
                            if evt.get("type") == "substep":
                                _entry["substeps"].append({"substep": evt["substep"], "label": evt["label"]})
                            await on_event(evt)

                    result = await execute_tool(self.api_key, tool_name, arguments, self.conversation_id, self.db, on_event=substep_callback)
                    messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result or "Tool completed."})

                    tool_entry["status"] = "done"
                    if on_event:
                        await on_event({"type": "tool_end", "tool": tool_name, "label": tool_entry["label"]})

            return {
                "response": content or "Let me help you with that — could you try again?",
                "tools_used": tools_used,
                "tool_activity": tool_activity,
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
            context = (
                f"This is the user's first message. Introduce yourself as mumble, their friendly {self.target_name} tutor. "
                f"Then ask ONE casual question: how confident or comfortable do they feel with {self.target_name}? "
                f"Give them simple options like: complete beginner, know some basics, can hold a conversation, or pretty comfortable. "
                f"Do NOT ask them to write or speak in {self.target_name} yet."
            )
        else:
            context = f"The user wants to practice {self.target_name}. Ask them ONE question: what they'd like to work on today."

        prompt = (
            f"You are starting a new conversation. Write your opening message.\n"
            f"IMPORTANT: Write the message in {self.native_name} (the user's native language). "
            f"Only use {self.target_name} for example phrases or practice material.\n"
            f"Keep it to 2-3 short sentences. End with exactly ONE question or prompt.\n"
            f"REMEMBER: End your response with [EXPECT_LANG:xx] tag as per your instructions.\n"
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
            return f"Hey! I'm mumble, your {self.target_name} tutor. How comfortable are you with {self.target_name} — complete beginner, know some basics, can hold a conversation, or pretty comfortable?"
        return "Hey! What would you like to work on today?"
