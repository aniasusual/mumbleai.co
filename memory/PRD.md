# LinguaFlow - AI Voice Language Tutor PRD

## Problem Statement
Voice conversation agent for language learning. 99 languages. Dual language system: native language for explanations, target language for practice. Custom agent with tool-calling + subagents. No SDK.

## Dual Language Model
- **Native Language** ("I speak"): User's fluent language. Used for explanations, grammar rules, corrections, tips.
- **Target Language** ("I want to learn"): Language being practiced. Used for exercises, conversation, role-play.
- Example: English speaker learning French → tutor explains in English, practice material in French with English translations.

## Agent Architecture (Custom)
```
Main Tutor Agent (GPT-5.2, agent loop, native+target aware)
  ├── grammar_check → Grammar Subagent (own loop + tools)
  ├── vocabulary_lookup → Vocabulary Subagent (own loop + tools)
  ├── pronunciation_guide → Pronunciation Subagent (own loop + tools)
  ├── evaluate_response → Evaluation Subagent (own loop + tools)
  └── start_scenario → Direct tool
```

## Tech Stack
- Backend: FastAPI + MongoDB + litellm (GPT-5.2 via Emergent proxy)
- STT: OpenAI Whisper (99 languages)
- TTS: OpenAI TTS (tts-1, nova)
- Frontend: React + Tailwind + Shadcn/UI + MediaRecorder API

## Implemented (Feb 2026)
- [x] Dual language system (native + target)
- [x] Proper agent loop with LLM-native tool calling
- [x] 4 subagents with own loops
- [x] 99 language support
- [x] Voice-in, voice-out conversation
- [x] 8 role-play scenarios
- [x] Progress dashboard, vocabulary notebook

## Backlog
- P1: Pronunciation scoring via Whisper mismatch
- P2: Spaced repetition vocabulary
- P2: Structured lesson plans per language
- P3: Daily challenges, gamification
