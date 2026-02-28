# mumble — Personal AI Language Tutor

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction (STT/TTS), support for 50+ languages, and a sophisticated agentic system with real-time UI updates via SSE.

## Core Requirements
- React frontend + FastAPI backend + MongoDB
- JWT-based email/password authentication
- Voice-first interaction (OpenAI Whisper STT, OpenAI TTS)
- 50+ language support with auto-detection
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
- **Voice Pipeline**: Whisper (dual-pass: auto-detect + target lang hint) → GPT-5.2 → TTS
- **Real-time**: SSE with tool events, streaming text, audio in `done` event
- **3rd Party**: OpenAI GPT-5.2, Whisper, TTS via Emergent LLM Key

## DB Schema
- `users`: id, name, email, hashed_password
- `conversations`: id, user_id, title, phase, native_language, target_language
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
- Voice pipeline with auto-language detection
- Text/audio sync with karaoke-style highlighting (including welcome message)
- TTS in SSE done event (no round-trip)
- Dashboard page (mobile responsive)
- Vocabulary page (mobile responsive)
- Browser tab favicon (mumble waveform logo)
- **Pronunciation Feedback Tool**: Dual Whisper transcription (literal + charitable) to detect pronunciation issues. Agent contextually uses check_pronunciation tool with phonetic breakdowns in user's native language.

## Agent Tools
### Tutor Agent (learning phase)
- grammar_check, vocabulary_lookup, pronunciation_guide, evaluate_response
- start_scenario, set_proficiency_level, advance_lesson, plan_curriculum
- **check_pronunciation**: Dual-pass Whisper comparison (literal vs charitable transcription) + GPT analysis. Provides accuracy score + phonetic breakdowns in native language script.

### Planner Agent (planning phase)
- save_curriculum, revise_curriculum

## Pronunciation Feedback Architecture
1. Agent asks user to say a phrase
2. User speaks → audio sent to backend
3. **Pass 1**: Whisper auto-detect (literal — what it sounds like)
4. **Pass 2**: Whisper with target language hint (charitable — what they meant)
5. Differences → [PRONUNCIATION CONTEXT] tag appended to agent history (not DB)
6. Agent uses check_pronunciation tool with all three texts
7. Subagent compares, breaks down mispronounced words in native language
8. Known limitation: mild mispronunciations auto-corrected by Whisper

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: SpeechAce/Azure for phoneme-level pronunciation precision
- **Future**: Google OAuth login
