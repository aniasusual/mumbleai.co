"""
Test the new check_pronunciation tool feature.

Tests cover:
1. check_pronunciation tool is registered in MAIN_AGENT_TOOLS
2. TOOL_LABELS includes check_pronunciation
3. tool_executor routes check_pronunciation to run_pronunciation_feedback_subagent
4. run_pronunciation_feedback_subagent exists and has correct signature
5. The subagent has compare_phrases and break_down_words tools
6. SUBSTEP_LABELS includes the pronunciation feedback substeps
7. API endpoint POST /api/conversations creates conversation successfully
8. Favicon.svg is served correctly
"""

import pytest
import requests
import os
import sys

# Add backend to path for direct imports
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
TEST_EMAIL = "test@pronunciation.com"
TEST_PASSWORD = "password123"
TEST_NAME = "Pronunciation Tester"


class TestCheckPronunciationToolRegistration:
    """Verify check_pronunciation tool is properly registered"""
    
    def test_check_pronunciation_in_main_agent_tools(self):
        """check_pronunciation should be in MAIN_AGENT_TOOLS list"""
        from agents.tools import MAIN_AGENT_TOOLS
        
        tool_names = [t["function"]["name"] for t in MAIN_AGENT_TOOLS]
        assert "check_pronunciation" in tool_names, f"check_pronunciation not in MAIN_AGENT_TOOLS. Found: {tool_names}"
        print(f"✓ check_pronunciation is in MAIN_AGENT_TOOLS")
        
        # Verify the tool schema
        check_pron_tool = next(t for t in MAIN_AGENT_TOOLS if t["function"]["name"] == "check_pronunciation")
        params = check_pron_tool["function"]["parameters"]["properties"]
        
        assert "expected_phrase" in params, "Missing expected_phrase parameter"
        assert "spoken_phrase" in params, "Missing spoken_phrase parameter"
        assert "target_language" in params, "Missing target_language parameter"
        assert "native_language" in params, "Missing native_language parameter"
        
        required = check_pron_tool["function"]["parameters"]["required"]
        assert "expected_phrase" in required, "expected_phrase should be required"
        assert "spoken_phrase" in required, "spoken_phrase should be required"
        assert "target_language" in required, "target_language should be required"
        assert "native_language" in required, "native_language should be required"
        
        print(f"✓ check_pronunciation has correct parameters: {list(params.keys())}")
        print(f"✓ Required parameters: {required}")
    
    def test_tool_labels_includes_check_pronunciation(self):
        """TOOL_LABELS should include check_pronunciation"""
        from agents.tool_executor import TOOL_LABELS
        
        assert "check_pronunciation" in TOOL_LABELS, f"check_pronunciation not in TOOL_LABELS. Found: {list(TOOL_LABELS.keys())}"
        print(f"✓ TOOL_LABELS['check_pronunciation'] = '{TOOL_LABELS['check_pronunciation']}'")


class TestPronunciationFeedbackSubagent:
    """Verify run_pronunciation_feedback_subagent exists and is properly configured"""
    
    def test_subagent_function_exists(self):
        """run_pronunciation_feedback_subagent should exist in subagents.py"""
        from agents.subagents import run_pronunciation_feedback_subagent
        
        assert callable(run_pronunciation_feedback_subagent), "run_pronunciation_feedback_subagent is not callable"
        print(f"✓ run_pronunciation_feedback_subagent function exists")
    
    def test_subagent_imported_in_tool_executor(self):
        """tool_executor should import run_pronunciation_feedback_subagent"""
        from agents import tool_executor
        
        assert hasattr(tool_executor, 'run_pronunciation_feedback_subagent'), \
            "run_pronunciation_feedback_subagent not imported in tool_executor"
        print(f"✓ run_pronunciation_feedback_subagent imported in tool_executor")
    
    def test_substep_labels_include_subagent_tools(self):
        """SUBSTEP_LABELS should include compare_phrases and break_down_words"""
        from agents.subagents import SUBSTEP_LABELS
        
        assert "compare_phrases" in SUBSTEP_LABELS, f"compare_phrases not in SUBSTEP_LABELS"
        assert "break_down_words" in SUBSTEP_LABELS, f"break_down_words not in SUBSTEP_LABELS"
        
        print(f"✓ SUBSTEP_LABELS['compare_phrases'] = '{SUBSTEP_LABELS['compare_phrases']}'")
        print(f"✓ SUBSTEP_LABELS['break_down_words'] = '{SUBSTEP_LABELS['break_down_words']}'")
    
    def test_subagent_has_correct_signature(self):
        """run_pronunciation_feedback_subagent should have correct parameters"""
        import inspect
        from agents.subagents import run_pronunciation_feedback_subagent
        
        sig = inspect.signature(run_pronunciation_feedback_subagent)
        params = list(sig.parameters.keys())
        
        expected_params = ['api_key', 'expected_phrase', 'spoken_phrase', 'target_language', 'native_language', 'on_event']
        for param in expected_params:
            assert param in params, f"Missing parameter: {param}. Found: {params}"
        
        print(f"✓ Subagent has correct parameters: {params}")


class TestToolExecutorRouting:
    """Verify tool_executor correctly routes check_pronunciation"""
    
    def test_execute_tool_has_check_pronunciation_case(self):
        """execute_tool should handle check_pronunciation"""
        import inspect
        from agents.tool_executor import execute_tool
        
        source = inspect.getsource(execute_tool)
        assert 'check_pronunciation' in source, "execute_tool doesn't handle check_pronunciation"
        assert 'run_pronunciation_feedback_subagent' in source, "execute_tool doesn't call run_pronunciation_feedback_subagent"
        
        print(f"✓ execute_tool routes check_pronunciation to run_pronunciation_feedback_subagent")


class TestSystemPromptsUpdated:
    """Verify system prompts include check_pronunciation usage guidelines"""
    
    def test_prompts_include_check_pronunciation(self):
        """System prompts should mention check_pronunciation"""
        from agents.prompts import build_tutor_system_prompt
        
        # Test with different language setup
        prompt = build_tutor_system_prompt("en", "es")
        
        assert "check_pronunciation" in prompt, "check_pronunciation not mentioned in system prompt"
        print(f"✓ check_pronunciation mentioned in tutor system prompt")
        
        # Verify it explains when to use it
        assert "expected_phrase" in prompt or "spoken_phrase" in prompt, \
            "System prompt doesn't explain check_pronunciation parameters"
        print(f"✓ System prompt includes usage guidelines for check_pronunciation")


class TestAPIEndpoints:
    """Test API endpoints work correctly"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_signup_user(self, session):
        """Create test user for pronunciation testing"""
        response = session.post(f"{BASE_URL}/api/auth/signup", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        # Accept 200 (created) or 400/409 (already exists)
        assert response.status_code in [200, 400, 409], f"Signup failed: {response.text}"
        print(f"✓ Signup response: {response.status_code}")
    
    def test_login(self, session):
        """Test login works"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print(f"✓ Login successful")
        return data["token"]
    
    def test_create_conversation(self, session):
        """Test POST /api/conversations creates a conversation"""
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_resp.status_code == 200
        token = login_resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create conversation
        response = session.post(f"{BASE_URL}/api/conversations",
            headers=headers,
            json={
                "native_language": "en",
                "target_language": "es",
                "scenario": None
            })
        
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in conversation response"
        assert data.get("native_language") == "en"
        assert data.get("target_language") == "es"
        assert "message_count" in data
        
        print(f"✓ Created conversation: {data['id']}")
        print(f"✓ Title: {data.get('title')}")
        print(f"✓ Message count: {data.get('message_count')}")


class TestFavicon:
    """Test favicon is served correctly"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_favicon_svg_served(self, session):
        """Test favicon.svg is accessible at /favicon.svg"""
        # Note: The favicon is served by the frontend, so we test the frontend URL
        response = session.get(f"{BASE_URL}/favicon.svg")
        
        assert response.status_code == 200, f"Favicon not found: {response.status_code}"
        
        content = response.text
        assert "<svg" in content, "Response is not SVG content"
        assert "stroke=" in content or "fill=" in content, "SVG appears to be empty"
        
        print(f"✓ Favicon.svg served at /favicon.svg")
        print(f"✓ Content type: {response.headers.get('content-type', 'unknown')}")
        print(f"✓ SVG content length: {len(content)} bytes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
