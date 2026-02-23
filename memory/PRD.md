# LinguaFlow - AI Voice Language Tutor PRD

## Problem Statement
Build a voice conversation agent that helps users excel in spoken languages. 50+ languages. Users TALK with the agent. Custom agent with tools (no SDK). Full voice-in, voice-out flow.

## Architecture
- **Backend**: FastAPI + MongoDB + Custom Agent System (GPT-5.2)
- **STT**: OpenAI Whisper - supports 99 languages
- **TTS**: OpenAI TTS (tts-1, nova voice)
- **Frontend**: React + Tailwind CSS + Shadcn/UI + MediaRecorder API
- **Agent**: Custom tool-calling agent, language-adaptive system prompt
- **DB Collections**: conversations (with language field), messages, vocabulary, activity

## Voice Flow
1. User selects language → taps mic → records audio
2. Audio sent to /api/voice-message
3. Whisper transcribes in target language → Agent processes → TTS generates audio
4. Response with text + audio returned, auto-plays

## Implemented (Feb 2026)
- [x] 99 languages (all Whisper-supported)
- [x] Language picker with search in sidebar
- [x] Voice-in, voice-out conversation
- [x] Language-adaptive agent (responds in target language with translations)
- [x] Grammar, vocabulary, pronunciation, scenario tools
- [x] 8 role-play scenarios
- [x] Progress dashboard, vocabulary notebook
- [x] Text mode fallback

## Backlog
- P1: Pronunciation scoring via Whisper mismatch detection
- P2: Spaced repetition for vocabulary
- P2: Structured lesson plans per language
- P3: Gamification, streaks, leaderboards
