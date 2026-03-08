"""
Test proficiency-aware system prompts for all 4 agents:
- Tutor: build_proficiency_block() function
- Planner: proficiency_curriculum_guide in _build_system_prompt()
- Testing Agent: proficiency_test_guide in _build_system_prompt()
- Revision Agent: proficiency_revision_guide in _build_system_prompt()

Tests verify that proficiency-specific instructions are correctly injected
for beginner, intermediate, and advanced levels.
"""

import pytest
import requests
import os
import sys

# Add backend to path for direct module imports
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


# ============================================
# UNIT TESTS: build_proficiency_block() function
# ============================================

class TestBuildProficiencyBlock:
    """Unit tests for the build_proficiency_block function in prompts.py"""
    
    def test_build_proficiency_block_returns_empty_for_none_level(self):
        """Should return empty string when level is None"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block(None, "English", "French", False)
        assert result == ""
    
    def test_build_proficiency_block_returns_empty_for_empty_level(self):
        """Should return empty string when level is empty string"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("", "English", "French", False)
        assert result == ""
    
    def test_beginner_different_language_has_80_20_mix(self):
        """Beginner with different languages should have 80% native 20% target ratio"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "80% English" in result
        assert "20% French" in result
        assert "BEGINNER" in result
    
    def test_beginner_same_language_no_mix_ratio(self):
        """Beginner with same language should NOT have language mix ratio"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "English", True)
        assert "80%" not in result
        assert "20%" not in result
        assert "BEGINNER" in result
    
    def test_intermediate_different_language_has_50_50_mix(self):
        """Intermediate with different languages should have 50% 50% ratio"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("intermediate", "English", "Spanish", False)
        assert "50% English" in result
        assert "50% Spanish" in result
        assert "INTERMEDIATE" in result
    
    def test_intermediate_same_language_no_mix_ratio(self):
        """Intermediate with same language should NOT have language mix ratio"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("intermediate", "English", "English", True)
        assert "50%" not in result
        assert "INTERMEDIATE" in result
    
    def test_advanced_different_language_has_90_plus_target(self):
        """Advanced with different languages should have 90%+ target language"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("advanced", "English", "Japanese", False)
        assert "90%+" in result or "90%" in result
        assert "Japanese" in result
        assert "ADVANCED" in result
    
    def test_advanced_same_language_no_mix_ratio(self):
        """Advanced with same language should NOT have language mix ratio"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("advanced", "English", "English", True)
        assert "90%" not in result
        assert "ADVANCED" in result
    
    def test_beginner_has_word_introductions_section(self):
        """Beginner prompt should have detailed word introduction instructions"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "Word Introductions" in result
        assert "phonetic" in result.lower()
    
    def test_beginner_has_pronunciation_section(self):
        """Beginner prompt should have pronunciation section"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "Pronunciation" in result
    
    def test_beginner_has_scaffolding_section(self):
        """Beginner prompt should have scaffolding section"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "Scaffolding" in result or "Pacing" in result
    
    def test_beginner_has_grammar_section(self):
        """Beginner prompt should have grammar section"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "Grammar" in result
    
    def test_beginner_has_encouragement_section(self):
        """Beginner prompt should have encouragement section"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("beginner", "English", "French", False)
        assert "Encouragement" in result
    
    def test_intermediate_has_open_ended_prompts(self):
        """Intermediate prompt should mention open-ended prompts"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("intermediate", "English", "Spanish", False)
        assert "open-ended" in result.lower()
    
    def test_advanced_has_peer_treatment(self):
        """Advanced prompt should mention treating user as peer"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("advanced", "English", "Japanese", False)
        assert "peer" in result.lower()
    
    def test_unknown_level_returns_empty(self):
        """Unknown proficiency level should return empty string"""
        from agents.prompts import build_proficiency_block
        result = build_proficiency_block("expert", "English", "French", False)
        assert result == ""


# ============================================
# UNIT TESTS: Tutor Agent system prompt integration
# ============================================

class TestTutorAgentProficiencyIntegration:
    """Tests that LanguageTutorAgent correctly integrates proficiency block"""
    
    def test_tutor_agent_includes_proficiency_block_for_beginner(self):
        """Tutor agent system prompt should include beginner block when proficiency is beginner"""
        from agents.tutor import LanguageTutorAgent
        agent = LanguageTutorAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level="beginner"
        )
        assert "BEGINNER" in agent.system_prompt
        assert "80%" in agent.system_prompt
    
    def test_tutor_agent_includes_proficiency_block_for_intermediate(self):
        """Tutor agent system prompt should include intermediate block"""
        from agents.tutor import LanguageTutorAgent
        agent = LanguageTutorAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="es",
            proficiency_level="intermediate"
        )
        assert "INTERMEDIATE" in agent.system_prompt
        assert "50%" in agent.system_prompt
    
    def test_tutor_agent_includes_proficiency_block_for_advanced(self):
        """Tutor agent system prompt should include advanced block"""
        from agents.tutor import LanguageTutorAgent
        agent = LanguageTutorAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="ja",
            proficiency_level="advanced"
        )
        assert "ADVANCED" in agent.system_prompt
        assert "90%" in agent.system_prompt
    
    def test_tutor_agent_no_proficiency_block_when_none(self):
        """Tutor agent should not have proficiency block when level is None"""
        from agents.tutor import LanguageTutorAgent
        agent = LanguageTutorAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level=None
        )
        assert "## Proficiency: BEGINNER" not in agent.system_prompt
        assert "## Proficiency: INTERMEDIATE" not in agent.system_prompt
        assert "## Proficiency: ADVANCED" not in agent.system_prompt
    
    def test_tutor_agent_same_language_beginner(self):
        """Tutor agent with same language should not have language mix ratios"""
        from agents.tutor import LanguageTutorAgent
        agent = LanguageTutorAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="en",
            proficiency_level="beginner"
        )
        assert "BEGINNER" in agent.system_prompt
        assert "80%" not in agent.system_prompt  # No language mix for same language


# ============================================
# UNIT TESTS: Planner Agent proficiency curriculum guide
# ============================================

class TestPlannerAgentProficiencyCurriculumGuide:
    """Tests that CurriculumPlannerAgent includes proficiency curriculum guide"""
    
    def test_planner_beginner_has_curriculum_guide(self):
        """Planner for beginner should have curriculum design guide"""
        from agents.planner import CurriculumPlannerAgent
        agent = CurriculumPlannerAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level="beginner"
        )
        assert "Curriculum Design for BEGINNER" in agent.system_prompt
        assert "survival essentials" in agent.system_prompt.lower()
    
    def test_planner_intermediate_has_curriculum_guide(self):
        """Planner for intermediate should have curriculum design guide"""
        from agents.planner import CurriculumPlannerAgent
        agent = CurriculumPlannerAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="es",
            proficiency_level="intermediate"
        )
        assert "Curriculum Design for INTERMEDIATE" in agent.system_prompt
        assert "thematic lessons" in agent.system_prompt.lower()
    
    def test_planner_advanced_has_curriculum_guide(self):
        """Planner for advanced should have curriculum design guide"""
        from agents.planner import CurriculumPlannerAgent
        agent = CurriculumPlannerAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="ja",
            proficiency_level="advanced"
        )
        assert "Curriculum Design for ADVANCED" in agent.system_prompt
        assert "FEWER but DEEPER" in agent.system_prompt
    
    def test_planner_unknown_level_no_curriculum_guide(self):
        """Planner with unknown level should not have proficiency-specific guide"""
        from agents.planner import CurriculumPlannerAgent
        agent = CurriculumPlannerAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level=None
        )
        assert "Curriculum Design for BEGINNER" not in agent.system_prompt
        assert "Curriculum Design for INTERMEDIATE" not in agent.system_prompt
        assert "Curriculum Design for ADVANCED" not in agent.system_prompt


# ============================================
# UNIT TESTS: Testing Agent proficiency test guide
# ============================================

class TestTestingAgentProficiencyTestGuide:
    """Tests that TestingAgent includes proficiency test guide"""
    
    def test_testing_agent_beginner_has_test_guide(self):
        """Testing agent for beginner should have test style guide"""
        from agents.testing_agent import TestingAgent
        agent = TestingAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level="beginner",
            conversation_id="test-conv",
            db=None
        )
        assert "Testing Style for BEGINNER" in agent.system_prompt
        assert "multiple-choice" in agent.system_prompt.lower()
    
    def test_testing_agent_intermediate_has_test_guide(self):
        """Testing agent for intermediate should have test style guide"""
        from agents.testing_agent import TestingAgent
        agent = TestingAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="es",
            proficiency_level="intermediate",
            conversation_id="test-conv",
            db=None
        )
        assert "Testing Style for INTERMEDIATE" in agent.system_prompt
        assert "fill-in-the-blank" in agent.system_prompt.lower()
    
    def test_testing_agent_advanced_has_test_guide(self):
        """Testing agent for advanced should have test style guide"""
        from agents.testing_agent import TestingAgent
        agent = TestingAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="ja",
            proficiency_level="advanced",
            conversation_id="test-conv",
            db=None
        )
        assert "Testing Style for ADVANCED" in agent.system_prompt
        assert "open-ended" in agent.system_prompt.lower()
    
    def test_testing_agent_unknown_level_no_test_guide(self):
        """Testing agent with unknown level should not have proficiency-specific guide"""
        from agents.testing_agent import TestingAgent
        agent = TestingAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level=None,
            conversation_id="test-conv",
            db=None
        )
        assert "Testing Style for BEGINNER" not in agent.system_prompt
        assert "Testing Style for INTERMEDIATE" not in agent.system_prompt
        assert "Testing Style for ADVANCED" not in agent.system_prompt


# ============================================
# UNIT TESTS: Revision Agent proficiency revision guide
# ============================================

class TestRevisionAgentProficiencyRevisionGuide:
    """Tests that RevisionAgent includes proficiency revision guide"""
    
    def test_revision_agent_beginner_has_revision_guide(self):
        """Revision agent for beginner should have revision style guide"""
        from agents.revision_agent import RevisionAgent
        agent = RevisionAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level="beginner",
            conversation_id="test-conv",
            db=None
        )
        assert "Revision Style for BEGINNER" in agent.system_prompt
        assert "mnemonic" in agent.system_prompt.lower()
    
    def test_revision_agent_intermediate_has_revision_guide(self):
        """Revision agent for intermediate should have revision style guide"""
        from agents.revision_agent import RevisionAgent
        agent = RevisionAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="es",
            proficiency_level="intermediate",
            conversation_id="test-conv",
            db=None
        )
        assert "Revision Style for INTERMEDIATE" in agent.system_prompt
        assert "different angle" in agent.system_prompt.lower()
    
    def test_revision_agent_advanced_has_revision_guide(self):
        """Revision agent for advanced should have revision style guide"""
        from agents.revision_agent import RevisionAgent
        agent = RevisionAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="ja",
            proficiency_level="advanced",
            conversation_id="test-conv",
            db=None
        )
        assert "Revision Style for ADVANCED" in agent.system_prompt
        assert "WHY" in agent.system_prompt
    
    def test_revision_agent_unknown_level_no_revision_guide(self):
        """Revision agent with unknown level should not have proficiency-specific guide"""
        from agents.revision_agent import RevisionAgent
        agent = RevisionAgent(
            api_key="test-key",
            session_id="test-session",
            native_language="en",
            target_language="fr",
            proficiency_level=None,
            conversation_id="test-conv",
            db=None
        )
        assert "Revision Style for BEGINNER" not in agent.system_prompt
        assert "Revision Style for INTERMEDIATE" not in agent.system_prompt
        assert "Revision Style for ADVANCED" not in agent.system_prompt


# ============================================
# API TESTS: Backend endpoints
# ============================================

class TestBackendAPIHealth:
    """Basic API health checks"""
    
    def test_backend_health_check(self):
        """Backend should be running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
    
    def test_auth_login(self):
        """Should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data


class TestConversationCreationAndProficiency:
    """Test conversation creation and proficiency level saving"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Login failed")
    
    def test_create_conversation_success(self, auth_token):
        """Should create conversation and generate welcome message"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "fr"
        }, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["native_language"] == "en"
        assert data["target_language"] == "fr"
        assert data["proficiency_level"] is None  # Starts as None
        
        # Cleanup
        conv_id = data["id"]
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)
    
    def test_set_proficiency_level_beginner(self, auth_token):
        """Should set proficiency level to beginner"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "fr"
        }, headers=headers)
        conv_id = response.json()["id"]
        
        # Set proficiency
        response = requests.patch(
            f"{BASE_URL}/api/conversations/{conv_id}/proficiency",
            json={"level": "beginner"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["proficiency_level"] == "beginner"
        
        # Verify it persisted
        response = requests.get(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)
        assert response.json()["proficiency_level"] == "beginner"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)
    
    def test_set_proficiency_level_intermediate(self, auth_token):
        """Should set proficiency level to intermediate"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "es"
        }, headers=headers)
        conv_id = response.json()["id"]
        
        # Set proficiency
        response = requests.patch(
            f"{BASE_URL}/api/conversations/{conv_id}/proficiency",
            json={"level": "intermediate"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["proficiency_level"] == "intermediate"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)
    
    def test_set_proficiency_level_advanced(self, auth_token):
        """Should set proficiency level to advanced"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "ja"
        }, headers=headers)
        conv_id = response.json()["id"]
        
        # Set proficiency
        response = requests.patch(
            f"{BASE_URL}/api/conversations/{conv_id}/proficiency",
            json={"level": "advanced"},
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["proficiency_level"] == "advanced"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)
    
    def test_set_proficiency_level_invalid_defaults_to_beginner(self, auth_token):
        """Invalid proficiency level should default to beginner"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "fr"
        }, headers=headers)
        conv_id = response.json()["id"]
        
        # Set invalid proficiency
        response = requests.patch(
            f"{BASE_URL}/api/conversations/{conv_id}/proficiency",
            json={"level": "expert"},  # Invalid
            headers=headers
        )
        assert response.status_code == 200
        assert response.json()["proficiency_level"] == "beginner"  # Defaults to beginner
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)


class TestMessageStreamEndpoint:
    """Test SSE message streaming endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "subtest2@test.com",
            "password": "password123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Login failed")
    
    def test_message_stream_returns_sse(self, auth_token):
        """Message stream should return SSE response"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "fr"
        }, headers=headers)
        conv_id = response.json()["id"]
        
        # Send message via stream endpoint
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Hello, I'm a beginner"},
            headers=headers,
            stream=True,
            timeout=60
        )
        
        # Should return 200 with SSE content type
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        
        # Read some of the stream to verify it's working
        events = []
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                events.append(line)
                # Break after first few events to avoid timeout
                if len(events) >= 3 or '"type": "done"' in line:
                    break
        
        assert len(events) > 0, "Should receive at least one SSE event"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/conversations/{conv_id}", headers=headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
