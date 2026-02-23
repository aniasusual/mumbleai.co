# LinguaFlow — Product Requirements Document

## Problem Statement
Build a conversational agent, "LinguaFlow," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch (no high-level agent SDKs).

## Core Architecture
- **Backend**: FastAPI + MongoDB (motor) — modular service-oriented architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI — component-based structure
- **Agent**: Custom parent/subagent model. `LanguageTutorAgent` delegates to `CurriculumPlannerAgent` based on conversation phase. Four LLM-powered subagents (Grammar, Vocabulary, Pronunciation, Evaluation) available as tools.
- **Real-time UI**: Server-Sent Events (SSE) stream agent activity AND text response tokens from backend to frontend
- **Voice**: OpenAI Whisper (STT) + OpenAI TTS via emergentintegrations
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key

## Completed Features
- [x] Voice-first interaction (STT + TTS)
- [x] 50+ language support with dual-language system
- [x] Tool-calling agent architecture (from scratch)
- [x] Grammar, Vocabulary, Pronunciation, Evaluation subagents
- [x] First Lesson onboarding / proficiency assessment
- [x] Curriculum Planning subagent (HITL) — separate CurriculumPlannerAgent
- [x] Agent auto-initiates conversations in native language
- [x] Agent speaks welcome message automatically (TTS)
- [x] One task/question at a time rule
- [x] Human-like, empathetic agent personality
- [x] Chat deletion (individual + clear all)
- [x] Backend refactor (modular: agents/, routes/, services/, models.py, config.py)
- [x] Frontend refactor (ChatPage orchestrator + 7 child components + custom hook)
- [x] Live Tool & Subagent Activity UI (SSE streaming, real-time spinners, collapsible summary)
- [x] Streaming Text Response — Agent text appears token-by-token via SSE text_delta events
- [x] Karaoke Word Highlight + Waveform — Word-by-word highlighting during TTS playback
- [x] **Markdown Rendering** — AI messages render markdown (bold, lists, code, headings, blockquotes, tables) via react-markdown + remark-gfm. User messages stay plain text. StreamingBubble also renders markdown live. Karaoke mode falls back to plain text. — Implemented 2026-02-23

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken transcription with target phrase

## Key Endpoints
- `POST /api/conversations` — create conversation (agent auto-sends welcome)
- `POST /api/conversations/{id}/messages/stream` — SSE streaming: tool events + text_delta tokens + done
- `POST /api/conversations/{id}/voice-message` — voice input
- `GET /api/conversations/{id}/messages` — message history (includes tool_activity)
- `POST /api/tts` — text-to-speech (returns audio_base64)

## SSE Event Types
- `thinking` — agent is making an LLM call
- `tool_start` / `substep` / `tool_end` — tool execution lifecycle
- `text_delta` — token chunk of the agent's text response
- `done` — final event with user_message + ai_message payloads

## Key Frontend Components
- `MarkdownContent` — Shared react-markdown renderer with custom styled components (bold in green, lists, code blocks, blockquotes, tables)
- `KaraokeText` — Word-by-word highlight during TTS playback
- `AudioWaveform` — Animated 5-bar waveform during playback
- `StreamingBubble` — Renders streaming markdown with blinking cursor
- `ToolActivityLive` / `ToolActivitySummary` — Real-time and post-hoc tool usage display

## DB Collections
- `conversations`: id, title, scenario, native_language, target_language, proficiency_level, phase, message_count
- `messages`: id, conversation_id, role, content, tools_used, tool_activity, created_at
- `vocabularies`: id, word, definition, example, context
- `curricula`: id, conversation_id, proficiency_level, timeline, goal, lessons, current_lesson, status
