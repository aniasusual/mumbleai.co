"""
Tool JSON schemas for the main tutor agent.
These define what tools the LLM can call.
"""

MAIN_AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "grammar_check",
            "description": "Analyze the user's text for grammar errors and provide detailed corrections with explanations. Use this when the user's message has grammar issues or they ask for grammar help.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "The text to check for grammar errors"},
                    "target_language": {"type": "string", "description": "The language the text is written in"}
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
                    "word": {"type": "string", "description": "The word or phrase to look up"},
                    "target_language": {"type": "string", "description": "The language of the word"},
                    "context": {"type": "string", "description": "Sentence or context where the word was used"}
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
                    "word": {"type": "string", "description": "The word to provide pronunciation guidance for"},
                    "target_language": {"type": "string", "description": "The language of the word"}
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
                    "user_text": {"type": "string", "description": "The user's text to evaluate"},
                    "conversation_context": {"type": "string", "description": "The context of what the user was responding to"},
                    "target_language": {"type": "string", "description": "The language being practiced"}
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
            "description": "Set the user's proficiency level based on their self-reported confidence/comfort with the language. Call this immediately after the user tells you how comfortable they are. Then follow up by calling plan_curriculum.",
            "parameters": {
                "type": "object",
                "properties": {
                    "level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "The proficiency level mapped from the user's self-reported comfort"
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Brief note on what the user said about their comfort level"
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
                    "summary": {"type": "string", "description": "Brief summary of what the user learned/practiced in the current lesson"}
                },
                "required": ["summary"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "plan_curriculum",
            "description": "Hand off to the Curriculum Planner subagent. Call this to create a NEW learning plan (after setting proficiency) OR when the user wants to CHANGE, UPDATE, or REVISE their existing plan. The planner will take over the conversation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "proficiency_level": {"type": "string", "description": "The user's proficiency level"},
                    "context": {"type": "string", "description": "Context for the planner: why the handoff is happening (e.g. 'initial planning' or 'user wants to add a shopping lesson')"}
                },
                "required": ["proficiency_level", "context"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_vocabulary",
            "description": "Save a NEW word or phrase to the user's vocabulary notebook. ONLY call this for words you are introducing for the FIRST TIME in this conversation. Do NOT re-save words already taught in earlier messages — check conversation history first. Also call when the user explicitly asks to save/remember a word.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {"type": "string", "description": "The word or phrase in the target language"},
                    "definition": {"type": "string", "description": "Translation or definition in the user's native language"},
                    "example": {"type": "string", "description": "An example sentence using the word in the target language"},
                    "context": {"type": "string", "description": "Brief context about when/where the word was learned (e.g., 'lesson 3 - greetings')"}
                },
                "required": ["word", "definition"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for real-world information. Use this when you need external knowledge to help the user — e.g., interview formats, exam structures (JLPT, DELF, HSK), cultural context, popular media for listening practice, travel tips, current slang, specific vocabulary for a profession or topic, real-world conversation examples, or anything you're not fully sure about.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query. Be specific and include the target language name if relevant."}
                },
                "required": ["query"]
            }
        }
    }
]


PLANNER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information to build a better curriculum. Use this when the user mentions specific exams (JLPT, DELF, HSK), interviews, professional needs, or any topic you need more info about to create an accurate study plan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query. Be specific."}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_curriculum",
            "description": "Save a NEW curriculum/learning plan after the user has agreed to it. Call this ONLY after the user confirms they're happy with the plan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timeline": {"type": "string", "description": "The learning timeline, e.g. '4 weeks, 1 hour/day'"},
                    "goal": {"type": "string", "description": "The user's learning goal, e.g. 'Travel to Japan'"},
                    "lessons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "lesson_number": {"type": "integer"},
                                "title": {"type": "string"},
                                "topics": {"type": "array", "items": {"type": "string"}},
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
    },
    {
        "type": "function",
        "function": {
            "name": "revise_curriculum",
            "description": "Revise and save an UPDATED version of the existing curriculum. Use this when the user wants to modify, add, remove, or reorganize lessons in their current plan. Provide the FULL updated lesson list (not just the changes).",
            "parameters": {
                "type": "object",
                "properties": {
                    "timeline": {"type": "string", "description": "The (possibly updated) timeline"},
                    "goal": {"type": "string", "description": "The (possibly updated) learning goal"},
                    "lessons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "lesson_number": {"type": "integer"},
                                "title": {"type": "string"},
                                "topics": {"type": "array", "items": {"type": "string"}},
                                "objective": {"type": "string"}
                            },
                            "required": ["lesson_number", "title", "topics", "objective"]
                        },
                        "description": "The FULL updated list of lessons"
                    }
                },
                "required": ["timeline", "goal", "lessons"]
            }
        }
    }
]
