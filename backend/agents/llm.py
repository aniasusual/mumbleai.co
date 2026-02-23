"""LLM call helper and utility functions shared across all agents."""

import json
import litellm

PROXY_URL = "https://integrations.emergentagent.com/llm"
MODEL = "gpt-5.2"


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
