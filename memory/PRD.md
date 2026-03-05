# mumble — Personal AI Language Tutor

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction (STT/TTS), support for 50+ languages, and a sophisticated agentic system with real-time UI updates via SSE.

## Core Requirements
- React frontend + FastAPI backend + MongoDB
- JWT-based email/password authentication
- Voice-first interaction (OpenAI Whisper STT, OpenAI TTS)
- 50+ language support with LLM-predicted language detection
- Agentic system with phase-based context isolation (learning/planning/testing/revision)
- Real-time UI updates via Server-Sent Events (SSE)
- Premium, modern, animated UI (Framer Motion, Tailwind, Shadcn/UI)
- Mobile-responsive internal pages
- Credit-based payment system (upcoming)

## Architecture
- **Backend**: FastAPI, MongoDB (motor), JWT auth
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Agent System**: Parent/subagent model with phase-based context isolation
  - `learning` phase: Tutor agent
  - `planning` phase: Planner agent
  - `testing` phase: Testing agent
  - `revision` phase: Revision agent
- **Voice Pipeline**: LLM predicts expected response language -> stored on conversation -> Whisper uses it (with user override via language toggle) -> GPT-5.2 -> TTS
- **Real-time**: SSE with tool events, streaming text, audio in `done` event
- **3rd Party**: OpenAI GPT-5.2, Whisper, TTS via Emergent LLM Key; DuckDuckGo Search

## DB Schema
- `users`: id, name, email, hashed_password
- `conversations`: id, user_id, title, phase, native_language, target_language, expected_response_language
- `messages`: id, conversation_id, role, content, phase, tools_used, tool_activity
- `curriculums`: user/conversation scoped lesson plans
- `vocabulary`: id, user_id, word, definition, example, context, created_at
- `test_results`: user_id, score, strengths, weaknesses

## What's Been Implemented
- Full authentication flow (signup/login/JWT)
- Landing page, Auth page, Chat page, Dashboard, Vocabulary page
- Agent system with tutor/planner/testing/revision isolation
- LLM-predicted Whisper language (EXPECT_LANG tag system)
- Voice-first agent, auto pronunciation breakdowns
- Text/audio sync with karaoke-style highlighting
- Web Search tool (DuckDuckGo)
- save_vocabulary tool: Agent automatically saves new words during lessons
- Voice/Keyboard SSE parity: Both have identical streaming event flow
- Testing Agent: Phase-based handoff quiz system
- Revision Agent: Phase-based handoff review system
- **Voice Language Toggle** (2026-03-05): Pill-shaped EN|FR toggle next to mic button that lets users manually switch which language Whisper listens for. Auto-switches based on LLM's EXPECT_LANG prediction, with manual user override. Info tooltip explains the feature. Hidden when native == target language.

## Agent Tools
### Tutor Agent (learning phase)
- grammar_check, vocabulary_lookup, pronunciation_guide, evaluate_response
- start_scenario, set_proficiency_level, advance_lesson, plan_curriculum
- save_vocabulary, web_search, start_test, start_revision

### Testing Agent (testing phase)
- finish_test: saves score/strengths/weaknesses/review words to DB
- web_search

### Revision Agent (revision phase)
- finish_revision: saves topics reviewed/improved/still weak
- web_search

### Planner Agent (planning phase)
- save_curriculum, revise_curriculum, web_search

## Backlog
- **P0**: Credit-based payment system with Stripe integration
  - Credit formula discussed: LLM input 1cr/1K tokens, output 3cr/1K tokens, STT 0.3cr/sec, TTS 1cr/500chars
  - Plans: Free (50cr), Basic $5 (500cr), Pro $15 (2000cr), Unlimited $30
  - ~70-80% gross margin
  - Awaiting user approval on final formula/pricing
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD (always-on mic)
- **Future**: SpeechAce/Azure for phoneme-level pronunciation feedback
- **Future**: Google OAuth login
