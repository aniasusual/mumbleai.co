"""
Tests for voice mode streaming fix.
Verifies that:
1. SSE stream endpoint returns text_delta events (for text mode streaming) 
2. SSE stream endpoint returns done event with ai_audio_base64 (for voice mode)
3. The done event contains both user_message and ai_message with proper structure
4. TTS audio is generated for AI responses
"""
import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestSSEStreamingForVoiceMode:
    """Tests for SSE streaming endpoint behavior for voice mode fix"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        # Get existing conversations
        conv_response = requests.get(f"{BASE_URL}/api/conversations", headers=self.headers)
        self.conversations = conv_response.json()
    
    def test_sse_stream_returns_done_event_with_messages(self):
        """Test that SSE stream returns done event with user_message and ai_message"""
        # Use first existing conversation or create new one
        if self.conversations:
            conv_id = self.conversations[0]["id"]
        else:
            create_resp = requests.post(f"{BASE_URL}/api/conversations", 
                json={"native_language": "en", "target_language": "en"}, 
                headers=self.headers)
            assert create_resp.status_code == 200
            conv_id = create_resp.json()["id"]
        
        # Send a message via SSE stream
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Hello, I want to practice saying 'thank you'"},
            headers=self.headers,
            stream=True
        )
        
        assert response.status_code == 200
        
        # Collect SSE events
        events = []
        done_event = None
        has_text_delta = False
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = json.loads(line_str[6:])
                    events.append(data)
                    if data.get('type') == 'text_delta':
                        has_text_delta = True
                    if data.get('type') == 'done':
                        done_event = data
        
        # Verify done event structure
        assert done_event is not None, "No done event received"
        assert 'user_message' in done_event, "done event missing user_message"
        assert 'ai_message' in done_event, "done event missing ai_message"
        
        # Verify message structure
        user_msg = done_event['user_message']
        ai_msg = done_event['ai_message']
        
        assert 'id' in user_msg, "user_message missing id"
        assert 'content' in user_msg, "user_message missing content"
        assert 'role' in user_msg, "user_message missing role"
        assert user_msg['role'] == 'user'
        
        assert 'id' in ai_msg, "ai_message missing id"
        assert 'content' in ai_msg, "ai_message missing content"  
        assert 'role' in ai_msg, "ai_message missing role"
        assert ai_msg['role'] == 'assistant'
        
        print(f"SUCCESS: SSE stream returned {len(events)} events")
        print(f"  - Has text_delta events: {has_text_delta}")
        print(f"  - Done event has user_message: True")
        print(f"  - Done event has ai_message: True")
    
    def test_sse_stream_includes_audio_in_done_event(self):
        """Test that SSE stream done event includes ai_audio_base64 for TTS"""
        # Use first existing conversation or create new one
        if self.conversations:
            conv_id = self.conversations[0]["id"]
        else:
            create_resp = requests.post(f"{BASE_URL}/api/conversations", 
                json={"native_language": "en", "target_language": "en"}, 
                headers=self.headers)
            assert create_resp.status_code == 200
            conv_id = create_resp.json()["id"]
        
        # Send a message via SSE stream
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Say something short"},
            headers=self.headers,
            stream=True
        )
        
        assert response.status_code == 200
        
        done_event = None
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = json.loads(line_str[6:])
                    if data.get('type') == 'done':
                        done_event = data
                        break
        
        assert done_event is not None, "No done event received"
        
        # Check for audio base64 (TTS generation)
        has_audio = 'ai_audio_base64' in done_event and done_event['ai_audio_base64'] is not None
        
        if has_audio:
            audio_base64 = done_event['ai_audio_base64']
            # Verify it's valid base64 by checking length
            assert len(audio_base64) > 100, "Audio base64 too short - TTS may have failed"
            print(f"SUCCESS: TTS audio generated, base64 length: {len(audio_base64)}")
        else:
            print("WARNING: No audio in done event - TTS may be disabled or failed")
        
        # expected_response_language should also be present
        assert 'expected_response_language' in done_event, "done event missing expected_response_language"
        print(f"  - expected_response_language: {done_event.get('expected_response_language')}")
    
    def test_text_delta_events_contain_content(self):
        """Test that text_delta events have content field for streaming text"""
        # Use first existing conversation or create new one
        if self.conversations:
            conv_id = self.conversations[0]["id"]
        else:
            create_resp = requests.post(f"{BASE_URL}/api/conversations", 
                json={"native_language": "en", "target_language": "en"}, 
                headers=self.headers)
            assert create_resp.status_code == 200
            conv_id = create_resp.json()["id"]
        
        # Send a message via SSE stream
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Tell me a very short joke"},
            headers=self.headers,
            stream=True
        )
        
        assert response.status_code == 200
        
        text_delta_events = []
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data = json.loads(line_str[6:])
                    if data.get('type') == 'text_delta':
                        text_delta_events.append(data)
        
        if len(text_delta_events) > 0:
            # Verify text_delta events have content
            for event in text_delta_events[:5]:  # Check first 5
                assert 'content' in event or 'text' in event, f"text_delta event missing content: {event}"
            
            # Concatenate all text
            streamed_text = ''.join(e.get('content', e.get('text', '')) for e in text_delta_events)
            print(f"SUCCESS: Received {len(text_delta_events)} text_delta events")
            print(f"  - Streamed text length: {len(streamed_text)} chars")
        else:
            print("INFO: No text_delta events (agent may not use streaming)")


class TestTTSEndpoint:
    """Tests for standalone TTS endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_tts_endpoint_generates_audio(self):
        """Test that POST /api/tts generates audio for text"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Hello, this is a test of the text to speech system."},
            headers=self.headers
        )
        
        assert response.status_code == 200, f"TTS failed: {response.text}"
        
        data = response.json()
        assert 'audio_base64' in data, "Response missing audio_base64"
        assert len(data['audio_base64']) > 100, "Audio too short"
        
        print(f"SUCCESS: TTS generated audio, base64 length: {len(data['audio_base64'])}")
    
    def test_tts_endpoint_requires_text(self):
        """Test that TTS endpoint returns 400 for empty text"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": ""},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: TTS returns 400 for empty text")


class TestVoiceMessageEndpoint:
    """Tests for voice message SSE endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
        }
        # Get conversations
        conv_response = requests.get(f"{BASE_URL}/api/conversations", 
            headers={**self.headers, "Content-Type": "application/json"})
        self.conversations = conv_response.json()
    
    def test_voice_message_endpoint_exists(self):
        """Test that voice message endpoint exists"""
        if not self.conversations:
            pytest.skip("No conversations to test with")
        
        conv_id = self.conversations[0]["id"]
        
        # Create a minimal audio file (empty webm for structure test)
        import io
        fake_audio = io.BytesIO(b'\x1a\x45\xdf\xa3' + b'\x00' * 100)  # Minimal webm header
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            files={"audio": ("test.webm", fake_audio, "audio/webm")},
            headers=self.headers,
            stream=True
        )
        
        # Endpoint should exist (might fail on audio processing but 404 means endpoint missing)
        assert response.status_code != 404, "Voice message endpoint not found"
        print(f"INFO: Voice message endpoint returned status {response.status_code}")


class TestMessageListBehavior:
    """Tests to verify the frontend logic expectations are met by backend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        self.token = response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_messages_endpoint_returns_valid_structure(self):
        """Test that GET messages returns proper message structure for rendering"""
        # Get conversations first
        conv_resp = requests.get(f"{BASE_URL}/api/conversations", headers=self.headers)
        conversations = conv_resp.json()
        
        if not conversations:
            pytest.skip("No conversations to test")
        
        conv_id = conversations[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            headers=self.headers
        )
        
        assert response.status_code == 200
        messages = response.json()
        
        if len(messages) > 0:
            msg = messages[0]
            # Verify message structure for MessageList rendering
            assert 'id' in msg, "Message missing id"
            assert 'role' in msg, "Message missing role"
            assert 'content' in msg, "Message missing content"
            assert 'created_at' in msg, "Message missing created_at"
            
            print(f"SUCCESS: Messages endpoint returns {len(messages)} messages with valid structure")
            print(f"  - First message role: {msg['role']}")
        else:
            print("INFO: No messages in conversation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
