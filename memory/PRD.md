# mumble — Personal AI Language Tutor

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction (STT/TTS), support for 50+ languages, and a sophisticated agentic system with real-time UI updates via SSE.

## Core Requirements
- React frontend + FastAPI backend + MongoDB
- JWT-based email/password authentication
- Voice-first interaction (OpenAI Whisper STT, OpenAI TTS)
- 50+ language support with LLM-predicted language detection
- Agentic system with phase-based context isolation (learning/planning)
- Real-time UI updates via Server-Sent Events (SSE)
- Premium, modern, animated UI (Framer Motion, Tailwind, Shadcn/UI)
- Mobile-responsive internal pages

## Architecture
- **Backend**: FastAPI, MongoDB (motor), JWT auth
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Agent System**: Parent/subagent model with phase-based context isolation
  - `learning` phase: Tutor agent (cannot teach without curriculum)
  - `planning` phase: Planner agent (owns save_curriculum, revise_curriculum tools)
- **Voice Pipeline**: LLM predicts expected response language -> stored on conversation -> Whisper uses it -> GPT-5.2 -> TTS
- **Real-time**: SSE with tool events, streaming text, audio in `done` event
- **3rd Party**: OpenAI GPT-5.2, Whisper, TTS via Emergent LLM Key; DuckDuckGo Search (free, no key)

## DB Schema
- `users`: id, name, email, hashed_password
- `conversations`: id, user_id, title, phase, native_language, target_language, expected_response_language
- `messages`: id, conversation_id, role, content, phase, tools_used, tool_activity
- `curriculums`: user/conversation scoped lesson plans
- `vocabulary`: id, user_id, word, definition, example, context, created_at

## What's Been Implemented
- Full authentication flow (signup/login/JWT)
- Landing page with animated hero, morphing text, language characters
- Auth page with email/password
- Chat page with sidebar, message list, voice/text input
- Desktop sidebar: hover-to-expand, flush edges
- Mobile sidebar with overlay
- Welcome screen with language pickers, free conversation + scenarios
- Loading states on all new conversation buttons
- Agent system with tutor/planner isolation
- Multi-turn curriculum revision flow
- Onboarding: agent asks comfort level -> hands off to planner
- LLM-predicted Whisper language (EXPECT_LANG tag system)
- Voice-first agent (never says "type it")
- Auto pronunciation breakdowns in learner's native language
- Text/audio sync with karaoke-style highlighting
- TTS in SSE done event
- Dashboard page (mobile responsive)
- Vocabulary page (mobile responsive)
- Browser tab favicon
- Web Search tool (DuckDuckGo)
- **save_vocabulary tool**: Agent automatically saves new words to user's vocabulary notebook during lessons (2026-03-04)

## Agent Tools
### Tutor Agent (learning phase)
- grammar_check, vocabulary_lookup, pronunciation_guide, evaluate_response
- start_scenario, set_proficiency_level, advance_lesson, plan_curriculum
- **save_vocabulary**: Automatically saves new words taught during lessons to the user's vocabulary notebook. Includes duplicate detection.
- **web_search**: DuckDuckGo search for real-world info

### Planner Agent (planning phase)
- save_curriculum, revise_curriculum, web_search

## Backlog
- **P1**: Configurable error tolerance (strict/balanced/lenient corrections)
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: SpeechAce/Azure for phoneme-level pronunciation feedback
- **Future**: Google OAuth login
