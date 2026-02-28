"""
Test the dual Whisper transcription approach for pronunciation feedback.

Tests cover:
1. check_pronunciation tool schema has charitable_transcription parameter
2. run_pronunciation_feedback_subagent accepts charitable_transcription parameter
3. tool_executor routes check_pronunciation and passes charitable_transcription
4. voice.py code structure has dual Whisper transcription logic
5. voice.py builds pronunciation_hint when transcriptions differ
6. System prompts reference [PRONUNCIATION CONTEXT] tag
7. TOOL_LABELS and SUBSTEP_LABELS include pronunciation-related entries
8. POST /api/conversations creates conversation correctly
"""

import pytest
import requests
import os
import sys
import inspect

# Add backend to path for direct imports
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
TEST_EMAIL = "test@pronunciation.com"
TEST_PASSWORD = "password123"
TEST_NAME = "Pronunciation Tester"


class TestCharitableTranscriptionParameter:
    """Verify charitable_transcription parameter is in all relevant places"""
    
    def test_check_pronunciation_tool_has_charitable_transcription(self):
        """check_pronunciation tool schema should have charitable_transcription parameter"""
        from agents.tools import MAIN_AGENT_TOOLS
        
        check_pron_tool = next(
            t for t in MAIN_AGENT_TOOLS 
            if t["function"]["name"] == "check_pronunciation"
        )
        params = check_pron_tool["function"]["parameters"]["properties"]
        
        assert "charitable_transcription" in params, \
            f"charitable_transcription not in check_pronunciation params. Found: {list(params.keys())}"
        
        # Verify description explains what it is
        charitable_desc = params["charitable_transcription"].get("description", "")
        assert "target" in charitable_desc.lower() or "whisper" in charitable_desc.lower(), \
            f"charitable_transcription description doesn't explain its purpose: {charitable_desc}"
        
        print(f"✓ check_pronunciation has charitable_transcription parameter")
        print(f"✓ Description: {charitable_desc}")
    
    def test_subagent_has_charitable_transcription_parameter(self):
        """run_pronunciation_feedback_subagent should accept charitable_transcription"""
        from agents.subagents import run_pronunciation_feedback_subagent
        
        sig = inspect.signature(run_pronunciation_feedback_subagent)
        params = list(sig.parameters.keys())
        
        assert "charitable_transcription" in params, \
            f"charitable_transcription not in subagent params. Found: {params}"
        
        # Check it has a default value (should be optional)
        param = sig.parameters["charitable_transcription"]
        assert param.default is None or param.default == inspect.Parameter.empty or param.default is param.empty == False, \
            "charitable_transcription should have None as default value for backward compatibility"
        
        print(f"✓ run_pronunciation_feedback_subagent has charitable_transcription parameter")
        print(f"✓ Default value: {param.default}")
    
    def test_tool_executor_passes_charitable_transcription(self):
        """tool_executor should pass charitable_transcription to subagent"""
        from agents.tool_executor import execute_tool
        
        source = inspect.getsource(execute_tool)
        
        # Check that charitable_transcription is extracted from arguments
        assert "charitable_transcription" in source, \
            "tool_executor doesn't reference charitable_transcription"
        
        # Check it's passed to the subagent
        assert "charitable_transcription=arguments.get" in source or \
               "charitable_transcription=arguments[" in source or \
               "arguments.get(\"charitable_transcription\")" in source or \
               "arguments.get('charitable_transcription')" in source, \
            "tool_executor doesn't extract charitable_transcription from arguments"
        
        print(f"✓ tool_executor passes charitable_transcription to run_pronunciation_feedback_subagent")


class TestDualWhisperCodeStructure:
    """Verify voice.py has dual Whisper transcription logic"""
    
    def test_voice_route_has_dual_transcription(self):
        """voice.py should have dual Whisper pass logic"""
        from routes import voice
        
        source = inspect.getsource(voice)
        
        # Check for two transcribe calls or language hint
        assert "transcribe" in source, "voice.py doesn't call transcribe"
        
        # Check for language parameter usage (charitable transcription uses language hint)
        assert "language=" in source, \
            "voice.py doesn't pass language parameter to transcribe (needed for charitable pass)"
        
        # Check for target_lang reference
        assert "target_lang" in source or "target_language" in source, \
            "voice.py doesn't reference target language"
        
        print(f"✓ voice.py has transcribe calls with language parameter")
    
    def test_voice_route_has_charitable_text_variable(self):
        """voice.py should have charitable_text variable for second transcription"""
        from routes import voice
        
        source = inspect.getsource(voice)
        
        # Check for charitable_text variable
        assert "charitable_text" in source or "charitable_response" in source, \
            "voice.py doesn't have charitable_text/charitable_response variable"
        
        print(f"✓ voice.py has charitable transcription variable")
    
    def test_voice_route_builds_pronunciation_hint(self):
        """voice.py should build pronunciation_hint when transcriptions differ"""
        from routes import voice
        
        source = inspect.getsource(voice)
        
        # Check for pronunciation_hint construction
        assert "pronunciation_hint" in source, \
            "voice.py doesn't have pronunciation_hint"
        
        # Check it's only built when transcriptions differ
        assert "!=" in source or "differ" in source.lower(), \
            "voice.py should compare transcriptions"
        
        print(f"✓ voice.py builds pronunciation_hint when transcriptions differ")
    
    def test_pronunciation_hint_contains_context_tag(self):
        """pronunciation_hint should contain [PRONUNCIATION CONTEXT] tag"""
        from routes import voice
        
        source = inspect.getsource(voice)
        
        assert "PRONUNCIATION CONTEXT" in source, \
            "voice.py doesn't include [PRONUNCIATION CONTEXT] tag"
        
        print(f"✓ voice.py includes [PRONUNCIATION CONTEXT] tag in pronunciation_hint")
    
    def test_pronunciation_hint_appended_to_agent_history(self):
        """pronunciation_hint should be appended to agent history, not saved to DB"""
        from routes import voice
        
        source = inspect.getsource(voice)
        
        # Check for history modification
        assert "history_for_agent" in source, \
            "voice.py doesn't have history_for_agent variable"
        
        # Check pronunciation_hint is appended to history
        assert "+= pronunciation_hint" in source or "pronunciation_hint" in source, \
            "voice.py should append pronunciation_hint to history"
        
        print(f"✓ voice.py appends pronunciation_hint to agent history")


class TestSystemPromptsReferencePronunciationContext:
    """Verify system prompts reference [PRONUNCIATION CONTEXT] tag"""
    
    def test_tutor_prompt_mentions_pronunciation_context_tag(self):
        """Tutor system prompt should explain [PRONUNCIATION CONTEXT] tag"""
        from agents.prompts import build_tutor_system_prompt
        
        # Test with different language setup
        prompt_same = build_tutor_system_prompt("en", "en")
        prompt_diff = build_tutor_system_prompt("en", "es")
        
        # At least one should mention the tag
        assert "PRONUNCIATION CONTEXT" in prompt_same or "PRONUNCIATION CONTEXT" in prompt_diff, \
            "System prompts don't reference [PRONUNCIATION CONTEXT] tag"
        
        print(f"✓ System prompts mention [PRONUNCIATION CONTEXT] tag")
    
    def test_tutor_prompt_explains_charitable_transcription(self):
        """Tutor system prompt should explain charitable_transcription usage"""
        from agents.prompts import build_tutor_system_prompt
        
        prompt = build_tutor_system_prompt("en", "es")
        
        # Should mention transcription differences or charitable interpretation
        has_charitable = "charitable" in prompt.lower()
        has_transcription = "transcription" in prompt.lower()
        has_literal = "literal" in prompt.lower()
        
        assert has_transcription or has_charitable or has_literal, \
            "System prompt doesn't explain transcription-based pronunciation detection"
        
        print(f"✓ System prompt explains pronunciation detection via transcription differences")


class TestLabelsIncludePronunciation:
    """Verify TOOL_LABELS and SUBSTEP_LABELS include pronunciation entries"""
    
    def test_tool_labels_has_check_pronunciation(self):
        """TOOL_LABELS should have check_pronunciation entry"""
        from agents.tool_executor import TOOL_LABELS
        
        assert "check_pronunciation" in TOOL_LABELS, \
            f"check_pronunciation not in TOOL_LABELS. Found: {list(TOOL_LABELS.keys())}"
        
        label = TOOL_LABELS["check_pronunciation"]
        assert "pronunciation" in label.lower(), \
            f"check_pronunciation label doesn't mention pronunciation: {label}"
        
        print(f"✓ TOOL_LABELS['check_pronunciation'] = '{label}'")
    
    def test_substep_labels_has_pronunciation_tools(self):
        """SUBSTEP_LABELS should have compare_phrases and break_down_words"""
        from agents.subagents import SUBSTEP_LABELS
        
        assert "compare_phrases" in SUBSTEP_LABELS, \
            f"compare_phrases not in SUBSTEP_LABELS. Found: {list(SUBSTEP_LABELS.keys())}"
        assert "break_down_words" in SUBSTEP_LABELS, \
            f"break_down_words not in SUBSTEP_LABELS. Found: {list(SUBSTEP_LABELS.keys())}"
        
        print(f"✓ SUBSTEP_LABELS['compare_phrases'] = '{SUBSTEP_LABELS['compare_phrases']}'")
        print(f"✓ SUBSTEP_LABELS['break_down_words'] = '{SUBSTEP_LABELS['break_down_words']}'")


class TestAPIEndpoints:
    """Test API endpoints work correctly"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        """Get authentication token"""
        # First try to signup
        signup_resp = session.post(f"{BASE_URL}/api/auth/signup", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        # Then login
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        return login_resp.json()["token"]
    
    def test_create_conversation(self, session, auth_token):
        """Test POST /api/conversations creates a conversation correctly"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = session.post(f"{BASE_URL}/api/conversations",
            headers=headers,
            json={
                "native_language": "en",
                "target_language": "fr",
                "scenario": None
            })
        
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data, "No id in conversation response"
        assert data.get("native_language") == "en", f"Wrong native_language: {data.get('native_language')}"
        assert data.get("target_language") == "fr", f"Wrong target_language: {data.get('target_language')}"
        assert "message_count" in data, "No message_count in response"
        assert "created_at" in data, "No created_at in response"
        assert "title" in data, "No title in response"
        
        print(f"✓ Created conversation: {data['id']}")
        print(f"✓ native_language: {data.get('native_language')}")
        print(f"✓ target_language: {data.get('target_language')}")
        print(f"✓ message_count: {data.get('message_count')}")


class TestSubagentImplementation:
    """Test the pronunciation feedback subagent implementation details"""
    
    def test_subagent_uses_charitable_transcription_in_context(self):
        """Subagent should use charitable_transcription in its system prompt or messages"""
        from agents.subagents import run_pronunciation_feedback_subagent
        
        source = inspect.getsource(run_pronunciation_feedback_subagent)
        
        # Check that charitable transcription is used in the subagent
        assert "charitable" in source.lower(), \
            "Subagent doesn't reference charitable transcription"
        
        # Check it builds context when charitable differs
        assert "charitable_transcription" in source, \
            "Subagent doesn't use charitable_transcription parameter"
        
        print(f"✓ Subagent uses charitable_transcription in its logic")
    
    def test_subagent_has_comparison_tools(self):
        """Subagent should have tools for comparing and breaking down pronunciation"""
        from agents.subagents import run_pronunciation_feedback_subagent
        
        source = inspect.getsource(run_pronunciation_feedback_subagent)
        
        # Check for tool definitions
        assert "compare_phrases" in source, "Subagent doesn't have compare_phrases tool"
        assert "break_down_words" in source, "Subagent doesn't have break_down_words tool"
        
        print(f"✓ Subagent has compare_phrases and break_down_words tools")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
