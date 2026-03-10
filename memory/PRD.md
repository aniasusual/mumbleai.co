# Mumble — Personal AI Language Tutor

## Problem Statement
A full-stack language learning application where users interact with specialized AI agents (Tutor, Planner, Tester, Revisionist) via chat. Supports text and voice interactions with TTS, subscription model via Razorpay, powered by Emergent LLM Key.

## Architecture
- **Frontend**: React + Tailwind + Framer Motion + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **AI**: emergentintegrations (GPT-5.2 text, tts-1, whisper-1)
- **Payments**: Razorpay
- **Search**: ddgs (DuckDuckGo)

## What's Been Implemented

### Core Features
- Multi-agent chat system (Tutor, Planner, Tester, Revision)
- Voice input (STT) + Voice output (TTS) with karaoke word highlighting
- Conversation management (create, delete, list)
- JWT authentication (signup/login)
- Razorpay subscription plans (Free/Plus/Pro)
- Credit system (100/500/3000/7000 credits)
- Proficiency-aware agent prompts (Beginner/Intermediate/Expert)
- Web search tool for agents (ddgs)
- Agent trigger logic with user consent
- Landing page with animated AI Agents carousel

### Bug Fixes (Latest — March 10, 2026)
- **Audio-text sync fix (P0)**: Eliminated double render where AI response text appeared twice (once as streaming text, once as karaoke). Root cause: `text_delta` SSE events were rendering streaming text in text mode, then clearing it when audio arrived, causing a flash. Fix: always suppress `text_delta` from rendering, show TypingIndicator during processing, reveal message only when audio `playing` event fires. Also moved karaoke word timing from `loadedmetadata` to `playing` event for perfect sync. Added `skipNextLoadRef` to prevent `loadMessages` re-trigger after `refreshConversations`.

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD (Voice Activity Detection), SpeechAce pronunciation scoring
