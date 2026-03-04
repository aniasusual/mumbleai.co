"""
Tests for SSE text streaming feature with authentication.
Verifies text_delta events are emitted during streaming,
tool events appear correctly, and final message is returned.
"""

import pytest
import requests
import json
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "vocabtest@example.com"
TEST_PASSWORD = "test123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    return response.json().get("token")


@pytest.fixture(scope="module")
def conversation_id(auth_token):
    """Create a test conversation"""
    response = requests.post(
        f"{BASE_URL}/api/conversations",
        json={"title": "TEST_sse_streaming", "native_language": "en", "target_language": "en"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200, f"Failed to create conversation: {response.text}"
    conv_id = response.json()["id"]
    yield conv_id
    # Cleanup
    requests.delete(
        f"{BASE_URL}/api/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )


class TestSSETextStreaming:
    """Test SSE text streaming feature with authentication"""
    
    def test_stream_endpoint_returns_event_stream(self, auth_token, conversation_id):
        """Verify SSE endpoint returns correct content-type"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "Hi"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=30
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert "text/event-stream" in response.headers.get("Content-Type", "")
        response.close()
    
    def test_stream_emits_thinking_event(self, auth_token, conversation_id):
        """Verify 'thinking' event is emitted first"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "Hello"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=60
        )
        
        first_event = None
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    first_event = event
                    break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        assert first_event is not None, "Should receive at least one event"
        assert first_event.get('type') == 'thinking', f"First event should be 'thinking', got {first_event}"
    
    def test_stream_emits_text_delta_events(self, auth_token, conversation_id):
        """Verify text_delta events are emitted during streaming"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "Say OK"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=60
        )
        
        text_deltas = []
        has_thinking = False
        has_done = False
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    if event.get('type') == 'thinking':
                        has_thinking = True
                    elif event.get('type') == 'text_delta':
                        text_deltas.append(event)
                    elif event.get('type') == 'done':
                        has_done = True
                        break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        assert has_thinking, "Should emit 'thinking' event"
        assert len(text_deltas) > 0, "Should emit text_delta events"
        assert has_done, "Should emit 'done' event"
        
        # Verify text_delta format
        for delta in text_deltas[:5]:
            assert "type" in delta and delta["type"] == "text_delta"
            assert "content" in delta
            assert isinstance(delta["content"], str)
    
    def test_text_delta_concatenation_contains_final_content(self, auth_token, conversation_id):
        """Verify final content is contained within concatenated text_deltas
        
        Note: The backend strips [EXPECT_LANG:xx] tags from the final stored message,
        but these tags may be present in the raw streamed text_deltas.
        Therefore we check that final_content is contained in concatenated, not exact match.
        """
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "What is 2 + 2?"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=60
        )
        
        text_deltas = []
        done_event = None
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    if event.get('type') == 'text_delta':
                        text_deltas.append(event.get('content', ''))
                    elif event.get('type') == 'done':
                        done_event = event
                        break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        assert done_event is not None, "Should receive done event"
        assert 'ai_message' in done_event, "Done event should contain ai_message"
        
        # Concatenate all text_delta content
        concatenated = ''.join(text_deltas)
        final_content = done_event['ai_message']['content']
        
        # Final content should be contained within concatenated (may have [EXPECT_LANG:xx] stripped)
        assert final_content in concatenated or concatenated.startswith(final_content.rstrip()), (
            f"Final content should be contained in concatenated text_deltas. "
            f"Got concatenated={len(concatenated)} chars, final={len(final_content)} chars"
        )
        
        # Also verify streaming produced text
        assert len(text_deltas) > 0, "Should have received text_delta events"
    
    def test_done_event_contains_messages_and_audio(self, auth_token, conversation_id):
        """Verify done event contains user_message, ai_message, and optionally audio"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "Test"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=60
        )
        
        done_event = None
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    if event.get('type') == 'done':
                        done_event = event
                        break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        assert done_event is not None, "Should receive done event"
        assert 'user_message' in done_event, "Done event should contain user_message"
        assert 'ai_message' in done_event, "Done event should contain ai_message"
        
        # Verify user_message structure
        user_msg = done_event['user_message']
        assert user_msg['role'] == 'user'
        assert user_msg['content'] == 'Test'
        assert 'id' in user_msg
        
        # Verify ai_message structure
        ai_msg = done_event['ai_message']
        assert ai_msg['role'] == 'assistant'
        assert len(ai_msg['content']) > 0
        assert 'id' in ai_msg
        
        # Audio is optional but should be present for TTS
        # Note: Audio generation may fail silently, so we don't assert it exists


class TestSSEToolEvents:
    """Test SSE tool activity events"""
    
    def test_tool_events_structure(self, auth_token, conversation_id):
        """Verify tool events have correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conversation_id}/messages/stream",
            json={"content": "What does serendipity mean?"},
            headers={"Authorization": f"Bearer {auth_token}"},
            stream=True,
            timeout=60
        )
        
        events = []
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    events.append(event)
                    if event.get('type') == 'done':
                        break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        event_types = [e.get('type') for e in events]
        
        # Must have thinking and done
        assert 'thinking' in event_types, "Should have thinking event"
        assert 'done' in event_types, "Should have done event"
        
        # text_delta should exist
        assert 'text_delta' in event_types, "Should have text_delta events"
        
        # done must be last
        assert event_types[-1] == 'done', "Done should be the last event"
        
        # Tool events are optional but if present, verify structure
        for event in events:
            if event.get('type') == 'tool_start':
                assert 'tool' in event, "tool_start should have 'tool' field"
                assert 'label' in event, "tool_start should have 'label' field"
            elif event.get('type') == 'tool_end':
                assert 'tool' in event, "tool_end should have 'tool' field"
            elif event.get('type') == 'substep':
                assert 'parent' in event, "substep should have 'parent' field"
                assert 'label' in event, "substep should have 'label' field"


class TestSSEAuthentication:
    """Test SSE endpoint authentication"""
    
    def test_stream_requires_auth(self):
        """Verify streaming endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/test-id/messages/stream",
            json={"content": "Hi"},
            stream=True,
            timeout=10
        )
        assert response.status_code in [401, 403], f"Should require auth, got {response.status_code}"
        response.close()
    
    def test_stream_rejects_invalid_token(self):
        """Verify streaming endpoint rejects invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/test-id/messages/stream",
            json={"content": "Hi"},
            headers={"Authorization": "Bearer invalid_token"},
            stream=True,
            timeout=10
        )
        assert response.status_code in [401, 403], f"Should reject invalid token, got {response.status_code}"
        response.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
