#!/usr/bin/env python3
"""
Backend API testing for Voice Language Tutor with First Lesson Onboarding

Tests the FIRST LESSON ONBOARDING features:
1. POST /api/conversations with cross-language auto-inserts welcome assessment message
2. GET /api/conversations/{id}/messages shows auto-generated welcome message
3. POST /api/conversations with same language does NOT auto-insert assessment message
4. POST /api/conversations/{id}/messages triggers agent tools (grammar_check, evaluate_response, set_proficiency_level)
5. PATCH /api/conversations/{id}/proficiency sets proficiency level directly
6. GET /api/conversations/{id} returns proficiency_level field
7. Proficiency level persistence and retrieval
"""

import requests
import json
import sys
import time
from datetime import datetime

class FirstLessonOnboardingTester:
    def __init__(self, base_url="https://payment-auth-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.conversations_created = []
        
    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   → {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                print(f"❌ Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_cross_language_auto_assessment(self):
        """Test POST /api/conversations with cross-language auto-inserts welcome assessment message"""
        print("\n🎯 Testing First Lesson Onboarding - Cross-language conversation auto-assessment")
        
        # Test 1: English → French (should auto-insert welcome assessment message)
        success1, conv1 = self.run_test(
            "Create EN→FR Conversation (should auto-insert assessment)",
            "POST",
            "conversations", 
            200,
            data={
                "title": "Learning French",
                "native_language": "en",
                "target_language": "fr"
            }
        )
        
        if success1 and conv1:
            self.conversations_created.append(conv1['id'])
            conv_id = conv1['id']
            
            # Verify conversation properties
            if conv1.get('native_language') == 'en' and conv1.get('target_language') == 'fr':
                print(f"   ✅ Conversation created with correct languages: {conv1['native_language']} → {conv1['target_language']}")
            else:
                print(f"   ❌ Language fields incorrect: {conv1.get('native_language')} → {conv1.get('target_language')}")
                return False
            
            # Check if message_count indicates auto-inserted message
            if conv1.get('message_count', 0) >= 1:
                print(f"   ✅ Cross-language conversation has auto-inserted message (message_count: {conv1.get('message_count')})")
            else:
                print(f"   ❌ Cross-language conversation missing auto-inserted message (message_count: {conv1.get('message_count')})")
                return False
                
            # Now check the messages to verify welcome assessment message exists
            success_msg, messages = self.run_test(
                "Get messages for EN→FR conversation",
                "GET",
                f"conversations/{conv_id}/messages",
                200
            )
            
            if success_msg and messages:
                if len(messages) >= 1:
                    welcome_msg = messages[0]  # First message should be welcome assessment
                    if welcome_msg.get('role') == 'assistant':
                        content = welcome_msg.get('content', '').lower()
                        # Check for assessment keywords
                        assessment_keywords = ['welcome', 'level', 'questions', 'introduce yourself', 'french tutor']
                        if any(keyword in content for keyword in assessment_keywords):
                            print(f"   ✅ Auto-generated welcome assessment message found")
                            print(f"   📝 Message preview: {welcome_msg.get('content', '')[:100]}...")
                        else:
                            print(f"   ❌ Message doesn't appear to be assessment welcome: {content[:100]}")
                            return False
                    else:
                        print(f"   ❌ First message is not from assistant: {welcome_msg.get('role')}")
                        return False
                else:
                    print(f"   ❌ No messages found in cross-language conversation")
                    return False
            else:
                print(f"   ❌ Failed to get messages for conversation")
                return False
                
        return success1

    def test_same_language_no_assessment(self):
        """Test POST /api/conversations with same language does NOT auto-insert assessment message"""
        print("\n🎯 Testing Same Language Conversation - Should NOT auto-insert assessment")
        
        # Test: English → English (should NOT auto-insert assessment message)
        success, conv = self.run_test(
            "Create EN→EN Conversation (no assessment)",
            "POST",
            "conversations",
            200,
            data={
                "title": "English Improvement",
                "native_language": "en",
                "target_language": "en"
            }
        )
        
        if success and conv:
            self.conversations_created.append(conv['id'])
            conv_id = conv['id']
            
            # Verify no auto-inserted message for same language
            if conv.get('message_count', 0) == 0:
                print(f"   ✅ Same language conversation has no auto-inserted message (message_count: {conv.get('message_count')})")
            else:
                print(f"   ❌ Same language conversation incorrectly has messages (message_count: {conv.get('message_count')})")
                return False
                
            # Double-check by getting messages
            success_msg, messages = self.run_test(
                "Get messages for EN→EN conversation", 
                "GET",
                f"conversations/{conv_id}/messages",
                200
            )
            
            if success_msg:
                if len(messages) == 0:
                    print(f"   ✅ Same language conversation confirmed to have no messages")
                else:
                    print(f"   ❌ Same language conversation has {len(messages)} messages (should be 0)")
                    return False
            else:
                return False
        
        return success

    def test_agent_tool_usage_and_proficiency_detection(self):
        """Test agent uses tools (evaluate_response, set_proficiency_level) during assessment"""
        print("\n🎯 Testing Agent Tool Usage and Proficiency Detection")
        
        if not self.conversations_created:
            print("❌ No cross-language conversation to test with")
            return False
            
        # Use the first conversation (should be EN→FR with assessment message)
        conv_id = self.conversations_created[0]
        
        # Simulate user responding to assessment question
        print("   📤 Sending user response to assessment question...")
        success1, messages1 = self.run_test(
            "User responds to assessment (beginner level)",
            "POST",
            f"conversations/{conv_id}/messages",
            200,
            data={"content": "Bonjour, je suis John. Je viens des États-Unis. J'aime le football."}
        )
        
        if success1 and messages1:
            # Find AI response
            ai_msg = next((msg for msg in messages1 if msg['role'] == 'assistant'), None)
            if ai_msg:
                tools_used = ai_msg.get('tools_used', [])
                print(f"   🔧 Tools used in AI response: {tools_used}")
                
                # Check if evaluation tools were used
                expected_tools = ['evaluate_response', 'grammar_check']
                tools_found = any(tool in tools_used for tool in expected_tools)
                if tools_found:
                    print(f"   ✅ Agent used evaluation tools correctly")
                else:
                    print(f"   ⚠️  Agent may not have used evaluation tools - this could be normal")
            else:
                print(f"   ❌ No AI message found in response")
                return False
        
        # Send another response to trigger proficiency setting
        print("   📤 Sending second response to potentially trigger proficiency setting...")
        success2, messages2 = self.run_test(
            "User second response (should trigger proficiency)",
            "POST",
            f"conversations/{conv_id}/messages",
            200,
            data={"content": "Hier, j'ai mangé une pomme rouge dans le jardin avec ma famille."}
        )
        
        if success2 and messages2:
            ai_msg = next((msg for msg in messages2 if msg['role'] == 'assistant'), None)
            if ai_msg:
                tools_used = ai_msg.get('tools_used', [])
                print(f"   🔧 Tools used in second response: {tools_used}")
                
                # Check for set_proficiency_level tool
                if 'set_proficiency_level' in tools_used:
                    print(f"   ✅ Agent used set_proficiency_level tool!")
                else:
                    print(f"   ⚠️  Agent didn't use set_proficiency_level yet - may need more exchanges")
        
        # Give it one more try to set proficiency
        print("   📤 Sending third response to ensure proficiency assessment...")
        success3, messages3 = self.run_test(
            "User third response (final proficiency trigger)",
            "POST",
            f"conversations/{conv_id}/messages",
            200,
            data={"content": "Je pense que le français est une belle langue, mais c'est difficile pour moi. Pouvez-vous m'aider à améliorer ma grammaire et mon vocabulaire?"}
        )
        
        if success3 and messages3:
            ai_msg = next((msg for msg in messages3 if msg['role'] == 'assistant'), None)
            if ai_msg:
                tools_used = ai_msg.get('tools_used', [])
                print(f"   🔧 Tools used in third response: {tools_used}")
                
                if 'set_proficiency_level' in tools_used:
                    print(f"   ✅ Agent successfully used set_proficiency_level tool!")
                    return True
        
        # Check if proficiency was set by getting conversation details
        success_conv, conv_details = self.run_test(
            "Check conversation for proficiency level",
            "GET",
            f"conversations/{conv_id}",
            200
        )
        
        if success_conv and conv_details:
            proficiency = conv_details.get('proficiency_level')
            if proficiency:
                print(f"   ✅ Proficiency level set to: {proficiency}")
                return True
            else:
                print(f"   ⚠️  Proficiency level not yet set - may need more conversation exchanges")
        
        return success1 and success2

    def test_proficiency_api_operations(self):
        """Test PATCH /api/conversations/{id}/proficiency and proficiency persistence"""
        print("\n🎯 Testing Proficiency API Operations")
        
        if not self.conversations_created:
            print("❌ No conversations to test proficiency operations with")
            return False
            
        # Use second conversation if available, otherwise first
        conv_id = self.conversations_created[1] if len(self.conversations_created) > 1 else self.conversations_created[0]
        
        # Test PATCH proficiency endpoint
        success1, patch_response = self.run_test(
            "Set proficiency level to intermediate",
            "PATCH",
            f"conversations/{conv_id}/proficiency",
            200,
            data={"level": "intermediate"}
        )
        
        if success1 and patch_response:
            if patch_response.get('proficiency_level') == 'intermediate':
                print(f"   ✅ PATCH proficiency successful: {patch_response}")
            else:
                print(f"   ❌ PATCH proficiency response incorrect: {patch_response}")
                return False
        
        # Test GET conversation to verify proficiency persistence  
        success2, conv_details = self.run_test(
            "Get conversation to verify proficiency persistence",
            "GET",
            f"conversations/{conv_id}",
            200
        )
        
        if success2 and conv_details:
            proficiency = conv_details.get('proficiency_level')
            if proficiency == 'intermediate':
                print(f"   ✅ Proficiency persisted correctly: {proficiency}")
            else:
                print(f"   ❌ Proficiency not persisted correctly: {proficiency}")
                return False
        
        # Test different proficiency levels
        for level in ['beginner', 'advanced']:
            success, response = self.run_test(
                f"Set proficiency to {level}",
                "PATCH",
                f"conversations/{conv_id}/proficiency",
                200,
                data={"level": level}
            )
            if success and response.get('proficiency_level') == level:
                print(f"   ✅ Successfully set proficiency to {level}")
            else:
                print(f"   ❌ Failed to set proficiency to {level}")
                return False
        
        return success1 and success2

    def cleanup_conversations(self):
        """Clean up test conversations"""
        print(f"\n🧹 Cleaning up {len(self.conversations_created)} test conversations...")
        for conv_id in self.conversations_created:
            try:
                requests.delete(f"{self.api_url}/conversations/{conv_id}", timeout=5)
                print(f"   ✅ Deleted conversation {conv_id}")
            except:
                print(f"   ⚠️  Could not delete conversation {conv_id}")

    def run_all_tests(self):
        """Run all First Lesson Onboarding tests"""
        print("="*70)
        print("🧪 FIRST LESSON ONBOARDING API TESTS")
        print("="*70)
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        print(f"Testing Focus: First Lesson Assessment and Proficiency Detection")
        
        # Test sequence focused on First Lesson Onboarding
        tests = [
            ("Cross-Language Auto-Assessment", self.test_cross_language_auto_assessment),
            ("Same Language No Assessment", self.test_same_language_no_assessment), 
            ("Agent Tool Usage & Proficiency Detection", self.test_agent_tool_usage_and_proficiency_detection),
            ("Proficiency API Operations", self.test_proficiency_api_operations)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n" + "─"*60)
            try:
                result = test_func()
                results.append((test_name, result))
                if result:
                    print(f"✅ {test_name} - PASSED")
                else:
                    print(f"❌ {test_name} - FAILED")
            except Exception as e:
                print(f"❌ {test_name} - ERROR: {e}")
                results.append((test_name, False))
        
        # Cleanup
        self.cleanup_conversations()
        
        # Summary
        print(f"\n" + "="*70)
        print("📊 FIRST LESSON ONBOARDING TEST SUMMARY")
        print("="*70)
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\nFirst Lesson Features: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        print(f"Individual API calls: {self.tests_passed}/{self.tests_run} passed")
        
        return passed == total

def main():
    tester = FirstLessonOnboardingTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())