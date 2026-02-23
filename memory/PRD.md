# Mumble AI — Product Requirements Document

## Problem Statement
Build a conversational agent, "Mumble AI," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch (no high-level agent SDKs).

## Core Architecture
- **Backend**: FastAPI + MongoDB (motor) — modular service-oriented architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion — component-based structure
- **Agent**: Custom parent/subagent model. `LanguageTutorAgent` delegates to `CurriculumPlannerAgent` based on conversation phase. Four LLM-powered subagents available as tools.
- **Real-time UI**: Server-Sent Events (SSE) stream agent activity AND text response tokens
- **Voice**: OpenAI Whisper (STT) + OpenAI TTS via emergentintegrations
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key

## Completed Features
- [x] Voice-first interaction (STT + TTS)
- [x] 50+ language support with dual-language system
- [x] Tool-calling agent architecture (from scratch)
- [x] Grammar, Vocabulary, Pronunciation, Evaluation subagents
- [x] First Lesson onboarding / proficiency assessment
- [x] Curriculum Planning subagent (HITL)
- [x] Agent auto-initiates conversations in native language
- [x] Agent speaks welcome message automatically (TTS)
- [x] One task/question at a time rule
- [x] Human-like, empathetic agent personality
- [x] Chat deletion (individual + clear all)
- [x] Backend refactor (modular architecture)
- [x] Frontend refactor (component-based)
- [x] Live Tool & Subagent Activity UI (SSE streaming)
- [x] Streaming Text Response (text_delta SSE events)
- [x] Karaoke Word Highlight + Waveform during TTS playback
- [x] Markdown Rendering (react-markdown + remark-gfm)
- [x] App renamed: LinguaFlow -> Mumble AI
- [x] **Dark Minimalistic Landing Page** — Complete redesign with Framer Motion animations, bento grid features, karaoke demo card, curriculum preview, scroll-triggered reveals, emerald-on-dark theme. — Implemented 2026-02-23

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken vs target

## Key Endpoints
- `POST /api/conversations` — create conversation
- `POST /api/conversations/{id}/messages/stream` — SSE streaming
- `POST /api/conversations/{id}/voice-message` — voice input
- `GET /api/conversations/{id}/messages` — message history
- `POST /api/tts` — text-to-speech

## Landing Page Design
- Theme: Dark (#060A06) with emerald-400/500 accents
- Font: Playfair Display headings + DM Sans body
- Animations: Framer Motion (fadeUp, fadeIn, scaleIn) with useInView scroll triggers
- Sections: Hero (with karaoke demo), Features bento, Tools grid, How it works (4 steps), Scenarios, Curriculum preview, CTA, Footer
- All navigation functional: /chat, /dashboard, /vocabulary
