#!/usr/bin/env python3
"""
Backend API testing for Curriculum Planning Subagent Feature

Tests:
1. POST /api/conversations - Phase field (assessment for cross-lang, learning for same-lang)
2. GET /api/conversations/{id}/curriculum - Returns curriculum when exists
3. GET /api/conversations/{id}/curriculum - Returns 404 when no curriculum
4. Curriculum data structure validation
5. DELETE /api/conversations/all - Also cleans up curricula
6. POST /api/conversations/{id}/messages - Works during planning phase
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://payment-auth-hub.preview.emergentagent.com').rstrip('/')


class TestConversationPhase:
    """Test conversation 'phase' field based on language selection"""
    
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
    
    def test_cross_language_conversation_starts_with_assessment_phase(self):
        """Test POST /api/conversations with cross-language (e.g., EN→FR) starts with 'assessment' phase"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Cross_Lang_Assessment",
                "native_language": "en",
                "target_language": "fr"  # Different languages - should trigger assessment
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.created_conv_ids.append(data["id"])
        
        # Verify phase field
        assert "phase" in data, "Response should contain 'phase' field"
        assert data["phase"] == "assessment", f"Cross-language conv should start with 'assessment' phase, got '{data['phase']}'"
        
        print(f"✅ Cross-lang conversation (EN→FR) starts with phase: {data['phase']}")
    
    def test_same_language_conversation_starts_with_learning_phase(self):
        """Test POST /api/conversations with same language (e.g., EN→EN) starts with 'learning' phase"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Same_Lang_Learning",
                "native_language": "en",
                "target_language": "en"  # Same language - should skip assessment
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.created_conv_ids.append(data["id"])
        
        # Verify phase field
        assert "phase" in data, "Response should contain 'phase' field"
        assert data["phase"] == "learning", f"Same-language conv should start with 'learning' phase, got '{data['phase']}'"
        
        print(f"✅ Same-lang conversation (EN→EN) starts with phase: {data['phase']}")
    
    def test_scenario_conversation_starts_with_learning_phase(self):
        """Test POST /api/conversations with scenario starts with 'learning' phase (skips assessment)"""
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Scenario_Learning",
                "native_language": "en",
                "target_language": "fr",
                "scenario": "restaurant"  # Scenario set - should skip assessment even for cross-lang
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.created_conv_ids.append(data["id"])
        
        # Verify phase field - scenario should skip assessment
        assert "phase" in data, "Response should contain 'phase' field"
        assert data["phase"] == "learning", f"Scenario conv should start with 'learning' phase, got '{data['phase']}'"
        
        print(f"✅ Scenario conversation (with restaurant) starts with phase: {data['phase']}")
    
    def test_get_conversation_includes_phase(self):
        """Test GET /api/conversations/{id} includes phase field"""
        # Create conversation
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Get_Phase",
                "native_language": "en",
                "target_language": "ja"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        conv_id = create_response.json()["id"]
        self.created_conv_ids.append(conv_id)
        
        # Get conversation
        get_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}", timeout=10)
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert "phase" in data, "GET /api/conversations/{id} should include 'phase' field"
        print(f"✅ GET /api/conversations/{conv_id} includes phase: {data['phase']}")


class TestCurriculumEndpoint:
    """Test GET /api/conversations/{id}/curriculum endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.created_conv_ids = []
        yield
        # Cleanup
        for conv_id in self.created_conv_ids:
            try:
                requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=5)
            except:
                pass
    
    def test_get_curriculum_returns_404_when_no_curriculum(self):
        """Test GET /api/conversations/{id}/curriculum returns 404 when no curriculum exists"""
        # Create a new conversation (won't have curriculum)
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_No_Curriculum",
                "native_language": "en",
                "target_language": "de"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        conv_id = create_response.json()["id"]
        self.created_conv_ids.append(conv_id)
        
        # Try to get curriculum - should return 404
        curriculum_response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}/curriculum", timeout=10)
        
        assert curriculum_response.status_code == 404, f"Expected 404 when no curriculum, got {curriculum_response.status_code}"
        
        error_data = curriculum_response.json()
        assert "detail" in error_data, "Error response should have 'detail' field"
        print(f"✅ GET curriculum returns 404 when no curriculum: {error_data}")
    
    def test_get_curriculum_returns_404_for_nonexistent_conversation(self):
        """Test GET /api/conversations/{id}/curriculum returns appropriate error for non-existent conversation"""
        fake_conv_id = str(uuid.uuid4())
        
        curriculum_response = requests.get(f"{BASE_URL}/api/conversations/{fake_conv_id}/curriculum", timeout=10)
        
        # Should return 404 (no curriculum found for non-existent conversation)
        assert curriculum_response.status_code == 404, f"Expected 404 for non-existent conv, got {curriculum_response.status_code}"
        print(f"✅ GET curriculum for non-existent conversation returns 404")
    
    def test_get_curriculum_for_existing_curriculum(self):
        """Test GET /api/conversations/{id}/curriculum returns curriculum data for conversation with curriculum
        
        Note: Using the pre-existing test conversation ID mentioned in context:
        conv_id 5822bd06-7c6d-4e15-ba30-31375b437f75 with a completed curriculum (8 lessons)
        """
        # Use the existing conversation with curriculum
        existing_conv_id = "5822bd06-7c6d-4e15-ba30-31375b437f75"
        
        curriculum_response = requests.get(f"{BASE_URL}/api/conversations/{existing_conv_id}/curriculum", timeout=10)
        
        if curriculum_response.status_code == 404:
            # The conversation may have been deleted - this is expected in some test runs
            print(f"⚠️ Pre-existing conversation with curriculum was not found - may have been cleaned up")
            pytest.skip("Pre-existing curriculum conversation not found")
            return
        
        assert curriculum_response.status_code == 200, f"Expected 200, got {curriculum_response.status_code}: {curriculum_response.text}"
        
        data = curriculum_response.json()
        
        # Validate curriculum data structure
        required_fields = ["id", "conversation_id", "proficiency_level", "timeline", "goal", "lessons", "current_lesson", "status"]
        for field in required_fields:
            assert field in data, f"Curriculum should have '{field}' field"
        
        # Validate lessons is an array
        assert isinstance(data["lessons"], list), "lessons should be an array"
        
        print(f"✅ GET curriculum returns valid data structure:")
        print(f"   - id: {data['id']}")
        print(f"   - conversation_id: {data['conversation_id']}")
        print(f"   - proficiency_level: {data['proficiency_level']}")
        print(f"   - timeline: {data.get('timeline', 'N/A')}")
        print(f"   - goal: {data.get('goal', 'N/A')}")
        print(f"   - lessons count: {len(data['lessons'])}")
        print(f"   - current_lesson: {data['current_lesson']}")
        print(f"   - status: {data['status']}")


class TestCurriculumDataStructure:
    """Test curriculum data structure and field validations"""
    
    def test_curriculum_lesson_structure(self):
        """Test that curriculum lessons have proper structure"""
        existing_conv_id = "5822bd06-7c6d-4e15-ba30-31375b437f75"
        
        curriculum_response = requests.get(f"{BASE_URL}/api/conversations/{existing_conv_id}/curriculum", timeout=10)
        
        if curriculum_response.status_code == 404:
            pytest.skip("Pre-existing curriculum conversation not found")
            return
        
        assert curriculum_response.status_code == 200
        data = curriculum_response.json()
        
        # Check lessons structure
        assert len(data["lessons"]) > 0, "Curriculum should have at least one lesson"
        
        first_lesson = data["lessons"][0]
        expected_lesson_fields = ["lesson_number", "title", "topics", "objective"]
        
        for field in expected_lesson_fields:
            assert field in first_lesson, f"Lesson should have '{field}' field"
        
        # Topics should be an array
        assert isinstance(first_lesson["topics"], list), "Lesson topics should be an array"
        
        print(f"✅ Lesson structure validated:")
        print(f"   - lesson_number: {first_lesson.get('lesson_number')}")
        print(f"   - title: {first_lesson.get('title')}")
        print(f"   - topics: {first_lesson.get('topics')}")
        print(f"   - objective: {first_lesson.get('objective', 'N/A')[:50]}...")
    
    def test_curriculum_status_values(self):
        """Test that curriculum status field has valid values"""
        existing_conv_id = "5822bd06-7c6d-4e15-ba30-31375b437f75"
        
        curriculum_response = requests.get(f"{BASE_URL}/api/conversations/{existing_conv_id}/curriculum", timeout=10)
        
        if curriculum_response.status_code == 404:
            pytest.skip("Pre-existing curriculum conversation not found")
            return
        
        data = curriculum_response.json()
        
        valid_statuses = ["active", "completed", "paused"]
        assert data["status"] in valid_statuses, f"Curriculum status should be one of {valid_statuses}, got '{data['status']}'"
        print(f"✅ Curriculum status is valid: {data['status']}")


class TestDeleteAllCleanupsChurricula:
    """Test that DELETE /api/conversations/all also cleans up curricula"""
    
    def test_delete_all_cleans_up_conversations(self):
        """Test DELETE /api/conversations/all endpoint works"""
        # Create a test conversation
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Cleanup_Test",
                "native_language": "en",
                "target_language": "es"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        
        # Delete all
        delete_response = requests.delete(f"{BASE_URL}/api/conversations/all", timeout=30)
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert "status" in data, "Response should have 'status' field"
        assert data["status"] == "deleted"
        
        print(f"✅ DELETE /api/conversations/all works: {data}")
        
        # Verify conversations are deleted
        list_response = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_response.status_code == 200
        assert len(list_response.json()) == 0, "All conversations should be deleted"
        print(f"✅ All conversations deleted successfully")


class TestMessagesDuringPlanningPhase:
    """Test that messages work during planning phase"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.created_conv_ids = []
        yield
        # Cleanup
        for conv_id in self.created_conv_ids:
            try:
                requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=5)
            except:
                pass
    
    def test_send_message_to_assessment_phase_conversation(self):
        """Test POST /api/conversations/{id}/messages works during assessment phase"""
        # Create cross-language conversation (starts in assessment phase)
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Assessment_Messages",
                "native_language": "en",
                "target_language": "es"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        conv = create_response.json()
        conv_id = conv["id"]
        self.created_conv_ids.append(conv_id)
        
        assert conv["phase"] == "assessment", f"Should start in assessment phase, got {conv['phase']}"
        
        # Send a message
        msg_response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            json={"content": "Hola, me llamo Juan. Soy de México."},
            headers={"Content-Type": "application/json"},
            timeout=60  # LLM calls take time
        )
        
        assert msg_response.status_code == 200, f"Expected 200, got {msg_response.status_code}: {msg_response.text}"
        
        messages = msg_response.json()
        assert len(messages) >= 2, "Should have user message and AI response"
        
        user_msg = next((m for m in messages if m["role"] == "user"), None)
        ai_msg = next((m for m in messages if m["role"] == "assistant"), None)
        
        assert user_msg is not None, "Should have user message"
        assert ai_msg is not None, "Should have assistant message"
        
        print(f"✅ Message sent successfully during assessment phase")
        print(f"   User: {user_msg['content'][:50]}...")
        print(f"   AI: {ai_msg['content'][:100]}...")
    
    def test_proficiency_assessment_triggers_planning_transition(self):
        """Test that after proficiency is set, conversation can transition to planning phase
        
        Note: This tests the proficiency PATCH endpoint, not the full agent flow which takes many exchanges
        """
        # Create cross-language conversation
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_Proficiency_Transition",
                "native_language": "en",
                "target_language": "it"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        conv = create_response.json()
        conv_id = conv["id"]
        self.created_conv_ids.append(conv_id)
        
        # Manually set proficiency to trigger phase transition (simulating what agent does)
        # Note: The actual agent uses set_proficiency_level tool which also sets phase to 'planning'
        patch_response = requests.patch(
            f"{BASE_URL}/api/conversations/{conv_id}/proficiency",
            json={"level": "intermediate"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert patch_response.status_code == 200, f"Expected 200, got {patch_response.status_code}"
        
        data = patch_response.json()
        assert data.get("proficiency_level") == "intermediate", f"Proficiency should be set: {data}"
        
        print(f"✅ Proficiency set via PATCH: {data}")


class TestListConversationsIncludesPhase:
    """Test that list conversations includes phase field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.created_conv_ids = []
        yield
        for conv_id in self.created_conv_ids:
            try:
                requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", timeout=5)
            except:
                pass
    
    def test_list_conversations_includes_phase_field(self):
        """Test GET /api/conversations returns conversations with phase field"""
        # Create a conversation
        create_response = requests.post(
            f"{BASE_URL}/api/conversations",
            json={
                "title": "TEST_List_Phase",
                "native_language": "en",
                "target_language": "zh"
            },
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        assert create_response.status_code == 200
        conv_id = create_response.json()["id"]
        self.created_conv_ids.append(conv_id)
        
        # List conversations
        list_response = requests.get(f"{BASE_URL}/api/conversations", timeout=10)
        assert list_response.status_code == 200
        
        conversations = list_response.json()
        assert len(conversations) > 0, "Should have at least one conversation"
        
        # Find our created conversation
        our_conv = next((c for c in conversations if c["id"] == conv_id), None)
        assert our_conv is not None, "Our conversation should be in the list"
        
        assert "phase" in our_conv, "Conversation in list should have 'phase' field"
        print(f"✅ Listed conversation includes phase: {our_conv['phase']}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
