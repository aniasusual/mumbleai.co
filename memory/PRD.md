# mumble — Personal AI Language Tutor

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction (STT/TTS), support for 50+ languages, and a sophisticated agentic system with real-time UI updates via SSE. Monetize with a credit-based payment system via Razorpay.

## Core Requirements
- React frontend + FastAPI backend + MongoDB
- JWT-based email/password authentication
- Voice-first interaction (OpenAI Whisper STT, OpenAI TTS)
- 50+ language support with LLM-predicted language detection
- Agentic system with phase-based context isolation (learning/planning/testing/revision)
- Real-time UI updates via Server-Sent Events (SSE)
- Premium, modern, animated UI (Framer Motion, Tailwind, Shadcn/UI)
- Credit-based payment system with Razorpay

## Architecture
- **Backend**: FastAPI, MongoDB (motor), JWT auth, Razorpay
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Agent System**: Parent/subagent model with phase-based context isolation
- **Voice Pipeline**: Language toggle → Whisper STT → GPT-5.2 → TTS
- **Real-time**: SSE with tool events, streaming text, audio
- **3rd Party**: OpenAI GPT-5.2, Whisper, TTS via Emergent LLM Key; DuckDuckGo; Razorpay

## DB Schema
- `users`: id, name, email, hashed_password
- `conversations`: id, user_id, title, phase, native_language, target_language, expected_response_language
- `messages`: id, conversation_id, role, content, phase, tools_used, tool_activity
- `curriculums`: user/conversation scoped lesson plans
- `vocabulary`: id, user_id, word, definition, example, context, created_at
- `test_results`: user_id, score, strengths, weaknesses
- `subscriptions`: user_id, plan, credits, max_conversations, razorpay_payment_id
- `credit_transactions`: user_id, type (purchase/usage), plan, credits_added, razorpay_payment_id

## Payment Plans
| Plan | Price | Credits | Conversations | Features |
|------|-------|---------|---------------|----------|
| Free | $0/mo | 50 | 3 | All features |
| Plus | $14.99/mo | 1,000 | 10 | All features |
| Pro | $29.99/mo | 5,000 | Unlimited | All features + priority |

## Credit Deduction Formula
- LLM Input: 1 credit / 1K tokens
- LLM Output: 3 credits / 1K tokens
- STT (Whisper): 0.3 credits / second
- TTS: 1 credit / 500 characters

## What's Been Implemented
- Full authentication flow (signup/login/JWT)
- Landing page with pricing section, Auth page, Chat page, Dashboard, Vocabulary page
- Agent system with tutor/planner/testing/revision isolation
- Learning context handoff to testing/revision agents
- Voice language toggle (STT language switching)
- Voice/Keyboard SSE parity
- Web Search tool (DuckDuckGo)
- Vocabulary saving
- **Razorpay Backend Integration**: /api/payments/plans, /subscription, /create-order, /verify-payment, /credit-history
- **Landing Page Pricing Section**: 3-tier pricing cards matching app design system
- **In-App Pricing Page** (`/pricing`): Full checkout page with Razorpay modal, current plan badge, credits display
- **Credit History Page** (`/credit-history`): Paginated transaction log with filter pills (All/Usage/Purchases), expandable rows showing LLM/STT/TTS breakdown, balance after, and credit rates info
- **Auth Redirect Flow**: Landing page plan buttons → Auth (with redirect params) → Pricing page (auto-opens Razorpay)
- **Sidebar Pricing & Credit History Links**: In expanded, collapsed, and mobile sidebar states
- **Credit Deduction System**: Tracks and deducts credits for LLM tokens (with stream_options include_usage), STT duration, TTS characters with transaction logging
- **Conversation Limit Enforcement**: Free (3), Plus (10), Pro (unlimited) — enforced on conversation creation with clear toast message
- **Credit Gating on All Endpoints**: Non-streaming messages, SSE streaming, and voice messages all check credits and return 402 when depleted
- **Plan Credits**: Free=20, Plus=1000, Pro=5000

## Backlog
- **P1**: Progress Journal — weekly learning summaries
- **P2**: Gamification — streaks, points, leaderboards
- **Future**: VAD (always-on mic), SpeechAce pronunciation, Google OAuth
