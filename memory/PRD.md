# mumble — Product Requirements Document

## Problem Statement
Build a conversational agent, "mumble," that acts as a personal language tutor with voice-first interaction, 50+ language support, and a proper LLM tool-calling architecture built from scratch.

## Branding
- **Name**: mumble (lowercase)
- **Logo**: SVG waveform forming letter M (WaveformLogo component)
- **Font**: Sora (headings) + DM Sans (body)
- **Landing theme**: Warm dark (#0a0a0a) with gold (#c8a97e) accent — "quiet luxury" aesthetic
- **App theme**: Light (#F0F4F8 sidebar, white cards, #2F5233 primary)

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
- [x] **Advanced Dark Landing Page v2** — Word-by-word text reveals, language orbit (18 languages), 3D tilt tool icons, animated chat demo, parallax scenario scroll, scroll progress bar, alternating feature rows with gradient accent lines, hero parallax with scale/fade. — Implemented 2026-02-23
- [x] **Landing Page v3 — Warm Gold Redesign** — Replaced rainbow/violet theme with refined warm-gold (#c8a97e) on near-black (#0a0a0a). Minimal navbar (no gradient button), unified monochrome orbit, simplified feature icons, clean CTA. Smooth animations retained. — Tested & verified 2026-02-23
- [x] **Landing Page v4 — Neon-Noir Bioluminescent** — Complete rebuild with section-by-section color transitions (slate->emerald->blue->violet->stone->slate). Floating glass pill navbar, bento grid features with glassmorphism + mouse-tracking glow, floating particles per section, greeting ticker, animated chat demo, parallax scenarios. Heavy Framer Motion usage. — Tested & verified 2026-02-24
- [x] **Landing Page v5 — No-Cards, Lighter Tones** — Removed all card patterns. Features: full-width inline strips with numbered items, colored icons, subtle dividers. How-it-works: vertical timeline with connecting gradient line. Demo: bare floating chat messages. Scenarios: floating pill tags with parallax drift. Lighter section backgrounds. — Tested 25/25 passed 2026-02-24
- [x] **Landing Page v6 — Light Theme + New Logo** — Full light color scheme: #fafafa hero, soft green features, soft blue tools, soft violet demo, soft amber scenarios. New freehand tilted cursive M logo (SVG). Clean flat navbar. Auth page updated to light theme. — Tested 28/28 passed 2026-02-24
- [x] **Hero Greeting Scroll** — Replaced rotating language orbit with dual-column greeting scroll (20 languages in Latin + non-Latin scripts, scrolling in opposite directions with fade masks). — Verified 2026-02-23
- [x] **JWT Authentication** — Full email/password auth with signup/login/logout. Backend: PyJWT + bcrypt, user-scoped data (conversations, vocabulary, progress). Frontend: React context (useAuth), ProtectedRoute wrapper, AuthPage with Login/Signup tabs. Google login placeholder. — Tested & verified 2026-02-23
- [x] **Bug Fix: Duplicate Chat Creation** — Fixed race condition in `ensureConversation` causing multiple chats when typing and submitting from `/chat` without an existing conversation. Added `creatingConvRef` to prevent duplicate API calls and `skipNextLoadRef` to prevent `loadMessages` from racing with active message send. — Fixed & verified 2026-02-23

## Backlog
- **P1**: Progress Journal — auto-generate weekly learning summaries
- **P2**: Gamification — daily streaks, points, leaderboards
- **P2**: Real-time Pronunciation Feedback — compare spoken vs target

## Landing Page Animations
- WordReveal: word-by-word with blur-to-sharp transition
- LanguageOrbit: 18 language names rotating at different speeds/radii
- TiltElement: 3D mouse-tracking tilt with spring physics
- ChatDemo: auto-playing message sequence triggered by scroll into view
- ScenariosScroll: parallax horizontal movement linked to vertical scroll
- ScrollProgress: spring-physics progress bar at page top
- Hero parallax: scale + opacity + translateY on scroll
- FeatureRow: alternating left/right with animated gradient accent lines
