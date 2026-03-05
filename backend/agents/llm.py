"""LLM call helper and utility functions shared across all agents."""

import json
import litellm

PROXY_URL = "https://integrations.emergentagent.com/llm"
MODEL = "gpt-5.2"


async def llm_call(api_key: str, messages: list, system: str = None, tools: list = None, max_tokens: int = 1500):
    """Make a single (non-streaming) LLM call. Returns the raw response."""
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

    response = await litellm.acompletion(**params)
    return response


async def llm_call_stream(api_key: str, messages: list, system: str = None, tools: list = None, max_tokens: int = 1500):
    """Make a streaming LLM call. Returns an async iterator of chunks."""
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
        "stream": True,
    }
    if tools:
        params["tools"] = tools

    return await litellm.acompletion(**params)


async def consume_stream(stream, on_event=None):
    """Consume a streaming LLM response.
    Emits text_delta events for content chunks via on_event.
    Returns (content: str, tool_calls: list[dict], finish_reason: str, usage: dict).
    Each tool_call dict: {"id": str, "name": str, "arguments": str}
    usage dict: {"prompt_tokens": int, "completion_tokens": int}
    """
    content = ""
    tool_calls_acc = {}
    finish_reason = None
    usage = {"prompt_tokens": 0, "completion_tokens": 0}

    async for chunk in stream:
        choice = chunk.choices[0]
        if choice.finish_reason:
            finish_reason = choice.finish_reason

        # Extract usage from the final chunk if available
        if hasattr(chunk, "usage") and chunk.usage:
            if hasattr(chunk.usage, "prompt_tokens") and chunk.usage.prompt_tokens:
                usage["prompt_tokens"] = chunk.usage.prompt_tokens
            if hasattr(chunk.usage, "completion_tokens") and chunk.usage.completion_tokens:
                usage["completion_tokens"] = chunk.usage.completion_tokens

        delta = choice.delta

        chunk_text = getattr(delta, "content", None)
        if chunk_text:
            content += chunk_text
            if on_event:
                await on_event({"type": "text_delta", "content": chunk_text})

        tc_deltas = getattr(delta, "tool_calls", None)
        if tc_deltas:
            for tc_delta in tc_deltas:
                idx = tc_delta.index
                if idx not in tool_calls_acc:
                    tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                if tc_delta.id:
                    tool_calls_acc[idx]["id"] = tc_delta.id
                if tc_delta.function:
                    if tc_delta.function.name:
                        tool_calls_acc[idx]["name"] += tc_delta.function.name
                    if tc_delta.function.arguments:
                        tool_calls_acc[idx]["arguments"] += tc_delta.function.arguments

    tool_calls = [tool_calls_acc[k] for k in sorted(tool_calls_acc.keys())] if tool_calls_acc else []
    return content, tool_calls, finish_reason, usage


def serialize_tool_calls(tool_calls):
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
