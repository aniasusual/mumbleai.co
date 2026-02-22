"""
Custom agent tools for the LinguaFlow language tutor.
Each tool is a plain Python function with a schema for GPT function calling.
No SDK - built from scratch.
"""

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "grammar_check",
            "description": "Analyze the user's text for grammar errors and provide corrections with explanations. Use this when the user writes a sentence or paragraph and you want to help them improve their grammar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_text": {
                        "type": "string",
                        "description": "The user's text to check for grammar"
                    }
                },
                "required": ["user_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "vocabulary_lookup",
            "description": "Look up a word or phrase and provide its definition, synonyms, antonyms, example sentences, and usage tips. Use this when the user asks about a word's meaning or wants to expand vocabulary.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word or phrase to look up"
                    },
                    "context": {
                        "type": "string",
                        "description": "Optional context in which the word was used"
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
            "description": "Provide pronunciation guidance for a word including phonetic transcription, syllable breakdown, stress patterns, and common mistakes. Use this when the user asks how to pronounce a word.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {
                        "type": "string",
                        "description": "The word to provide pronunciation for"
                    }
                },
                "required": ["word"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "start_scenario",
            "description": "Start a role-play conversation scenario to practice spoken English in real-world situations. Use this when the user wants to practice a specific scenario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_type": {
                        "type": "string",
                        "enum": ["job_interview", "restaurant", "travel", "small_talk", "business_meeting", "phone_call", "shopping", "doctor_visit"],
                        "description": "The type of scenario to start"
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Difficulty level of the scenario"
                    }
                },
                "required": ["scenario_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "evaluate_response",
            "description": "Evaluate the user's response in a conversation for fluency, grammar, vocabulary usage, and naturalness. Provide a score and feedback. Use this after the user responds in a practice scenario.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_response": {
                        "type": "string",
                        "description": "The user's response to evaluate"
                    },
                    "context": {
                        "type": "string",
                        "description": "The conversation context for evaluation"
                    }
                },
                "required": ["user_response", "context"]
            }
        }
    }
]

SCENARIOS = {
    "job_interview": {
        "title": "Job Interview",
        "description": "Practice answering common interview questions professionally",
        "icon": "Briefcase",
        "starter_prompts": [
            "Tell me about yourself",
            "Why should we hire you?",
            "What are your strengths and weaknesses?"
        ]
    },
    "restaurant": {
        "title": "At a Restaurant",
        "description": "Practice ordering food, making reservations, and dining conversations",
        "icon": "UtensilsCrossed",
        "starter_prompts": [
            "I'd like to make a reservation",
            "What do you recommend?",
            "Could I see the menu, please?"
        ]
    },
    "travel": {
        "title": "Travel & Directions",
        "description": "Practice asking for directions, booking hotels, and navigating airports",
        "icon": "Plane",
        "starter_prompts": [
            "How do I get to the train station?",
            "I'd like to check in, please",
            "Is there a bus stop nearby?"
        ]
    },
    "small_talk": {
        "title": "Small Talk",
        "description": "Master the art of casual conversation and making friends",
        "icon": "MessageCircle",
        "starter_prompts": [
            "Nice weather today, isn't it?",
            "What do you do for a living?",
            "Have you seen any good movies lately?"
        ]
    },
    "business_meeting": {
        "title": "Business Meeting",
        "description": "Practice professional meeting etiquette and discussion",
        "icon": "Users",
        "starter_prompts": [
            "Let's go over the agenda",
            "I'd like to propose a new strategy",
            "What are your thoughts on this?"
        ]
    },
    "phone_call": {
        "title": "Phone Call",
        "description": "Practice phone conversations, leaving messages, and call etiquette",
        "icon": "Phone",
        "starter_prompts": [
            "Hello, may I speak with...?",
            "I'm calling to inquire about...",
            "Could you please hold?"
        ]
    },
    "shopping": {
        "title": "Shopping",
        "description": "Practice buying things, asking about prices, and returns",
        "icon": "ShoppingBag",
        "starter_prompts": [
            "Do you have this in a different size?",
            "How much does this cost?",
            "I'd like to return this item"
        ]
    },
    "doctor_visit": {
        "title": "Doctor Visit",
        "description": "Practice describing symptoms and understanding medical advice",
        "icon": "Stethoscope",
        "starter_prompts": [
            "I've been feeling unwell",
            "I have an appointment with Dr...",
            "What are the side effects?"
        ]
    }
}


def execute_tool(tool_name: str, arguments: dict) -> str:
    """Execute a tool and return the result as a string for the agent."""
    if tool_name == "grammar_check":
        return _grammar_check(arguments.get("user_text", ""))
    elif tool_name == "vocabulary_lookup":
        return _vocabulary_lookup(arguments.get("word", ""), arguments.get("context", ""))
    elif tool_name == "pronunciation_guide":
        return _pronunciation_guide(arguments.get("word", ""))
    elif tool_name == "start_scenario":
        return _start_scenario(arguments.get("scenario_type", "small_talk"), arguments.get("difficulty", "intermediate"))
    elif tool_name == "evaluate_response":
        return _evaluate_response(arguments.get("user_response", ""), arguments.get("context", ""))
    return "Unknown tool"


def _grammar_check(user_text: str) -> str:
    return f"""[GRAMMAR CHECK TOOL ACTIVATED]
Analyzing text: "{user_text}"
Please provide detailed grammar feedback including:
- Identified errors with corrections
- Explanation of grammar rules
- Corrected version of the text
- Tips for avoiding similar mistakes"""


def _vocabulary_lookup(word: str, context: str = "") -> str:
    ctx = f' in context: "{context}"' if context else ""
    return f"""[VOCABULARY TOOL ACTIVATED]
Word/Phrase: "{word}"{ctx}
Please provide:
- Clear definition(s)
- Part of speech
- 3 example sentences showing different usages
- Synonyms and antonyms
- Common collocations
- Register (formal/informal/neutral)"""


def _pronunciation_guide(word: str) -> str:
    return f"""[PRONUNCIATION GUIDE TOOL ACTIVATED]
Word: "{word}"
Please provide:
- IPA phonetic transcription
- Syllable breakdown with stress markers
- Rhymes with (common words)
- Common pronunciation mistakes to avoid
- Tips for mouth/tongue position"""


def _start_scenario(scenario_type: str, difficulty: str = "intermediate") -> str:
    scenario = SCENARIOS.get(scenario_type, SCENARIOS["small_talk"])
    return f"""[SCENARIO TOOL ACTIVATED]
Starting scenario: {scenario['title']}
Difficulty: {difficulty}
Description: {scenario['description']}

Instructions for the AI tutor:
- Begin the role-play as the other person in this scenario
- Adjust language complexity to {difficulty} level
- After each user response, provide brief feedback on their language use
- Encourage natural conversation flow
- Gently correct major errors without breaking the flow"""


def _evaluate_response(user_response: str, context: str = "") -> str:
    return f"""[EVALUATION TOOL ACTIVATED]
User's response: "{user_response}"
Context: "{context}"
Please evaluate on these criteria (score 1-10 each):
- Grammar accuracy
- Vocabulary richness
- Naturalness/fluency
- Appropriateness for context
Provide overall score and specific improvement suggestions."""
