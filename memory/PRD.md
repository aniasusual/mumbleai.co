# mumble — Product Requirements Document

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch.

## Core Architecture
- **Backend**: FastAPI + MongoDB (motor) — modular service-oriented architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI + Framer Motion
- **Agent**: Custom parent/subagent model. `LanguageTutorAgent` + `CurriculumPlannerAgent` + 4 tool subagents
- **Real-time UI**: SSE streaming (tool events + text tokens)
- **Voice**: OpenAI Whisper (STT) + OpenAI TTS via emergentintegrations
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key

## Branding
- **Name**: mumble (lowercase)
- **Logo**: Waveform SVG forming letter M (5 bars at varying heights: WaveformLogo component)
- **Font**: Sora (headings) + DM Sans (body) + JetBrains Mono (code/phonetics)
- **Landing theme**: Dark (#060A06) with emerald-400/500 accents
- **App theme**: Light (#F0F4F8 sidebar, white cards, #2F5233 primary)

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
- [x] Dark Minimalistic Landing Page (Framer Motion)
- [x] **Waveform M Logo + mumble branding** — SVG waveform logo, Sora font, lowercase "mumble" across all pages — Implemented 2026-02-23

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken vs target
