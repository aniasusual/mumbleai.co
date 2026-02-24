# mumble — Product Requirements Document

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch.

## Branding
- **Name**: mumble (lowercase)
- **Logo**: SVG waveform forming letter M (WaveformLogo component)
- **Font**: Sora (headings) + DM Sans (body)
- **Theme**: Light, warm, colorful — matching the landing page (#f8f7f4 base with bold section colors)

## Design System
- **Base background**: #f8f7f4 (warm white)
- **Sidebar**: Indigo gradient (#eef2ff -> #e0e7ff -> #c7d2fe)
- **Primary**: Indigo (#6366f1) with gradient #4338ca -> #6366f1
- **Glass**: rgba(248,247,244,0.88) + backdrop-blur(16px)
- **Chat bubbles**: User = indigo gradient, AI = white with #e5e7eb border
- **Dashboard colors**: Green #d1fae5, Blue #bfdbfe, Pink #fecdd3, Violet #e9d5ff, Amber #fed7aa
- **Decorative**: Mesh gradient blobs, floating script characters (あñ한ç你θê)
- **Animations**: Framer Motion throughout (scroll reveals, hover effects, entrance animations)

## Completed Features
- [x] Voice-first interaction (STT + TTS)
- [x] 50+ language support with dual-language system
- [x] Tool-calling agent architecture (from scratch)
- [x] Grammar, Vocabulary, Pronunciation, Evaluation subagents
- [x] First Lesson onboarding / proficiency assessment
- [x] Curriculum Planning subagent (HITL)
- [x] Agent auto-initiates in native language + auto-speaks welcome
- [x] Chat deletion (individual + clear all)
- [x] Modular backend & frontend architecture
- [x] Live Tool & Subagent Activity UI (SSE streaming)
- [x] Streaming Text Response (text_delta SSE events)
- [x] Karaoke Word Highlight + Waveform during TTS playback
- [x] Markdown Rendering (react-markdown + remark-gfm)
- [x] Waveform M Logo + mumble branding (Sora font)
- [x] Landing Page v7 — Bold Colors + Creative Animations
- [x] Auth Page — Creative Split-Screen with animations
- [x] JWT Authentication — email/password + user-scoped data
- [x] Bug Fix: Duplicate Chat Creation (race condition)
- [x] **Internal App UI Redesign — Light Colorful Theme** — Complete redesign of all internal pages and components to match landing page aesthetic. Warm #f8f7f4 bg, indigo gradient sidebar, mesh blobs + floating chars, colorful dashboard sections (green/blue/violet/amber), white chat bubbles with indigo user bubbles. 33/33 tests passed. — 2026-02-24
- [x] **Welcome Screen** — When user lands on /chat with no active conversation, shows personalized greeting ("Hey {name}!"), animated sound wave, "Start a Free Conversation" CTA, and scenario pills. Clicking any option creates a conversation and navigates to chat view. 16/16 tests passed. — 2026-02-24
- [x] **Collapsible Sidebar** — Desktop defaults to collapsed icon rail (~56px) with logo, expand toggle, new chat dropdown, conversation icons with tooltips, dashboard/vocabulary/logout icons. Expands to full sidebar with language pickers, conversation titles, and all nav links via toggle button. Mobile keeps overlay pattern with slide-in animation. 19/19 tests passed. — 2026-02-24

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken vs target
- **Future**: Google OAuth integration (placeholder on Auth page)

## Architecture
- Backend: FastAPI + MongoDB (motor) + PyJWT
- Frontend: React + TailwindCSS + Shadcn/UI + Framer Motion
- Auth: JWT tokens, user-scoped data
- Real-time: SSE for tool activity + text streaming
- Voice: OpenAI Whisper (STT) + OpenAI TTS (via Emergent LLM Key)
- AI: OpenAI GPT-5.2 (via Emergent LLM Key)
