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
- **Voice Pipeline**: LLM predicts expected response language → stored on conversation → Whisper uses it for next voice input → GPT-5.2 → TTS
- **Real-time**: SSE with tool events, streaming text, audio in `done` event
- **3rd Party**: OpenAI GPT-5.2, Whisper, TTS via Emergent LLM Key

## DB Schema
- `users`: id, name, email, hashed_password
- `conversations`: id, user_id, title, phase, native_language, target_language, **expected_response_language**
- `messages`: id, conversation_id, role, content, phase, tools_used
- `curriculums`: user/conversation scoped lesson plans
- `vocabulary`: user-saved words

## What's Been Implemented
- Full authentication flow (signup/login/JWT)
- Landing page with animated hero, morphing text, language characters
- Auth page with email/password + Google OAuth placeholder
- Chat page with sidebar, message list, voice/text input
- Desktop sidebar: hover-to-expand, flush edges
- Mobile sidebar with overlay
- Welcome screen with language pickers, free conversation + scenarios
- Loading states on all new conversation buttons (prevents double-clicks)
- Agent system with tutor/planner isolation
- Multi-turn curriculum revision flow
- Onboarding: agent asks comfort level → hands off to planner
- **LLM-predicted Whisper language**: Agent tags responses with [EXPECT_LANG:xx], voice route uses it for single Whisper call. Fallback to native language.
- **Voice-first agent**: Never says "type it", always "say it" / "try saying"
- **Auto pronunciation breakdowns**: Every new word includes phonetic breakdown in learner's native language
- Text/audio sync with karaoke-style highlighting (including welcome message)
- TTS in SSE done event (no round-trip)
- Dashboard page (mobile responsive)
- Vocabulary page (mobile responsive)
- Browser tab favicon (mumble waveform logo)

## Agent Tools
### Tutor Agent (learning phase)
- grammar_check, vocabulary_lookup, pronunciation_guide, evaluate_response
- start_scenario, set_proficiency_level, advance_lesson, plan_curriculum

### Planner Agent (planning phase)
- save_curriculum, revise_curriculum

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: SpeechAce/Azure for phoneme-level pronunciation feedback
- **Future**: Google OAuth login
