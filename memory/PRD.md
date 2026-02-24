# mumble — Product Requirements Document

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch.

## Branding
- **Name**: mumble (lowercase)
- **Logo**: SVG waveform forming letter M (WaveformLogo component)
- **Font**: Sora (headings) + DM Sans (body)
- **Landing theme**: Light (#f8f7f4 hero) with bold colorful sections (green, blue, violet, orange). Mesh gradients, floating chars, morphing hellos.
- **Auth theme**: Split-screen — left panel indigo gradient with floating chars + morphing word, right panel light form
- **App theme (Internal)**: Dark Neon-Noir (#0f172a bg) with indigo (#6366f1) primary, glassmorphism surfaces, Framer Motion animations

## Completed Features
- [x] Voice-first interaction (STT + TTS)
- [x] 50+ language support with dual-language system
- [x] Tool-calling agent architecture (from scratch)
- [x] Grammar, Vocabulary, Pronunciation, Evaluation subagents
- [x] First Lesson onboarding / proficiency assessment
- [x] Curriculum Planning subagent (HITL)
- [x] Agent auto-initiates in native language + auto-speaks welcome
- [x] One task/question at a time rule + human-like personality
- [x] Chat deletion (individual + clear all)
- [x] Modular backend & frontend architecture
- [x] Live Tool & Subagent Activity UI (SSE streaming)
- [x] Streaming Text Response (text_delta SSE events)
- [x] Karaoke Word Highlight + Waveform during TTS playback
- [x] Markdown Rendering (react-markdown + remark-gfm)
- [x] Waveform M Logo + mumble branding (Sora font)
- [x] **Landing Page v7 — Bold Colors + Creative Animations** — Saturated section colors. Animated mesh gradient. MorphingHello. SoundWave. FloatingChars. Dark indigo footer.
- [x] **Auth Page — Creative Split-Screen** — Indigo gradient left panel with floating script chars, morphing word, sound wave. Right panel with animated form inputs, shine-sweep submit button.
- [x] **JWT Authentication** — Full email/password auth with signup/login/logout. Backend: PyJWT + bcrypt, user-scoped data. Frontend: React context (useAuth), ProtectedRoute, AuthPage.
- [x] **Bug Fix: Duplicate Chat Creation** — Fixed race condition in `ensureConversation`.
- [x] **Internal App UI Redesign — Dark Neon-Noir Theme** — Complete redesign of all internal app pages (Chat, Dashboard, Vocabulary) and components (Sidebar, ChatHeader, ChatInput, ChatBubble, MessageList, ToolActivity, LanguagePicker) from light theme to dark Neon-Noir. Features: #0f172a dark background, indigo (#6366f1) gradient primary, glassmorphism surfaces (blur+transparency), Framer Motion entrance animations, animated focus rings, glow effects on buttons. User bubbles = indigo gradient, AI bubbles = glass surface. Mobile responsive sidebar overlay. All 25 UI tests passed. — Completed 2026-02-24

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken vs target
- **Future**: Google OAuth integration (placeholder exists on Auth page)

## Design System
- **Background**: #0f172a (slate 900)
- **Sidebar**: gradient #0c1222 -> #0f172a
- **Primary**: #6366f1 (indigo) with gradient #4338ca -> #6366f1
- **Surfaces**: rgba(255,255,255,0.05) with border rgba(255,255,255,0.08)
- **Glass**: backdrop-blur-md, semi-transparent backgrounds
- **Text**: white (headings), slate-200 (body), slate-400 (muted), slate-500 (caption)
- **Accents**: indigo-300/400 for highlights, emerald-400 for success, red-400 for destructive
- **Animations**: Framer Motion for all entrance, hover, and transition effects

## Architecture
- Backend: FastAPI + MongoDB (motor) + PyJWT
- Frontend: React + TailwindCSS + Shadcn/UI + Framer Motion
- Auth: JWT tokens, user-scoped data
- Real-time: SSE for tool activity + text streaming
- Voice: OpenAI Whisper (STT) + OpenAI TTS (via Emergent LLM Key)
- AI: OpenAI GPT-5.2 (via Emergent LLM Key)
