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
- `/app/backend/agent.py` - Core agent logic, tool definitions, sub-agents, system prompts
- `/app/backend/server.py` - FastAPI endpoints, DB logic
- `/app/backend/tools.py` - Agent tool implementations
- `/app/backend/languages.py` - 99+ supported languages
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

## Backlog
- P1: Progress Journal (auto-generated weekly learning summaries)
- P2: Gamification (streaks, points, leaderboards)
- P2: Real-time pronunciation feedback
- P3: Refactor ChatPage.js (700+ lines) into smaller components
