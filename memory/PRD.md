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

### Bug Fixes (March 10, 2026)
- **Audio-text sync fix (P0)**: Eliminated double render where AI response text appeared twice. Root cause: text_delta SSE events were rendering streaming text, then clearing it when audio arrived. Fix: always suppress text_delta, show TypingIndicator during processing, reveal message only when audio playing event fires. Karaoke timing moved from loadedmetadata to playing event. Added skipNextLoadRef to prevent loadMessages re-trigger.
- **New chat loading state**: Added centered loader ("Setting up your session...") when navigating to a new conversation before the welcome message loads. Previously showed a blank screen.
- **Sidebar new chat instant nav**: handleNewConversation now clears the current view immediately and navigates before the API call, so users see the loader instead of staring at the old chat.
- **Chat input UI redesign**: Merged input box, credit pill, and send button into one unified white rounded container.
- **Subscription downgrade flow fix (P0)**: The change-plan endpoint was only setting a DB flag but NOT cancelling the Razorpay subscription. This meant the old plan kept charging indefinitely. Fix: change-plan now cancels the Razorpay subscription at cycle end, subscription.cancelled webhook handles paid pending plans (sets `pending_activation` status), subscription.charged webhook guards against overriding downgrade status. Frontend shows banners for downgrading and pending_activation states on PricingPage.

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD (Voice Activity Detection), SpeechAce pronunciation scoring
