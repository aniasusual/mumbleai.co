# LinguaFlow - AI-Powered Voice English Tutor PRD

## Problem Statement
Build a voice conversation agent that helps users excel in spoken English. Users TALK with the agent (not type). Custom agent with tools (no SDK). Full voice-in, voice-out flow.

## Architecture
- **Backend**: FastAPI + MongoDB + Custom Agent System (GPT-5.2 via emergentintegrations)
- **STT**: OpenAI Whisper (via emergentintegrations) - converts user speech to text
- **TTS**: OpenAI TTS (tts-1, nova voice) - converts AI responses to speech
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Web MediaRecorder API
- **Agent**: Custom tool-calling agent with 5 tools (grammar_check, vocabulary_lookup, pronunciation_guide, start_scenario, evaluate_response)
- **DB Collections**: conversations, messages, vocabulary, activity

## Voice Conversation Flow
1. User taps mic → browser records audio (WebM)
2. Audio sent to /api/voice-message
3. Whisper transcribes → Agent processes → TTS generates audio
4. Response returned with text + audio base64
5. Frontend auto-plays AI voice response

## User Personas
- Language learners (beginner to advanced) improving spoken English
- Professionals preparing for interviews/meetings
- Travelers needing practical conversation skills

## Core Requirements
- [x] Voice-in, voice-out conversation (Whisper STT + OpenAI TTS)
- [x] AI tutor chat with real-time feedback
- [x] Grammar correction with explanations
- [x] Vocabulary building with definitions/synonyms
- [x] Pronunciation guidance (phonetic)
- [x] 8 role-play scenarios
- [x] Progress tracking dashboard
- [x] Vocabulary notebook (CRUD)
- [x] Text mode fallback
- [x] Play audio button on any AI message

## What's Been Implemented (Feb 2026)
- Full custom agent system with 5 tools
- Voice recording + Whisper STT transcription
- OpenAI TTS (tts-1, nova voice) for AI responses
- Voice-first chat UI with voice/text toggle
- Audio visualizer during recording
- Auto-play AI audio responses
- 8 conversation scenarios
- Dashboard with bento grid stats
- Vocabulary notebook with search
- Landing page with Sage & Sand design

## Prioritized Backlog
- P1: Multi-language support (Spanish, French, etc.)
- P1: Pronunciation scoring using Whisper mismatch detection
- P2: Spaced repetition for vocabulary review
- P2: Lesson plans and structured curriculum
- P3: Leaderboards and gamification
- P3: Export vocabulary to flashcard apps
