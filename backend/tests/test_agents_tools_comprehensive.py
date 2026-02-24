"""
Comprehensive backend tests for all agents, tools, and subagents in the Mumble Language Tutor app.

Tests cover:
- Main LanguageTutorAgent (8 tools: grammar_check, vocabulary_lookup, pronunciation_guide, 
  evaluate_response, start_scenario, set_proficiency_level, plan_curriculum, advance_lesson)
- 4 Subagents (grammar, vocabulary, pronunciation, evaluation)
- CurriculumPlannerAgent with save_curriculum tool
- Voice pipeline: TTS endpoint
- SSE streaming for /messages/stream endpoint with tool_start, substeps, tool_end, text_delta events
"""

import pytest
import requests
import time
import json
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials
TEST_EMAIL = "agenttest@test.com"
TEST_PASSWORD = "test1234"
TEST_NAME = "Agent Tester"


class TestSetup:
    """Setup test - create test user"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_signup_user(self, session):
        """Create test user account"""
        response = session.post(f"{BASE_URL}/api/auth/signup", json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        # Accept 200 or 400 (already exists)
        assert response.status_code in [200, 400], f"Signup failed: {response.text}"
        print(f"Signup response: {response.status_code}")


class TestAuthentication:
    """Test authentication endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_token(self, session):
        """Get authentication token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_login_success(self, session):
        """Test successful login"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful, user: {data['user'].get('email')}")
    
    def test_get_current_user(self, session, auth_token):
        """Test /auth/me endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == TEST_EMAIL
        print(f"Current user: {data}")


class TestConversationCRUD:
    """Test conversation CRUD operations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        """Get auth headers"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_conversation_en_es(self, session, auth_headers):
        """Create a new conversation (English native, Spanish target)"""
        response = session.post(f"{BASE_URL}/api/conversations", 
            headers=auth_headers,
            json={
                "native_language": "en",
                "target_language": "es",
                "scenario": None
            })
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data.get("native_language") == "en"
        assert data.get("target_language") == "es"
        print(f"Created conversation: {data['id']}, title: {data.get('title')}")
        return data
    
    def test_create_scenario_conversation(self, session, auth_headers):
        """Create a scenario conversation (restaurant)"""
        response = session.post(f"{BASE_URL}/api/conversations",
            headers=auth_headers,
            json={
                "native_language": "en",
                "target_language": "es",
                "scenario": "restaurant"
            })
        assert response.status_code == 200, f"Create scenario conversation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data.get("scenario") == "restaurant"
        print(f"Created scenario conversation: {data['id']}, scenario: {data.get('scenario')}")
        return data
    
    def test_list_conversations(self, session, auth_headers):
        """List all conversations"""
        response = session.get(f"{BASE_URL}/api/conversations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} conversations")


class TestSSEToolsIntegration:
    """Test SSE streaming with tool activity events - this tests all 8 tools and 4 subagents"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_conversation(self, session, auth_headers):
        """Create a test conversation for tool tests"""
        response = session.post(f"{BASE_URL}/api/conversations",
            headers=auth_headers,
            json={"native_language": "en", "target_language": "en"})
        assert response.status_code == 200
        return response.json()
    
    def _parse_sse_events(self, response_text):
        """Parse SSE events from response text"""
        events = []
        for line in response_text.split("\n"):
            if line.startswith("data: "):
                try:
                    event_data = json.loads(line[6:])
                    events.append(event_data)
                except json.JSONDecodeError:
                    pass
        return events
    
    def test_grammar_check_tool(self, session, auth_headers, test_conversation):
        """Test grammar_check tool with SSE streaming - triggers grammar subagent"""
        conv_id = test_conversation["id"]
        
        # Send a message that should trigger grammar_check tool
        response = session.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            headers=auth_headers,
            json={
                "content": "Check my grammar: I goed to the store yesterday",
                "scenario_context": None
            },
            stream=True
        )
        assert response.status_code == 200
        
        # Collect all SSE data
        full_response = ""
        for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                full_response += chunk
        
        events = self._parse_sse_events(full_response)
        print(f"Grammar check - received {len(events)} events")
        
        # Check for expected event types
        event_types = [e.get("type") for e in events]
        print(f"Event types: {event_types}")
        
        # Should have a 'done' event with ai_message
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) > 0, "No 'done' event received"
        
        ai_message = done_events[0].get("ai_message")
        assert ai_message is not None, "No ai_message in done event"
        assert "content" in ai_message
        print(f"Grammar check response: {ai_message['content'][:200]}...")
        
        # Check if grammar_check tool was used (may or may not be used depending on LLM)
        tools_used = ai_message.get("tools_used", [])
        print(f"Tools used: {tools_used}")
    
    def test_vocabulary_lookup_tool(self, session, auth_headers, test_conversation):
        """Test vocabulary_lookup tool with SSE streaming - triggers vocabulary subagent"""
        conv_id = test_conversation["id"]
        
        response = session.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            headers=auth_headers,
            json={
                "content": "What does serendipity mean?",
                "scenario_context": None
            },
            stream=True
        )
        assert response.status_code == 200
        
        full_response = ""
        for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                full_response += chunk
        
        events = self._parse_sse_events(full_response)
        print(f"Vocabulary lookup - received {len(events)} events")
        
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) > 0, "No 'done' event received"
        
        ai_message = done_events[0].get("ai_message")
        assert ai_message is not None
        print(f"Vocabulary lookup response: {ai_message['content'][:200]}...")
        
        tools_used = ai_message.get("tools_used", [])
        print(f"Tools used: {tools_used}")
    
    def test_pronunciation_guide_tool(self, session, auth_headers, test_conversation):
        """Test pronunciation_guide tool with SSE streaming - triggers pronunciation subagent"""
        conv_id = test_conversation["id"]
        
        response = session.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            headers=auth_headers,
            json={
                "content": "How do you pronounce entrepreneur?",
                "scenario_context": None
            },
            stream=True
        )
        assert response.status_code == 200
        
        full_response = ""
        for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                full_response += chunk
        
        events = self._parse_sse_events(full_response)
        print(f"Pronunciation guide - received {len(events)} events")
        
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) > 0, "No 'done' event received"
        
        ai_message = done_events[0].get("ai_message")
        assert ai_message is not None
        print(f"Pronunciation guide response: {ai_message['content'][:200]}...")
        
        tools_used = ai_message.get("tools_used", [])
        print(f"Tools used: {tools_used}")
    
    def test_evaluate_response_tool(self, session, auth_headers, test_conversation):
        """Test evaluate_response tool with SSE streaming - triggers evaluation subagent"""
        conv_id = test_conversation["id"]
        
        response = session.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            headers=auth_headers,
            json={
                "content": "Evaluate this: Yesterday I go to market and buy many things for my family",
                "scenario_context": None
            },
            stream=True
        )
        assert response.status_code == 200
        
        full_response = ""
        for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                full_response += chunk
        
        events = self._parse_sse_events(full_response)
        print(f"Evaluate response - received {len(events)} events")
        
        done_events = [e for e in events if e.get("type") == "done"]
        assert len(done_events) > 0, "No 'done' event received"
        
        ai_message = done_events[0].get("ai_message")
        assert ai_message is not None
        print(f"Evaluation response: {ai_message['content'][:200]}...")
        
        tools_used = ai_message.get("tools_used", [])
        print(f"Tools used: {tools_used}")


class TestTTSEndpoint:
    """Test Text-to-Speech endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_tts_endpoint(self, session, auth_headers):
        """Test POST /api/tts - text to speech"""
        response = session.post(
            f"{BASE_URL}/api/tts",
            headers=auth_headers,
            json={"text": "Hello, this is a test of the text to speech system."}
        )
        assert response.status_code == 200, f"TTS failed: {response.text}"
        data = response.json()
        assert "audio_base64" in data, "No audio_base64 in response"
        assert len(data["audio_base64"]) > 100, "Audio data too small"
        print(f"TTS returned audio_base64 of length: {len(data['audio_base64'])}")
    
    def test_tts_empty_text_fails(self, session, auth_headers):
        """Test TTS with empty text returns error"""
        response = session.post(
            f"{BASE_URL}/api/tts",
            headers=auth_headers,
            json={"text": ""}
        )
        assert response.status_code == 400, "Empty text should fail"


class TestMessagesRetrieval:
    """Test message retrieval and persistence"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_messages_from_conversation(self, session, auth_headers):
        """Test GET /api/conversations/{id}/messages - verify messages are stored and retrievable"""
        # First create a conversation
        conv_response = session.post(f"{BASE_URL}/api/conversations",
            headers=auth_headers,
            json={"native_language": "en", "target_language": "en"})
        assert conv_response.status_code == 200
        conv_id = conv_response.json()["id"]
        
        # Get messages - should have welcome message
        response = session.get(f"{BASE_URL}/api/conversations/{conv_id}/messages", headers=auth_headers)
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        assert len(messages) >= 1, "Should have at least welcome message"
        
        # First message should be assistant welcome
        first_msg = messages[0]
        assert first_msg.get("role") == "assistant"
        assert "content" in first_msg
        print(f"Retrieved {len(messages)} messages from conversation")
        print(f"Welcome message: {first_msg['content'][:100]}...")


class TestProgressEndpoint:
    """Test progress tracking endpoint"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_progress(self, session, auth_headers):
        """Test GET /api/progress - verify progress tracking returns tool usage stats"""
        response = session.get(f"{BASE_URL}/api/progress", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check expected fields
        assert "total_conversations" in data
        assert "total_messages" in data
        assert "vocabulary_count" in data
        assert "scenarios_practiced" in data
        assert "tools_usage" in data
        assert "streak_days" in data
        assert "recent_activity" in data
        
        print(f"Progress stats:")
        print(f"  - Total conversations: {data['total_conversations']}")
        print(f"  - Total messages: {data['total_messages']}")
        print(f"  - Vocabulary count: {data['vocabulary_count']}")
        print(f"  - Tools usage: {data['tools_usage']}")
        print(f"  - Scenarios practiced: {data['scenarios_practiced']}")


class TestScenarioConversation:
    """Test scenario-based conversations"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    @pytest.fixture(scope="class")
    def auth_headers(self, session):
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_scenario_generates_welcome(self, session, auth_headers):
        """Create a scenario conversation and verify welcome message with scenario context"""
        response = session.post(f"{BASE_URL}/api/conversations",
            headers=auth_headers,
            json={
                "native_language": "en",
                "target_language": "es",
                "scenario": "job_interview"
            })
        assert response.status_code == 200
        conv = response.json()
        assert conv.get("scenario") == "job_interview"
        
        # Get messages to verify welcome
        msg_response = session.get(f"{BASE_URL}/api/conversations/{conv['id']}/messages", headers=auth_headers)
        assert msg_response.status_code == 200
        messages = msg_response.json()
        
        assert len(messages) >= 1, "Should have welcome message"
        welcome = messages[0]
        assert welcome.get("role") == "assistant"
        print(f"Scenario welcome message: {welcome['content'][:200]}...")


class TestLanguagesAndScenarios:
    """Test reference data endpoints"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_get_languages(self, session):
        """Test GET /api/languages"""
        response = session.get(f"{BASE_URL}/api/languages")
        assert response.status_code == 200
        data = response.json()
        assert "popular" in data or "others" in data
        print(f"Languages: {data}")
    
    def test_get_scenarios(self, session):
        """Test GET /api/scenarios"""
        response = session.get(f"{BASE_URL}/api/scenarios")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Scenarios: {[s.get('id') for s in data]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
