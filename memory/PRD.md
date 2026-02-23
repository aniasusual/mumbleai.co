# LinguaFlow - Product Requirements Document

## Problem Statement
Build a conversational agent that acts as a personal tutor to help users improve their spoken language skills. The application should be voice-first, support 50+ languages, use proper LLM tool-calling (no high-level SDKs), and feature a dual-language system where the agent teaches in the user's native language and makes them practice in their target language.

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI (port 3000)
- **Backend**: FastAPI + Motor (async MongoDB) (port 8001)
- **AI**: Custom agent framework using `litellm` → GPT-5.2 via Emergent proxy. Tool-calling loop with sub-agents for grammar, vocabulary, pronunciation, evaluation.
- **Voice**: OpenAI Whisper (STT) + OpenAI TTS via `emergentintegrations`
- **DB**: MongoDB (collections: conversations, messages, vocabulary, activity)

## Key Files
```
backend/
├── server.py              # FastAPI app setup, middleware (36 lines)
├── config.py              # DB connection, LLM key, logging
├── models.py              # Pydantic request/response models
├── scenarios.py           # Role-play scenario definitions
├── languages.py           # 99+ supported language codes
├── routes/
│   ├── conversations.py   # Conversation CRUD + send message
│   ├── voice.py           # Voice STT/TTS + voice messages
│   ├── vocabulary.py      # Vocabulary CRUD
│   ├── progress.py        # Progress/stats/streaks
│   └── resources.py       # Languages + scenarios list
├── agents/
│   ├── llm.py             # LLM call helper (litellm + Emergent proxy)
│   ├── tools.py           # Tool JSON schemas (main + planner)
│   ├── tool_executor.py   # Tool router → subagent or direct execution
│   ├── subagents.py       # Grammar, vocab, pronunciation, eval subagents
│   ├── prompts.py         # System prompt builders
│   ├── tutor.py           # LanguageTutorAgent class
│   └── planner.py         # CurriculumPlannerAgent class
└── services/
    └── agent_factory.py   # Creates correct agent based on phase (DRY)
```
- `/app/frontend/src/pages/ChatPage.js` - Main chat UI
- `/app/frontend/src/lib/api.js` - API helpers

## Completed Features
- [x] MVP: Full-stack app (React/FastAPI/MongoDB)
- [x] Custom agent architecture with tool-calling loop (no SDK)
- [x] Voice conversations (Whisper STT + TTS)
- [x] Dual-language system (native "I speak" + target "I want to learn")
- [x] "First Lesson" proficiency assessment onboarding
- [x] 99+ language support
- [x] Scenario-based practice (restaurant, interview, etc.)
- [x] Grammar check, vocabulary lookup, pronunciation guide tools
- [x] Dashboard with progress stats and streaks
- [x] Vocabulary saving feature
- [x] Individual chat deletion (always-visible delete icon)
- [x] "Clear All Chats" feature with confirmation dialog
- [x] Human-like AI personality (casual, non-robotic prompts)
- [x] Agent always initiates conversation (all cases: same-lang, cross-lang, scenarios)
- [x] Welcome message auto-speaks via TTS on new conversation
- [x] One-question-at-a-time agent behavior
- [x] Curriculum Planning Subagent (HITL): auto-triggers after proficiency assessment, asks about goals/timeline/preferences, creates personalized learning plan
- [x] Curriculum-driven learning: agent follows the saved curriculum, lesson progress shown in header
- [x] Advance lesson tool: agent can progress through curriculum lessons

## API Endpoints
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List conversations
- `DELETE /api/conversations/all` - Delete all conversations
- `DELETE /api/conversations/{id}` - Delete single conversation
- `POST /api/conversations/{id}/messages` - Send text message
- `POST /api/conversations/{id}/voice-message` - Send voice message
- `PATCH /api/conversations/{id}/proficiency` - Set proficiency level
- `POST /api/tts` - Text-to-speech
- `GET /api/languages` - List supported languages
- `GET /api/scenarios` - List practice scenarios
- `GET /api/progress` - User progress stats
- `POST /api/vocabulary` - Save vocabulary word
- `GET /api/vocabulary` - List vocabulary
- `DELETE /api/vocabulary/{id}` - Delete vocabulary

## DB Collections
- **conversations**: id, title, scenario, native_language, target_language, proficiency_level, phase (assessment|planning|learning), created_at, updated_at, message_count
- **messages**: id, conversation_id, role, content, tools_used, created_at
- **curricula**: id, conversation_id, proficiency_level, timeline, goal, lessons[], current_lesson, status (active|completed), created_at
- **vocabulary**: id, word, definition, example, context, created_at
- **activity**: id, text_length, tools_used, scenario, created_at

## Agent Architecture
```
Main Tutor Agent (phase: assessment / learning)
  ├── tool: grammar_check      → Grammar Subagent (own loop + tools)
  ├── tool: vocabulary_lookup   → Vocabulary Subagent (own loop + tools)
  ├── tool: pronunciation_guide → Pronunciation Subagent (own loop + tools)
  ├── tool: evaluate_response   → Evaluation Subagent (own loop + tools)
  ├── tool: plan_curriculum     → hands off to Curriculum Planner Agent
  │                               (sets phase="planning", planner takes over)
  ├── tool: advance_lesson      → progresses through curriculum
  ├── tool: set_proficiency_level → saves level, triggers plan_curriculum
  └── tool: start_scenario      → returns scenario setup

Curriculum Planner Agent (phase: planning, separate class + loop)
  └── tool: save_curriculum → saves plan to DB, sets phase="learning"
                              (control returns to Main Tutor Agent)
```

## Agent Phases
1. **Assessment** (cross-lang only): Agent asks 2-3 progressively harder questions to determine proficiency level
2. **Planning** (auto-triggered): Curriculum planner asks about goals, timeline, preferences — HITL collaborative plan creation
3. **Learning**: Agent follows the saved curriculum, advancing through lessons

## Backlog
- P1: Progress Journal (auto-generated weekly learning summaries)
- P2: Gamification (streaks, points, leaderboards)
- P2: Real-time pronunciation feedback
- P3: Refactor ChatPage.js (700+ lines) into smaller components
