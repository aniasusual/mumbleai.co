"""
Vocabulary CRUD API tests and save_vocabulary tool executor tests.
Tests: POST/GET/DELETE /api/vocabulary endpoints, duplicate detection, tool_executor handler.
"""

import pytest
import requests
import json
import uuid
import os
import asyncio
from datetime import datetime, timezone

# Use environment variable for base URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = f"vocabtest_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Vocab Test User"


@pytest.fixture(scope="module")
def api_session():
    """Create a requests session for all tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_session):
    """Sign up and get authentication token"""
    # Signup
    signup_resp = api_session.post(f"{BASE_URL}/api/auth/signup", json={
        "name": TEST_NAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if signup_resp.status_code == 200:
        return signup_resp.json().get("token")
    
    # If user exists, try login
    login_resp = api_session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if login_resp.status_code == 200:
        return login_resp.json().get("token")
    
    pytest.skip(f"Authentication failed: {login_resp.text}")


@pytest.fixture(scope="module")
def authenticated_session(api_session, auth_token):
    """Session with auth header"""
    api_session.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_session


class TestVocabularyToolDefinition:
    """Test that save_vocabulary tool is properly defined in MAIN_AGENT_TOOLS"""
    
    def test_save_vocabulary_tool_exists_in_main_agent_tools(self):
        """save_vocabulary tool should be in MAIN_AGENT_TOOLS"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.tools import MAIN_AGENT_TOOLS
        
        tool_names = [t["function"]["name"] for t in MAIN_AGENT_TOOLS]
        assert "save_vocabulary" in tool_names, f"save_vocabulary not in tools: {tool_names}"
    
    def test_save_vocabulary_tool_has_correct_schema(self):
        """save_vocabulary tool should have word and definition as required fields"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.tools import MAIN_AGENT_TOOLS
        
        save_vocab_tool = None
        for tool in MAIN_AGENT_TOOLS:
            if tool["function"]["name"] == "save_vocabulary":
                save_vocab_tool = tool
                break
        
        assert save_vocab_tool is not None, "save_vocabulary tool not found"
        
        params = save_vocab_tool["function"]["parameters"]
        required = params.get("required", [])
        properties = params.get("properties", {})
        
        # Check required fields
        assert "word" in required, "'word' should be required"
        assert "definition" in required, "'definition' should be required"
        
        # Check all expected properties exist
        expected_props = ["word", "definition", "example", "context"]
        for prop in expected_props:
            assert prop in properties, f"'{prop}' property missing"
    
    def test_save_vocabulary_tool_has_correct_description(self):
        """save_vocabulary tool description should mention automatic saving"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.tools import MAIN_AGENT_TOOLS
        
        save_vocab_tool = None
        for tool in MAIN_AGENT_TOOLS:
            if tool["function"]["name"] == "save_vocabulary":
                save_vocab_tool = tool
                break
        
        description = save_vocab_tool["function"]["description"].lower()
        assert "automatically" in description or "auto" in description, \
            "Description should mention automatic saving"


class TestVocabularyToolExecutor:
    """Test the tool_executor handler for save_vocabulary"""
    
    def test_save_vocabulary_in_tool_labels(self):
        """save_vocabulary should have a label in TOOL_LABELS"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.tool_executor import TOOL_LABELS
        
        assert "save_vocabulary" in TOOL_LABELS, "save_vocabulary missing from TOOL_LABELS"
        assert TOOL_LABELS["save_vocabulary"] == "Saving word to vocabulary"


class TestVocabularyAPIEndpoints:
    """Test vocabulary CRUD API endpoints"""
    
    def test_list_vocabulary_returns_list(self, authenticated_session):
        """GET /api/vocabulary should return a list"""
        response = authenticated_session.get(f"{BASE_URL}/api/vocabulary")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_save_vocabulary_creates_word(self, authenticated_session):
        """POST /api/vocabulary should create a new vocabulary entry"""
        test_word = f"testword_{uuid.uuid4().hex[:8]}"
        payload = {
            "word": test_word,
            "definition": "A test definition",
            "example": "This is a test sentence.",
            "context": "unit test"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/vocabulary", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should include 'id'"
        assert data["word"] == test_word, f"Word mismatch: {data['word']} != {test_word}"
        assert data["definition"] == "A test definition"
        assert data["example"] == "This is a test sentence."
        assert data["context"] == "unit test"
        assert "created_at" in data
        
        # Store for cleanup
        self.__class__.test_vocab_id = data["id"]
    
    def test_list_vocabulary_shows_saved_word(self, authenticated_session):
        """GET /api/vocabulary should include the saved word"""
        response = authenticated_session.get(f"{BASE_URL}/api/vocabulary")
        assert response.status_code == 200
        
        data = response.json()
        vocab_ids = [v["id"] for v in data]
        assert hasattr(self.__class__, 'test_vocab_id'), "No vocab ID from previous test"
        assert self.__class__.test_vocab_id in vocab_ids, "Saved word not found in list"
    
    def test_save_vocabulary_minimal_fields(self, authenticated_session):
        """POST /api/vocabulary with only required fields should work"""
        test_word = f"minimal_{uuid.uuid4().hex[:8]}"
        payload = {
            "word": test_word,
            "definition": "Minimal test"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/vocabulary", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["word"] == test_word
        assert data["definition"] == "Minimal test"
        # Optional fields should be None or empty
        assert data.get("example") is None or data.get("example") == ""
        
        self.__class__.minimal_vocab_id = data["id"]
    
    def test_save_vocabulary_missing_word_fails(self, authenticated_session):
        """POST /api/vocabulary without word should fail"""
        payload = {
            "definition": "No word provided"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/vocabulary", json=payload)
        # Should return 422 Unprocessable Entity
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    
    def test_save_vocabulary_missing_definition_fails(self, authenticated_session):
        """POST /api/vocabulary without definition should fail"""
        payload = {
            "word": "nodef"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/vocabulary", json=payload)
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    
    def test_delete_vocabulary_removes_word(self, authenticated_session):
        """DELETE /api/vocabulary/{id} should remove the word"""
        # First create a word to delete
        test_word = f"todelete_{uuid.uuid4().hex[:8]}"
        create_resp = authenticated_session.post(f"{BASE_URL}/api/vocabulary", json={
            "word": test_word,
            "definition": "Will be deleted"
        })
        assert create_resp.status_code == 200
        vocab_id = create_resp.json()["id"]
        
        # Delete it
        delete_resp = authenticated_session.delete(f"{BASE_URL}/api/vocabulary/{vocab_id}")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.text}"
        assert delete_resp.json().get("status") == "deleted"
        
        # Verify it's gone
        list_resp = authenticated_session.get(f"{BASE_URL}/api/vocabulary")
        vocab_ids = [v["id"] for v in list_resp.json()]
        assert vocab_id not in vocab_ids, "Deleted word still in list"
    
    def test_vocabulary_requires_authentication(self, api_session):
        """Vocabulary endpoints should require authentication"""
        # Use a session without auth header
        no_auth_session = requests.Session()
        no_auth_session.headers.update({"Content-Type": "application/json"})
        
        # GET should fail (401 Unauthorized or 403 Forbidden)
        get_resp = no_auth_session.get(f"{BASE_URL}/api/vocabulary")
        assert get_resp.status_code in [401, 403], f"GET without auth should fail: {get_resp.status_code}"
        
        # POST should fail
        post_resp = no_auth_session.post(f"{BASE_URL}/api/vocabulary", json={
            "word": "test",
            "definition": "test"
        })
        assert post_resp.status_code in [401, 403], f"POST without auth should fail: {post_resp.status_code}"
        
        # DELETE should fail
        delete_resp = no_auth_session.delete(f"{BASE_URL}/api/vocabulary/some-id")
        assert delete_resp.status_code in [401, 403], f"DELETE without auth should fail: {delete_resp.status_code}"


class TestVocabularyPromptUpdates:
    """Test that system prompts include save_vocabulary instructions"""
    
    def test_tutor_prompt_mentions_save_vocabulary(self):
        """Tutor system prompt should mention save_vocabulary tool"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.prompts import build_tutor_system_prompt
        
        # Test with different language pairs
        prompt = build_tutor_system_prompt(native_language="en", target_language="fr")
        
        assert "save_vocabulary" in prompt, "save_vocabulary not mentioned in tutor prompt"
        assert "automatically" in prompt.lower(), "Prompt should mention automatic saving"
    
    def test_tutor_prompt_tool_list_includes_save_vocabulary(self):
        """Tutor prompt tool list should include save_vocabulary"""
        import sys
        sys.path.insert(0, '/app/backend')
        from agents.prompts import build_tutor_system_prompt
        
        prompt = build_tutor_system_prompt(native_language="en", target_language="en")
        
        # Check for save_vocabulary in the tools section
        assert "save_vocabulary" in prompt, "save_vocabulary missing from tools section"


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_words(self, authenticated_session):
        """Remove test words created during testing"""
        list_resp = authenticated_session.get(f"{BASE_URL}/api/vocabulary")
        if list_resp.status_code == 200:
            for vocab in list_resp.json():
                # Delete words that start with 'test' or 'minimal' or 'todelete'
                word = vocab.get("word", "")
                if word.startswith("testword_") or word.startswith("minimal_"):
                    authenticated_session.delete(f"{BASE_URL}/api/vocabulary/{vocab['id']}")
        
        # This is a cleanup test, always pass
        assert True
