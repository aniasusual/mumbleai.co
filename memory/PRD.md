# LinguaFlow - AI Voice Language Tutor PRD

## Problem Statement
Voice conversation agent for language learning. 99 languages. Dual language (native for explanations, target for practice). Custom agent with tool-calling + subagents. First Lesson onboarding with proficiency assessment.

## Dual Language Model
- **Native ("I speak")**: Explanations, corrections, grammar rules in user's fluent language
- **Target ("I want to learn")**: Practice material, exercises, conversation in the language being learned

## First Lesson Onboarding Flow
1. New cross-language conversation → auto welcome + assessment Q1
2. User responds → agent evaluates + asks Q2, Q3
3. After 2-3 exchanges → agent calls set_proficiency_level (beginner/intermediate/advanced)
4. Level saved to DB → all future responses adapted to proficiency

## Agent Architecture
```
Main Tutor Agent (GPT-5.2, native+target aware, proficiency adapted)
  ├── grammar_check → Grammar Subagent
  ├── vocabulary_lookup → Vocabulary Subagent
  ├── pronunciation_guide → Pronunciation Subagent
  ├── evaluate_response → Evaluation Subagent
  ├── set_proficiency_level → Direct tool (saves to DB)
  └── start_scenario → Direct tool
```

## Implemented (Feb 2026)
- [x] Dual language system (native + target)
- [x] First Lesson onboarding with auto proficiency assessment
- [x] Proficiency-adapted teaching (beginner/intermediate/advanced)
- [x] Proper agent loop with LLM-native tool calling
- [x] 5 subagents + 2 direct tools
- [x] 99 language support
- [x] Voice-in, voice-out (Whisper + TTS)
- [x] 8 role-play scenarios
- [x] Progress dashboard, vocabulary notebook

## Backlog
- P1: Pronunciation scoring via Whisper mismatch
- P2: Spaced repetition vocabulary
- P2: Structured lesson curriculum per level
- P3: Daily challenges, gamification
