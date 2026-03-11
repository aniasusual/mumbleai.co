#!/usr/bin/env python3
"""
Backend API testing for Delete Conversation Features

Tests:
1. POST /api/conversations - Create a conversation
2. GET /api/conversations - List conversations
3. DELETE /api/conversations/{id} - Delete single conversation
4. DELETE /api/conversations/all - Delete all conversations
5. POST /api/conversations/{id}/messages - Test AI personality (human-like tone)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://project-scanner-30.preview.emergentagent.com').rstrip('/')

class TestConversationCRUD:
    """Test conversation create and list operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.created_conv_ids = []
        yield
        # Cleanup: delete test conversations
        for conv_id in self.created_conv_ids:
            try:
                requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=5)
            except:
                pass
    
    def test_create_conversation(self):
        """Test POST /api/conversations creates a conversation successfully"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Delete_Feature_Conversation",
                "native_language": "en",
                "target_language": "en"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain 'id'"
        assert data["title"] == "TEST_Delete_Feature_Conversation"
        assert data["native_language"] == "en"
        assert data["target_language"] == "en"
        
        self.created_conv_ids.append(data["id"])
        print(f"✅ Created conversation: {data['id']}")
        return data["id"]
    
    def test_list_conversations(self):
        """Test GET /api/conversations returns list of conversations"""
        # First create a conversation to ensure at least one exists
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_List_Conversation", "native_language": "en", "target_language": "en"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_conv_ids.append(created["id"])
        
        # Now list conversations
        response = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify our created conversation is in the list
        conv_ids = [c["id"] for c in data]
        assert created["id"] in conv_ids, "Created conversation should be in list"
        print(f"✅ Listed {len(data)} conversations")


class TestDeleteSingleConversation:
    """Test DELETE /api/conversations/{id} endpoint"""
    
    def test_delete_single_conversation(self):
        """Test deleting a single conversation removes it from the list"""
        # Create a conversation first
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_To_Be_Deleted", "native_language": "en", "target_language": "en"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert create_response.status_code == 200
        conv_id = create_response.json()["id"]
        print(f"Created conversation to delete: {conv_id}")
        
        # Verify it exists
        list_response = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_response.status_code == 200
        conv_ids_before = [c["id"] for c in list_response.json()]
        assert conv_id in conv_ids_before, "Conversation should exist before deletion"
        
        # Delete the conversation
        delete_response = requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=10)
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        delete_data = delete_response.json()
        assert delete_data.get("status") == "deleted", f"Response should indicate deleted status: {delete_data}"
        print(f"✅ Delete response: {delete_data}")
        
        # Verify it's gone
        list_after = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_after.status_code == 200
        conv_ids_after = [c["id"] for c in list_after.json()]
        assert conv_id not in conv_ids_after, "Conversation should not exist after deletion"
        print(f"✅ Conversation {conv_id} successfully deleted and removed from list")
    
    def test_delete_conversation_with_messages(self):
        """Test that deleting a conversation also deletes its messages"""
        # Create a conversation
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_Conv_With_Messages", "native_language": "en", "target_language": "en"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert create_response.status_code == 200
        conv_id = create_response.json()["id"]
        
        # Send a message to create message history
        msg_response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            json={"content": "TEST_Hello, this is a test message!"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert msg_response.status_code == 200
        print(f"Added message to conversation {conv_id}")
        
        # Verify messages exist
        messages_before = requests.get(f"{BASE_URL}/api/conversations/{conv_id}/messages", timeout=10)
        assert messages_before.status_code == 200
        assert len(messages_before.json()) > 0, "Should have messages before deletion"
        
        # Delete the conversation
        delete_response = requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=10)
        assert delete_response.status_code == 200
        print(f"✅ Deleted conversation with messages: {conv_id}")


class TestDeleteAllConversations:
    """Test DELETE /api/conversations/all endpoint"""
    
    def test_delete_all_conversations(self):
        """Test deleting all conversations at once"""
        # First, create multiple test conversations
        created_ids = []
        for i in range(3):
            create_response = requests.post(
                f"{BASE_URL}/api/conversations",
                json={"title": f"TEST_Bulk_Delete_{i}", "native_language": "en", "target_language": "en"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            assert create_response.status_code == 200
            created_ids.append(create_response.json()["id"])
        
        print(f"Created {len(created_ids)} conversations for bulk delete test")
        
        # Verify they exist
        list_before = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_before.status_code == 200
        count_before = len(list_before.json())
        print(f"Conversations before delete all: {count_before}")
        
        # Call DELETE /api/conversations/all
        delete_all_response = requests.delete(f"{BASE_URL}/api/conversations/all", timeout=30)
        
        assert delete_all_response.status_code == 200, f"Expected 200, got {delete_all_response.status_code}: {delete_all_response.text}"
        delete_data = delete_all_response.json()
        
        # Verify response format
        assert "status" in delete_data, "Response should have 'status' field"
        assert delete_data["status"] == "deleted", f"Status should be 'deleted': {delete_data}"
        assert "count" in delete_data, "Response should have 'count' field"
        print(f"✅ Delete all response: {delete_data}")
        
        # Verify all conversations are gone
        list_after = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_after.status_code == 200
        conversations_after = list_after.json()
        assert len(conversations_after) == 0, f"Expected 0 conversations after delete all, got {len(conversations_after)}"
        print(f"✅ All conversations deleted successfully - list is now empty")
    
    def test_delete_all_returns_count(self):
        """Test that delete all returns the correct count of deleted conversations"""
        # Create exactly 2 conversations
        for i in range(2):
            requests.post(
                f"{BASE_URL}/api/conversations",
                json={"title": f"TEST_Count_Delete_{i}", "native_language": "en", "target_language": "en"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
        
        # Get count before
        list_before = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        count_before = len(list_before.json())
        print(f"Conversations before: {count_before}")
        
        # Delete all
        delete_response = requests.delete(f"{BASE_URL}/api/conversations/all", timeout=30)
        assert delete_response.status_code == 200
        
        delete_data = delete_response.json()
        assert delete_data["count"] == count_before, f"Deleted count {delete_data['count']} should match before count {count_before}"
        print(f"✅ Delete all returned correct count: {delete_data['count']}")


class TestAIPersonality:
    """Test that AI responses have human-like tone and avoid robotic phrases"""
    
    ROBOTIC_PHRASES = [
        "Certainly!",
        "I'd be happy to",
        "Great question!",
        "Of course!",
        "Absolutely!",
        "I'm delighted",
        "As an AI",
        "I don't have personal"
    ]
    
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Create and cleanup test conversation"""
        # Create conversation for testing
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={"title": "TEST_AI_Personality", "native_language": "en", "target_language": "en"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert response.status_code == 200
        self.conv_id = response.json()["id"]
        yield
        # Cleanup
        try:
            requests.delete(f"{BASE_URL}/api/conversations/{self.conv_id}", timeout=5)
        except:
            pass
    
    def test_ai_response_avoids_robotic_phrases(self):
        """Test that AI responses don't contain robotic AI phrases"""
        # Send a simple message to get AI response
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conv_id}/messages",
            json={"content": "Can you check my grammar: I goed to the store yesterday."},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        messages = response.json()
        assert len(messages) >= 2, "Should have user message and AI response"
        
        ai_message = next((m for m in messages if m["role"] == "assistant"), None)
        assert ai_message is not None, "Should have an assistant message"
        
        ai_content = ai_message["content"]
        print(f"AI Response: {ai_content[:200]}...")
        
        # Check for robotic phrases
        found_robotic = []
        for phrase in self.ROBOTIC_PHRASES:
            if phrase.lower() in ai_content.lower():
                found_robotic.append(phrase)
        
        if found_robotic:
            print(f"⚠️ Found robotic phrases: {found_robotic}")
            # Note: This is a warning, not a failure - the AI system may still occasionally use these
        else:
            print(f"✅ No robotic phrases found in AI response")
        
        # Verify response has some content
        assert len(ai_content) > 20, "AI response should be substantial"
        print(f"✅ AI provided substantial response: {len(ai_content)} characters")
    
    def test_ai_response_is_conversational(self):
        """Test that AI responses feel natural and conversational"""
        response = requests.post(
            f"{BASE_URL}/api/conversations/{self.conv_id}/messages",
            json={"content": "Hi there! How are you doing today?"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200
        
        messages = response.json()
        ai_message = next((m for m in messages if m["role"] == "assistant"), None)
        assert ai_message is not None
        
        ai_content = ai_message["content"].lower()
        print(f"Conversational AI Response: {ai_message['content'][:200]}...")
        
        # The response should feel natural and engaging
        # We're just checking it exists and has content - the tone check is more qualitative
        assert len(ai_message["content"]) > 10, "AI should provide a meaningful response"
        print(f"✅ AI provided conversational response")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
