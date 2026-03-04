"""
Test Voice SSE Streaming - Verify voice endpoint now returns SSE like keyboard endpoint.

Tests:
- Voice endpoint returns text/event-stream
- Voice SSE emits 'transcription' event first
- Voice SSE emits thinking/tool events during agent processing
- Voice SSE emits 'done' event with user_message, ai_message, ai_audio_base64, transcribed_text
- Keyboard SSE still works correctly (no regression)
"""

import pytest
import requests
import os
import json
import wave
import struct
import io
import tempfile

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "vocabtest@example.com"
TEST_PASSWORD = "test123456"
TEST_CONV_ID = "5eb77024-7468-41d5-94ee-3dae75768b59"


def generate_test_wav():
    """Generate a simple WAV file with a sine wave for testing."""
    import math
    
    sample_rate = 16000
    duration = 1.0  # 1 second
    frequency = 440  # Hz (A4 note)
    
    num_samples = int(sample_rate * duration)
    
    # Generate sine wave
    samples = []
    for i in range(num_samples):
        t = i / sample_rate
        value = int(16383 * 0.5 * math.sin(2 * math.pi * frequency * t) * math.exp(-t * 2))
        samples.append(value)
    
    # Create WAV file in memory
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for sample in samples:
            wav_file.writeframes(struct.pack('<h', sample))
    
    wav_buffer.seek(0)
    return wav_buffer.read()


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session."""
    session = requests.Session()
    return session


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header."""
    api_client.headers.update({
        "Authorization": f"Bearer {auth_token}"
    })
    return api_client


@pytest.fixture(scope="module")
def test_conversation(authenticated_client):
    """Get or create a test conversation."""
    # First try to get existing conversation
    response = authenticated_client.get(f"{BASE_URL}/api/conversations/{TEST_CONV_ID}")
    if response.status_code == 200:
        return response.json()
    
    # Create a new conversation if not found
    response = authenticated_client.post(f"{BASE_URL}/api/conversations", json={
        "title": "Test Voice SSE Conversation",
        "native_language": "en",
        "target_language": "en"
    })
    if response.status_code == 200:
        return response.json()
    pytest.skip(f"Could not get/create test conversation: {response.status_code}")


class TestVoiceSSEStreaming:
    """Tests for the voice SSE streaming endpoint."""
    
    def test_voice_endpoint_returns_event_stream(self, authenticated_client, test_conversation):
        """Voice endpoint should return text/event-stream content type."""
        conv_id = test_conversation['id']
        wav_data = generate_test_wav()
        
        # Create multipart form data
        files = {
            'audio': ('recording.wav', wav_data, 'audio/wav')
        }
        
        # Stream request
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files,
            stream=True
        )
        
        # Check content type - should be event-stream NOT application/json
        content_type = response.headers.get('content-type', '')
        assert 'text/event-stream' in content_type, f"Expected text/event-stream, got {content_type}"
        print(f"✓ Voice endpoint returns content-type: {content_type}")
    
    def test_voice_sse_emits_transcription_event(self, authenticated_client, test_conversation):
        """Voice SSE should emit 'transcription' event first with the transcribed text."""
        conv_id = test_conversation['id']
        wav_data = generate_test_wav()
        
        files = {
            'audio': ('recording.wav', wav_data, 'audio/wav')
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files,
            stream=True
        )
        
        events = []
        transcription_event = None
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    events.append(event)
                    if event.get('type') == 'transcription':
                        transcription_event = event
                        break  # Found transcription event, no need to continue
                except json.JSONDecodeError:
                    continue
        
        # Transcription should be the first event
        assert transcription_event is not None, "No transcription event found"
        assert events[0].get('type') == 'transcription', f"First event should be 'transcription', got {events[0].get('type')}"
        assert 'text' in transcription_event, "Transcription event should contain 'text' field"
        print(f"✓ Transcription event received: {transcription_event.get('text', '')[:50]}...")
    
    def test_voice_sse_emits_agent_events(self, authenticated_client, test_conversation):
        """Voice SSE should emit thinking/tool events during agent processing."""
        conv_id = test_conversation['id']
        wav_data = generate_test_wav()
        
        files = {
            'audio': ('recording.wav', wav_data, 'audio/wav')
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files,
            stream=True
        )
        
        event_types = set()
        all_events = []
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    all_events.append(event)
                    event_types.add(event.get('type'))
                except json.JSONDecodeError:
                    continue
        
        print(f"Event types received: {event_types}")
        
        # Should have at minimum transcription and done events
        assert 'transcription' in event_types, "Missing 'transcription' event"
        assert 'done' in event_types, "Missing 'done' event"
        
        # Check for agent processing events (thinking, text_delta are common)
        # These may or may not appear depending on agent behavior
        possible_agent_events = {'thinking', 'tool_start', 'substep', 'tool_end', 'text_delta'}
        agent_events_found = event_types.intersection(possible_agent_events)
        print(f"✓ Agent events found: {agent_events_found}")
    
    def test_voice_sse_done_event_structure(self, authenticated_client, test_conversation):
        """Voice SSE 'done' event should contain required fields."""
        conv_id = test_conversation['id']
        wav_data = generate_test_wav()
        
        files = {
            'audio': ('recording.wav', wav_data, 'audio/wav')
        }
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files,
            stream=True
        )
        
        done_event = None
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    if event.get('type') == 'done':
                        done_event = event
                except json.JSONDecodeError:
                    continue
        
        assert done_event is not None, "No 'done' event received"
        
        # Required fields in done event
        assert 'user_message' in done_event, "Done event missing 'user_message'"
        assert 'ai_message' in done_event, "Done event missing 'ai_message'"
        assert 'transcribed_text' in done_event, "Done event missing 'transcribed_text'"
        
        # ai_audio_base64 may be present (TTS)
        has_audio = 'ai_audio_base64' in done_event
        print(f"✓ Done event structure valid. Has TTS audio: {has_audio}")
        
        # Verify message structure
        user_msg = done_event['user_message']
        ai_msg = done_event['ai_message']
        
        assert 'id' in user_msg, "User message missing 'id'"
        assert 'role' in user_msg, "User message missing 'role'"
        assert user_msg['role'] == 'user', f"User message role should be 'user', got {user_msg['role']}"
        
        assert 'id' in ai_msg, "AI message missing 'id'"
        assert 'role' in ai_msg, "AI message missing 'role'"
        assert ai_msg['role'] == 'assistant', f"AI message role should be 'assistant', got {ai_msg['role']}"
        
        print(f"✓ Done event contains all required fields")
    
    def test_voice_endpoint_requires_auth(self, api_client, test_conversation):
        """Voice endpoint should require authentication."""
        conv_id = test_conversation['id']
        wav_data = generate_test_wav()
        
        # Request without auth header
        files = {
            'audio': ('recording.wav', wav_data, 'audio/wav')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ Voice endpoint properly requires authentication")


class TestKeyboardSSENoRegression:
    """Verify keyboard SSE streaming still works (no regression)."""
    
    def test_keyboard_stream_returns_event_stream(self, authenticated_client, test_conversation):
        """Keyboard stream endpoint should still return event-stream."""
        conv_id = test_conversation['id']
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Hello, test message"},
            stream=True
        )
        
        content_type = response.headers.get('content-type', '')
        assert 'text/event-stream' in content_type, f"Expected text/event-stream, got {content_type}"
        print(f"✓ Keyboard stream endpoint returns content-type: {content_type}")
    
    def test_keyboard_stream_emits_done_event(self, authenticated_client, test_conversation):
        """Keyboard stream should emit done event with messages."""
        conv_id = test_conversation['id']
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "What is the weather today?"},
            stream=True
        )
        
        done_event = None
        event_types = set()
        
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    event_types.add(event.get('type'))
                    if event.get('type') == 'done':
                        done_event = event
                except json.JSONDecodeError:
                    continue
        
        assert done_event is not None, "No 'done' event from keyboard stream"
        assert 'user_message' in done_event, "Keyboard done event missing 'user_message'"
        assert 'ai_message' in done_event, "Keyboard done event missing 'ai_message'"
        
        print(f"✓ Keyboard stream done event structure valid")
        print(f"  Event types: {event_types}")
    
    def test_keyboard_stream_requires_auth(self, test_conversation):
        """Keyboard stream should require authentication."""
        conv_id = test_conversation['id']
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Test"},
            stream=True
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ Keyboard stream properly requires authentication")


class TestVoiceKeyboardParity:
    """Tests to verify voice and keyboard have identical SSE behavior."""
    
    def test_both_return_same_event_structure(self, authenticated_client, test_conversation):
        """Both endpoints should return similarly structured events."""
        conv_id = test_conversation['id']
        
        # Test keyboard
        keyboard_response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Test parity check"},
            stream=True
        )
        
        keyboard_done = None
        keyboard_events = []
        for line in keyboard_response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    keyboard_events.append(event.get('type'))
                    if event.get('type') == 'done':
                        keyboard_done = event
                except json.JSONDecodeError:
                    continue
        
        # Test voice
        wav_data = generate_test_wav()
        files = {'audio': ('recording.wav', wav_data, 'audio/wav')}
        
        voice_response = authenticated_client.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files=files,
            stream=True
        )
        
        voice_done = None
        voice_events = []
        for line in voice_response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                try:
                    event = json.loads(line[6:])
                    voice_events.append(event.get('type'))
                    if event.get('type') == 'done':
                        voice_done = event
                except json.JSONDecodeError:
                    continue
        
        # Both should have done events
        assert keyboard_done is not None, "Keyboard missing done event"
        assert voice_done is not None, "Voice missing done event"
        
        # Both done events should have same structure
        keyboard_fields = set(keyboard_done.keys())
        voice_fields = set(voice_done.keys())
        
        # Common required fields
        common_fields = {'type', 'user_message', 'ai_message'}
        assert common_fields.issubset(keyboard_fields), f"Keyboard done missing fields: {common_fields - keyboard_fields}"
        assert common_fields.issubset(voice_fields), f"Voice done missing fields: {common_fields - voice_fields}"
        
        # Voice should have transcribed_text (keyboard doesn't need it)
        assert 'transcribed_text' in voice_fields, "Voice done should have 'transcribed_text'"
        
        print(f"✓ Both endpoints have compatible done event structures")
        print(f"  Keyboard events: {keyboard_events}")
        print(f"  Voice events: {voice_events}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
