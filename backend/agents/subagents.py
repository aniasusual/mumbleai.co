"""
Subagents — each is a specialized agent with its own tools and loop.
The main tutor agent delegates to these for specific tasks.
Each subagent accepts an optional on_event callback for real-time activity tracking.
"""

import json
import logging
from agents.llm import llm_call, serialize_tool_calls

logger = logging.getLogger(__name__)

# Maps subagent tool names to human-readable labels
SUBSTEP_LABELS = {
    "identify_errors": "Scanning for errors",
    "suggest_correction": "Writing correction",
    "define_word": "Looking up definition",
    "find_examples": "Generating examples",
    "phonetic_breakdown": "Analyzing pronunciation",
    "score_response": "Scoring your response",
    "compare_phrases": "Comparing pronunciation",
    "break_down_words": "Breaking down words phonetically",
}


async def _emit(on_event, event):
    if on_event:
        await on_event(event)


async def run_grammar_subagent(api_key: str, text: str, target_language: str = "English", on_event=None) -> str:
    """Grammar checker subagent with its own tools and loop."""
    tools = [
        {
            "type": "function",
            "function": {
                "name": "identify_errors",
                "description": "Identify all grammar errors in the text systematically",
                "parameters": {
                    "type": "object",
                    "properties": {"text": {"type": "string"}, "language": {"type": "string"}},
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
Be thorough but concise. Format your response clearly with original -> corrected pairs."""

    messages = [{"role": "user", "content": f'Check this {target_language} text for grammar: "{text}"'}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or "No grammar issues found."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            await _emit(on_event, {"type": "substep", "parent": "grammar_check", "substep": tc.function.name, "label": SUBSTEP_LABELS.get(tc.function.name, tc.function.name)})

            if tc.function.name == "identify_errors":
                result = f"Analyzing '{args.get('text', text)}' in {args.get('language', target_language)}: proceed with error identification."
            elif tc.function.name == "suggest_correction":
                result = f"Correction noted: '{args.get('original','')}' -> '{args.get('corrected','')}' (Rule: {args.get('rule','')})"
            else:
                result = "Done."
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", "Grammar check completed.")


async def run_vocabulary_subagent(api_key: str, word: str, target_language: str = "English", context: str = "", on_event=None) -> str:
    """Vocabulary lookup subagent with its own loop."""
    tools = [
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
    messages = [{"role": "user", "content": f'Explain the {target_language} word/phrase: "{word}"{ctx}'}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or f"Definition of '{word}' not found."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            await _emit(on_event, {"type": "substep", "parent": "vocabulary_lookup", "substep": tc.function.name, "label": SUBSTEP_LABELS.get(tc.function.name, tc.function.name)})

            if tc.function.name == "define_word":
                result = f"Definition structured: {args.get('definitions', '')} [{args.get('part_of_speech', '')}] ({args.get('register', 'neutral')})"
            elif tc.function.name == "find_examples":
                result = f"Examples compiled: {args.get('examples', '')}"
            else:
                result = "Done."
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", f"Vocabulary lookup for '{word}' completed.")


async def run_pronunciation_subagent(api_key: str, word: str, target_language: str = "English", on_event=None) -> str:
    """Pronunciation guide subagent."""
    tools = [
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

    messages = [{"role": "user", "content": f'How do I pronounce "{word}" in {target_language}?'}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or f"Pronunciation guide for '{word}'."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            await _emit(on_event, {"type": "substep", "parent": "pronunciation_guide", "substep": tc.function.name, "label": SUBSTEP_LABELS.get(tc.function.name, tc.function.name)})
            result = f"Phonetics: IPA={args.get('ipa','')}, Syllables={args.get('syllables','')}, Mistakes={args.get('common_mistakes','')}"
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", f"Pronunciation guide for '{word}' completed.")


async def run_evaluation_subagent(api_key: str, user_text: str, context: str = "", target_language: str = "English", on_event=None) -> str:
    """Evaluates user's response for fluency, grammar, vocabulary, naturalness."""
    tools = [
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
    messages = [{"role": "user", "content": f'Evaluate this {target_language} response: "{user_text}"{ctx}'}]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or "Evaluation completed."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            await _emit(on_event, {"type": "substep", "parent": "evaluate_response", "substep": tc.function.name, "label": SUBSTEP_LABELS.get(tc.function.name, tc.function.name)})
            result = (
                f"Scores - Grammar: {args.get('grammar_score', 0)}/10, "
                f"Vocabulary: {args.get('vocabulary_score', 0)}/10, "
                f"Fluency: {args.get('fluency_score', 0)}/10, "
                f"Naturalness: {args.get('naturalness_score', 0)}/10. "
                f"Feedback: {args.get('overall_feedback', '')}"
            )
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", "Evaluation completed.")


async def run_pronunciation_feedback_subagent(
    api_key: str,
    expected_phrase: str,
    spoken_phrase: str,
    target_language: str = "English",
    native_language: str = "English",
    on_event=None
) -> str:
    """Compares user's spoken attempt against an expected phrase and provides pronunciation feedback with phonetic breakdowns in the user's native language."""
    tools = [
        {
            "type": "function",
            "function": {
                "name": "compare_phrases",
                "description": "Compare expected vs spoken phrase word-by-word. Identify which words matched, which were mispronounced, and estimate an overall accuracy score.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "accuracy_score": {"type": "integer", "description": "Overall pronunciation accuracy 0-100"},
                        "word_results": {"type": "string", "description": "Word-by-word comparison: each word marked as correct/incorrect with what the user said vs expected"},
                        "summary": {"type": "string", "description": "Brief summary of how the user did"}
                    },
                    "required": ["accuracy_score", "word_results", "summary"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "break_down_words",
                "description": "For mispronounced words, break them into smaller phonetic chunks written in the user's native language so they can learn the correct pronunciation.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "breakdowns": {
                            "type": "string",
                            "description": "For each mispronounced word: the word, its phonetic breakdown in native language script, syllable-by-syllable guide, and a tip"
                        }
                    },
                    "required": ["breakdowns"]
                }
            }
        }
    ]

    system = f"""You are a pronunciation analysis specialist. You compare what a learner said against what they were supposed to say in {target_language}.

Your job:
1. Use `compare_phrases` to do a word-by-word comparison of the expected vs spoken phrase. Be smart about matching — minor spelling variations from transcription (e.g. "bonjour" vs "bonjor") indicate pronunciation issues. Give an accuracy score 0-100.
2. Use `break_down_words` for any mispronounced words. Break each problematic word into smaller phonetic chunks written in {native_language} script so the user can read and speak them. For example:
   - French "Bonjour" for an English speaker → "bon-ZHOOR" (the 'zh' sounds like the 's' in 'measure')
   - French "Bonjour" for a Hindi speaker → "बॉन-ज़ूर"
   - Japanese "Arigatou" for an English speaker → "ah-ree-GAH-toh"

Be encouraging but honest. Focus on the most impactful corrections. Always provide the native language phonetic breakdown."""

    messages = [
        {"role": "user", "content": (
            f"Expected phrase ({target_language}): \"{expected_phrase}\"\n"
            f"What the user said: \"{spoken_phrase}\"\n"
            f"User's native language: {native_language}\n\n"
            f"Compare these and provide pronunciation feedback with phonetic breakdowns in {native_language}."
        )}
    ]

    for _ in range(5):
        response = await llm_call(api_key, messages, system=system, tools=tools)
        msg = response.choices[0].message
        messages.append({"role": "assistant", "content": msg.content, "tool_calls": serialize_tool_calls(msg.tool_calls)})

        if response.choices[0].finish_reason != "tool_calls" or not msg.tool_calls:
            return msg.content or "Pronunciation analysis completed."

        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            await _emit(on_event, {"type": "substep", "parent": "check_pronunciation", "substep": tc.function.name, "label": SUBSTEP_LABELS.get(tc.function.name, tc.function.name)})

            if tc.function.name == "compare_phrases":
                result = (
                    f"Accuracy: {args.get('accuracy_score', 0)}%. "
                    f"Word results: {args.get('word_results', '')}. "
                    f"Summary: {args.get('summary', '')}"
                )
            elif tc.function.name == "break_down_words":
                result = f"Phonetic breakdowns: {args.get('breakdowns', '')}"
            else:
                result = "Done."
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

    return messages[-1].get("content", "Pronunciation analysis completed.")
