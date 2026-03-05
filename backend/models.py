"""Pydantic models for API request/response validation."""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class ConversationCreate(BaseModel):
    title: Optional[str] = None
    scenario: Optional[str] = None
    native_language: str = "en"
    target_language: str = "en"


class ConversationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    scenario: Optional[str] = None
    native_language: str = "en"
    target_language: str = "en"
    expected_response_language: Optional[str] = None
    proficiency_level: Optional[str] = None
    phase: str = "learning"
    created_at: str
    updated_at: str
    message_count: int = 0


class MessageCreate(BaseModel):
    content: str
    scenario_context: Optional[str] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    conversation_id: str
    role: str
    content: str
    tools_used: List[str] = []
    tool_activity: List[dict] = []
    created_at: str


class VocabularyCreate(BaseModel):
    word: str
    definition: str
    example: Optional[str] = None
    context: Optional[str] = None


class VocabularyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    word: str
    definition: str
    example: Optional[str] = None
    context: Optional[str] = None
    created_at: str


class ProgressResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_conversations: int = 0
    total_messages: int = 0
    vocabulary_count: int = 0
    scenarios_practiced: List[str] = []
    tools_usage: dict = {}
    streak_days: int = 0
    recent_activity: List[dict] = []


class CurriculumResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    conversation_id: str
    proficiency_level: str
    timeline: str = ""
    goal: str = ""
    lessons: List[dict] = []
    current_lesson: int = 0
    status: str = "active"
    created_at: str
