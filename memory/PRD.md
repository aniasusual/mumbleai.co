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

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD, SpeechAce pronunciation
