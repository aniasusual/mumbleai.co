"""
Test cases for TTS endpoint used by karaoke feature.
Tests the /api/tts endpoint that provides audio for word-by-word karaoke highlighting.
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTTSEndpoint:
    """TTS endpoint tests for karaoke feature"""
    
    def test_tts_returns_audio_base64(self):
        """Test that TTS endpoint returns audio_base64 field"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Hello world"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "audio_base64" in data
        assert isinstance(data["audio_base64"], str)
        assert len(data["audio_base64"]) > 100  # Should have substantial audio data
    
    def test_tts_audio_is_valid_base64(self):
        """Test that returned audio is valid base64"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Buenos dias"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Try to decode the base64
        try:
            decoded = base64.b64decode(data["audio_base64"])
            assert len(decoded) > 0
            # Check for MP3 magic bytes or other audio headers
            print(f"Decoded audio size: {len(decoded)} bytes")
        except Exception as e:
            pytest.fail(f"Failed to decode base64 audio: {e}")
    
    def test_tts_with_spanish_text(self):
        """Test TTS with Spanish characters"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "¿Cómo estás? Muy bien, gracias."},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "audio_base64" in data
        assert len(data["audio_base64"]) > 100
    
    def test_tts_with_longer_text(self):
        """Test TTS with longer text for karaoke (longer messages take more time)"""
        long_text = "Hello, I'm LinguaFlow. I'll help you practice Spanish in a chill, real-life way. Let's get started!"
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": long_text},
            headers={"Content-Type": "application/json"},
            timeout=30  # Allow more time for longer TTS
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "audio_base64" in data
        # Longer text should produce more audio data
        assert len(data["audio_base64"]) > 500
    
    def test_tts_empty_text_handling(self):
        """Test TTS with empty or minimal text"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": ""},
            headers={"Content-Type": "application/json"}
        )
        
        # Should either return 400 error or handle gracefully
        # Acceptable: 200 with audio, or 400/422 validation error
        assert response.status_code in [200, 400, 422]
    
    def test_tts_content_type(self):
        """Test that TTS returns proper JSON content type"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Test"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        assert "application/json" in response.headers.get("Content-Type", "")


class TestConversationMessages:
    """Test conversation endpoints that support karaoke playback"""
    
    @pytest.fixture
    def conversation_id(self):
        """Get or create a test conversation"""
        # First try to list existing conversations
        response = requests.get(f"{BASE_URL}/api/conversations")
        if response.status_code == 200:
            conversations = response.json()
            if len(conversations) > 0:
                return conversations[0]["id"]
        
        # Create new conversation if needed
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"native_language": "en", "target_language": "es"}
        )
        if response.status_code in [200, 201]:
            return response.json()["id"]
        
        pytest.skip("Could not get or create conversation")
    
    def test_get_messages_for_karaoke(self, conversation_id):
        """Test getting messages that can be played with karaoke"""
        response = requests.get(f"{BASE_URL}/api/conversations/{conversation_id}/messages")
        
        assert response.status_code == 200
        messages = response.json()
        
        # Each message should have id, role, content (needed for karaoke)
        for msg in messages:
            assert "id" in msg
            assert "role" in msg
            assert "content" in msg
            
            # Only assistant messages can be played with karaoke
            if msg["role"] == "assistant":
                assert isinstance(msg["content"], str)
                assert len(msg["content"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
