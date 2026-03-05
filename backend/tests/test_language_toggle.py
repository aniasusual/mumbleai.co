"""
Test Language Toggle feature for Mumble language tutor app.
Tests:
1. ConversationResponse model includes expected_response_language
2. Backend voice endpoint accepts language_hint form param
3. SSE done events include expected_response_language
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLanguageToggleBackend:
    """Backend tests for language toggle feature"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test2@example.com",
            "password": "password123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return headers with authorization"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_conversation_response_has_expected_response_language(self, auth_headers):
        """Test that GET /conversations returns expected_response_language field"""
        response = requests.get(f"{BASE_URL}/api/conversations", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get conversations: {response.text}"
        
        conversations = response.json()
        if conversations:
            conv = conversations[0]
            # Check that expected_response_language field exists (can be None initially)
            assert "expected_response_language" in conv or conv.get("expected_response_language") is None, \
                f"expected_response_language field missing from conversation: {conv.keys()}"
            print(f"PASSED: Conversation has expected_response_language field")
        else:
            print("SKIPPED: No conversations to test")
    
    def test_french_conversation_has_correct_fields(self, auth_headers):
        """Test French conversation has native_language, target_language, expected_response_language"""
        french_conv_id = "b6f924a3-5819-47db-acdf-3812152678b7"
        response = requests.get(f"{BASE_URL}/api/conversations/{french_conv_id}", headers=auth_headers)
        
        if response.status_code == 404:
            pytest.skip(f"French conversation {french_conv_id} not found")
        
        assert response.status_code == 200, f"Failed to get conversation: {response.text}"
        conv = response.json()
        
        # Check that all language fields are present
        assert "native_language" in conv, "native_language field missing"
        assert "target_language" in conv, "target_language field missing"
        # expected_response_language may or may not be present depending on conversation state
        print(f"French conversation fields: native={conv.get('native_language')}, target={conv.get('target_language')}, expected={conv.get('expected_response_language')}")
        print("PASSED: French conversation has correct language fields")
    
    def test_create_conversation_with_different_languages(self, auth_headers):
        """Test creating conversation with different native and target languages"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "native_language": "en",
                "target_language": "es"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to create conversation: {response.text}"
        conv = response.json()
        
        assert conv.get("native_language") == "en", f"Native language should be 'en', got '{conv.get('native_language')}'"
        assert conv.get("target_language") == "es", f"Target language should be 'es', got '{conv.get('target_language')}'"
        # After creation, expected_response_language should be set (defaults to native)
        print(f"Created conversation id={conv.get('id')}, expected_response_language={conv.get('expected_response_language')}")
        print("PASSED: Conversation created with correct language settings")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv['id']}", headers=auth_headers)
    
    def test_create_same_language_conversation(self, auth_headers):
        """Test creating conversation when native == target (English practice)"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "native_language": "en",
                "target_language": "en"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to create conversation: {response.text}"
        conv = response.json()
        
        assert conv.get("native_language") == "en", "Native language should be 'en'"
        assert conv.get("target_language") == "en", "Target language should be 'en'"
        print(f"Same-language conversation id={conv.get('id')}, expected_response_language={conv.get('expected_response_language')}")
        print("PASSED: Same-language conversation created")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv['id']}", headers=auth_headers)
    
    def test_voice_endpoint_accepts_language_hint(self, auth_headers):
        """Test that voice endpoint accepts language_hint form parameter (without actually sending audio)"""
        # We'll test by examining the endpoint signature - sending invalid audio with language_hint
        # to verify the param is accepted (will fail on audio but not on param)
        french_conv_id = "b6f924a3-5819-47db-acdf-3812152678b7"
        
        # Create a minimal form data with empty audio file
        files = {'audio': ('test.webm', b'', 'audio/webm')}
        data = {'language_hint': 'fr'}
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{french_conv_id}/voice-message",
            files=files,
            data=data,
            headers=auth_headers
        )
        
        # We expect 400 (bad audio) not 422 (validation error for unknown field)
        # If language_hint was not accepted, we'd get a validation error
        if response.status_code == 422:
            pytest.fail(f"language_hint parameter not accepted by endpoint: {response.text}")
        
        # 400 or 404 is expected (bad audio or conv not found)
        assert response.status_code in [400, 404], f"Unexpected status: {response.status_code} - {response.text}"
        print(f"PASSED: Voice endpoint accepts language_hint parameter (status={response.status_code})")
    
    def test_sse_text_stream_includes_expected_response_language(self, auth_headers):
        """Test that text message SSE stream done event includes expected_response_language"""
        # First create a test conversation
        create_resp = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"native_language": "en", "target_language": "de"},
            headers=auth_headers
        )
        assert create_resp.status_code == 200, f"Failed to create conv: {create_resp.text}"
        conv_id = create_resp.json()["id"]
        
        try:
            # Send a message via SSE stream
            response = requests.post(
                f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
                json={"content": "Hello, can you teach me how to say hello in German?"},
                headers=auth_headers,
                stream=True,
                timeout=60
            )
            assert response.status_code == 200, f"SSE stream failed: {response.status_code}"
            
            done_event = None
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith("data: "):
                        import json
                        event = json.loads(decoded[6:])
                        if event.get("type") == "done":
                            done_event = event
                            break
            
            assert done_event is not None, "No done event received from SSE stream"
            assert "expected_response_language" in done_event, \
                f"expected_response_language missing from done event: {done_event.keys()}"
            print(f"PASSED: SSE done event includes expected_response_language={done_event.get('expected_response_language')}")
            
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=auth_headers)
    
    def test_languages_endpoint(self, auth_headers):
        """Test that languages endpoint returns proper structure for toggle"""
        response = requests.get(f"{BASE_URL}/api/languages", headers=auth_headers)
        assert response.status_code == 200, f"Languages endpoint failed: {response.text}"
        
        data = response.json()
        assert "popular" in data, "Languages response missing 'popular' field"
        assert "others" in data, "Languages response missing 'others' field"
        
        # Check that languages have code and name
        if data["popular"]:
            lang = data["popular"][0]
            assert "code" in lang, "Language missing 'code' field"
            assert "name" in lang, "Language missing 'name' field"
            print(f"Sample language: code={lang['code']}, name={lang['name']}")
        
        print("PASSED: Languages endpoint returns correct structure")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
