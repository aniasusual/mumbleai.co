# LinguaFlow - AI Voice Language Tutor PRD

## Problem Statement
Voice conversation agent for language learning. 99 languages. Proper agent architecture with LLM-native tool calling + subagents. No SDK. Voice-in, voice-out.

## Agent Architecture (Custom — No SDK)
```
Main Tutor Agent (GPT-5.2, agent loop with tool calling)
  ├── grammar_check → Grammar Subagent (own loop + tools: identify_errors, suggest_correction)
  ├── vocabulary_lookup → Vocabulary Subagent (own loop + tools: define_word, find_examples)
  ├── pronunciation_guide → Pronunciation Subagent (own loop + tools: phonetic_breakdown)
  ├── evaluate_response → Evaluation Subagent (own loop + tools: score_response)
  └── start_scenario → Direct tool (returns scenario setup)
```

Agent loop: user msg → LLM → tool_calls → execute (spawns subagent loops) → feed results → LLM → repeat until done

## Tech Stack
- Backend: FastAPI + MongoDB + litellm (GPT-5.2 via Emergent proxy)
- STT: OpenAI Whisper (99 languages)
- TTS: OpenAI TTS (tts-1, nova)
- Frontend: React + Tailwind + Shadcn/UI + MediaRecorder API

## Implemented (Feb 2026)
- [x] Proper agent loop with LLM-native tool calling
- [x] 4 subagents (grammar, vocabulary, pronunciation, evaluation)
- [x] 99 language support with searchable picker
- [x] Voice-in, voice-out conversation
- [x] 8 role-play scenarios
- [x] Progress dashboard, vocabulary notebook
- [x] Language-adaptive system prompts

## Backlog
- P1: Pronunciation scoring via Whisper mismatch detection
- P2: Spaced repetition for vocabulary
- P2: Structured lesson plans per language level
- P3: Gamification, daily challenges, streaks
