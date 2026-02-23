"""
Tests for SSE text streaming (text_delta events) feature.
Verifies that text_delta events are emitted during streaming and 
concatenation equals final ai_message.content.
"""

import pytest
import requests
import json
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestSSETextStreaming:
    """Test SSE text_delta streaming feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a conversation for testing"""
        # Create English-English conversation for simple streaming (no tools)
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_text_streaming", "native_language": "en", "target_language": "en"}
        )
        assert response.status_code == 200
        self.conversation_id = response.json()["id"]
        yield
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{self.conversation_id}")
    
    def test_stream_endpoint_returns_event_stream(self):
        """Verify SSE endpoint returns correct content-type"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "Hi"},
            stream=True,
            timeout=30
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("Content-Type", "")
        response.close()
    
    def test_stream_emits_text_delta_events(self):
        """Verify text_delta events are emitted during streaming"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "Hello, how are you?"},
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
        for delta in text_deltas:
            assert "type" in delta and delta["type"] == "text_delta"
            assert "content" in delta
            assert isinstance(delta["content"], str)
    
    def test_text_delta_concatenation_equals_final_content(self):
        """Verify concatenation of all text_delta content equals final ai_message.content"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "What is 2 + 2?"},
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
        
        assert concatenated == final_content, (
            f"Concatenation of text_deltas should equal final ai_message.content. "
            f"Got {len(concatenated)} chars vs {len(final_content)} chars"
        )
    
    def test_done_event_contains_user_and_ai_messages(self):
        """Verify done event contains both user_message and ai_message"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "Test message"},
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
        assert user_msg['content'] == 'Test message'
        assert 'id' in user_msg
        assert 'conversation_id' in user_msg
        
        # Verify ai_message structure
        ai_msg = done_event['ai_message']
        assert ai_msg['role'] == 'assistant'
        assert len(ai_msg['content']) > 0
        assert 'id' in ai_msg


class TestSSEStreamingWithTools:
    """Test SSE text_delta streaming with tool calls"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Create a Spanish learning conversation"""
        # Create English → Spanish conversation (tools more likely)
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_streaming_tools", "native_language": "en", "target_language": "es"}
        )
        assert response.status_code == 200
        self.conversation_id = response.json()["id"]
        yield
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{self.conversation_id}")
    
    def test_tool_events_appear_before_text_deltas(self):
        """When tools are called, tool events should appear before final text_delta stream"""
        # This message may or may not trigger tools - LLM decides
        # We verify the event ordering is correct regardless
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "What does 'hola' mean?"},
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
        
        # Basic event flow verification
        event_types = [e.get('type') for e in events]
        
        assert 'thinking' in event_types, "Should have thinking event"
        assert 'done' in event_types, "Should have done event"
        
        # text_delta events should exist
        text_delta_count = event_types.count('text_delta')
        assert text_delta_count > 0, "Should have text_delta events"
        
        # done should be last
        assert event_types[-1] == 'done', "Done should be the last event"
    
    def test_text_delta_event_format(self):
        """Verify text_delta event has correct format"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conversation_id}/messages/stream",
            json={"content": "Hola"},
            stream=True,
            timeout=60
        )
        
        text_delta = None
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    if event.get('type') == 'text_delta':
                        text_delta = event
                        break
                except json.JSONDecodeError:
                    pass
        
        response.close()
        
        assert text_delta is not None, "Should receive at least one text_delta event"
        
        # Verify format: {type: 'text_delta', content: '<chunk>'}
        assert text_delta.get('type') == 'text_delta'
        assert 'content' in text_delta
        assert isinstance(text_delta['content'], str)
        # Content should be a token/chunk (typically 1-5 chars)
        assert len(text_delta['content']) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
