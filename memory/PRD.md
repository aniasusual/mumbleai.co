# mumble — Personal Language Tutor

## Original Problem Statement
Build a conversational agent called "mumble" that acts as a personal language tutor with voice-first interaction, supporting 50+ languages, featuring a sophisticated agentic system with real-time UI updates via SSE.

## Core Requirements
- Voice-first interaction (STT/TTS via OpenAI Whisper & TTS)
- 50+ language support
- Agentic system with parent/subagent model (LanguageTutor, CurriculumPlanner, Grammar, Vocab, etc.)
- Real-time UI updates via SSE (tool activity, streaming text)
- JWT-based email/password authentication
- All user data scoped to logged-in user
- Premium, modern, highly animated UI (light/vibrant/colorful theme)

## Tech Stack
- **Backend**: FastAPI, MongoDB (motor), Python
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion
- **Auth**: JWT (passlib)
- **LLM**: OpenAI GPT-5.2 via Emergent LLM Key
- **Voice**: OpenAI Whisper (STT) + OpenAI TTS
- **Real-time**: Server-Sent Events (SSE)

## Architecture
```
/app/
├── backend/
│   ├── agents/          # All agent logic
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── auth.py          # JWT auth
│   ├── config.py        # Configuration
│   ├── models.py        # Pydantic models
│   └── server.py        # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/    # Chat UI components
│   │   │   ├── ui/      # Shadcn components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── WaveformLogo.jsx
│   │   ├── hooks/       # useAuth, useVoiceRecorder
│   │   ├── lib/         # api.js, audio.js
│   │   └── pages/       # All pages
```

## Key API Endpoints
- POST /api/auth/signup, /api/auth/login, GET /api/auth/me
- GET /api/conversations, POST /api/conversations/{id}/messages (SSE)
- GET /api/vocabulary, POST /api/vocabulary, DELETE /api/vocabulary/{id}
- GET /api/progress

## What's Been Implemented
- Full agentic backend with all subagents and tools
- Complete voice pipeline (STT -> Agent -> TTS)
- JWT authentication with user-scoped data
- Landing page, Auth page, Chat page, Dashboard page, Vocabulary page
- Collapsible sidebar with animations and mesh gradient
- Welcome screen with quick-start scenarios
- Karaoke-style word highlighting during TTS playback
- Light/vibrant/colorful design system throughout
- Mobile responsive Dashboard and Vocabulary pages
- Fast mobile sidebar close animation
- Opaque dropdown backgrounds (no transparency issues)

## Completed (Latest Session — Feb 2026)
- Fixed Dashboard page mobile responsiveness (1->2->4 column grid)
- Fixed Vocabulary page mobile responsiveness (full-width search, icon-only nav buttons)
- Fixed mobile sidebar closing delay (spring -> tween 0.2s)
- Fixed dropdown transparency issue (solid #ffffff backgrounds)
- Fixed hero text layout (Say / Hello / in every language on separate lines, auto-sizing)
- Changed onboarding flow: agent asks comfort level instead of testing user
- **Fixed agent handoff bugs:**
  - Removed duplicate user messages in tutor + planner agent loops
  - `plan_curriculum` now runs planner as inline subagent (welcome generated immediately, no extra user input)
  - Planner maintains full context across multi-turn HITL conversation
  - `save_curriculum` transitions cleanly back to tutor with lesson 1

### P1
- Progress Journal: Auto-generate weekly learning summaries

### P2
- Gamification (streaks, points, leaderboards)
- Real-time Pronunciation Feedback

### Future
- Google OAuth login
