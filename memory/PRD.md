# LinguaFlow - AI-Powered English Tutor PRD

## Problem Statement
Build a conversation agent that helps users excel in spoken English. Custom agent with tools (no SDK). Acts as a personal tutor.

## Architecture
- **Backend**: FastAPI + MongoDB + Custom Agent System (GPT-5.2 via emergentintegrations)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Agent**: Custom tool-calling agent with 5 tools (grammar_check, vocabulary_lookup, pronunciation_guide, start_scenario, evaluate_response)
- **DB Collections**: conversations, messages, vocabulary, activity

## User Personas
- Language learners (beginner to advanced) improving spoken English
- Professionals preparing for interviews/meetings
- Travelers needing practical conversation skills

## Core Requirements
- [x] AI tutor chat with real-time feedback
- [x] Grammar correction with explanations
- [x] Vocabulary building with definitions/synonyms
- [x] Pronunciation guidance (phonetic)
- [x] 8 role-play scenarios
- [x] Progress tracking dashboard
- [x] Vocabulary notebook (CRUD)
- [x] Conversation history management

## What's Been Implemented (Feb 2026)
- Full custom agent system (no LangChain/CrewAI) with 5 tools
- Chat interface with real-time AI responses
- 8 conversation scenarios
- Dashboard with bento grid stats
- Vocabulary notebook with search
- Landing page with Sage & Sand design

## Prioritized Backlog
- P1: Speech-to-text input for actual spoken practice
- P1: Multi-language support (Spanish, French, etc.)
- P2: Spaced repetition for vocabulary review
- P2: Lesson plans and structured curriculum
- P3: Leaderboards and gamification
- P3: Export vocabulary to flashcard apps
