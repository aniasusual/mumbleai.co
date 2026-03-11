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

### Bug Fixes (March 10-11, 2026)
- **Audio-text sync fix (P0)**: Eliminated double render where AI response text appeared twice. Root cause: text_delta SSE events were rendering streaming text, then clearing it when audio arrived. Fix: always suppress text_delta, show TypingIndicator during processing, reveal message only when audio playing event fires. Karaoke timing moved from loadedmetadata to playing event. Added skipNextLoadRef to prevent loadMessages re-trigger.
- **New chat loading state**: Added centered loader ("Setting up your session...") when navigating to a new conversation before the welcome message loads.
- **Sidebar new chat instant nav**: handleNewConversation now clears current view immediately and navigates before API call.
- **Chat input UI redesign**: Merged input box, credit pill, and send button into one unified container.
- **Subscription downgrade flow fix (P0)**: change-plan now cancels Razorpay subscription at cycle end, webhooks handle pending_activation status.
- **PWA safe area support**: Added viewport-fit=cover, env(safe-area-inset-*) padding to ChatHeader, ChatInput, WelcomeScreen, MobileSidebar, and AuthPage. Added manifest.json with standalone display. Fixes hamburger button being untappable under status bar in mobile PWA.

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD (Voice Activity Detection), SpeechAce pronunciation scoring
