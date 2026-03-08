# mumble — Personal AI Language Tutor

## Problem Statement
Build a conversational agent "mumble" that acts as a personal language tutor with voice-first interaction, multi-agent architecture, and subscription-based monetization.

## Core Requirements
- React frontend + FastAPI backend + MongoDB
- Voice-first (STT/TTS) + text interaction, 50+ languages
- 4 AI agents: Tutor, Planner, Tester, Revision Coach
- Real-time UI via Server-Sent Events (SSE)
- JWT auth + Google OAuth
- Razorpay subscription-based billing with credit system

## Tech Stack
- **Backend**: FastAPI, MongoDB (motor), LiteLLM (GPT-5.2), OpenAI Whisper/TTS
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Payments**: Razorpay Subscriptions API (INR)
- **Auth**: JWT + Google OAuth (@react-oauth/google)
- **Web Search**: ddgs (DuckDuckGo search)

## Plans
| Plan | Price | Credits/mo | Max Conversations |
|------|-------|-----------|-------------------|
| Free | Rs 0 | 100 | 3 |
| Plus | Rs 1,199/mo | 1,000 | 10 |
| Pro | Rs 2,499/mo | 5,000 | Unlimited |

## What's Implemented
- Full 4-agent system with isolated context windows and handoffs
- Voice + text conversation with real-time SSE streaming
- Razorpay subscription billing (monthly, credits roll over, cancel at cycle end)
- Credit deduction for LLM tokens, STT duration, TTS characters
- Conversation limits + credit gating on all endpoints
- Credit History page with transaction breakdowns
- Google OAuth alongside email/password auth
- Admin credit top-up endpoint
- Landing page with agent showcase, pricing, scenarios, demo
- Webhook for recurring charges and cancellation
- Live Razorpay plans created (Plus: plan_SOcRQ3oCCMEKF2, Pro: plan_SOcRR1Vw5s36hF)
- **Proficiency-aware teaching system** (Feb 2026): Detailed level-specific instructions for all 4 agents (Tutor, Planner, Testing, Revision) covering language mix, word introductions, pronunciation, scaffolding, grammar, encouragement. Error correction remains user-decided (strict/balanced/relaxed).
- **Aggressive web search triggers** (Feb 2026): Planner MUST search before proposing curriculum when user mentions exams, professions, travel, or specific domains. Tutor also searches when asked about exams, cultural norms, or when user explicitly requests. Fixed ddgs package (duckduckgo_search → ddgs).

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD, SpeechAce pronunciation
