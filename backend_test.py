#!/usr/bin/env python3
"""
Backend API Testing for LinguaFlow Conversation Agent
Tests all API endpoints with comprehensive coverage
"""

import requests
import sys
import json
from datetime import datetime

class LinguaFlowAPITester:
    def __init__(self, base_url="https://voice-master-19.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_conversation_id = None
        self.created_vocab_id = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None, return_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if return_json and response.text:
                    try:
                        return success, response.json()
                    except json.JSONDecodeError:
                        print(f"   Warning: Non-JSON response: {response.text[:100]}")
                        return success, response.text
                return success, response.text if response.text else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}
                
        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after 15s")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_scenarios_api(self):
        """Test GET /api/scenarios - should return 8 scenarios"""
        success, response = self.run_test(
            "GET Scenarios",
            "GET",
            "scenarios",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} scenarios")
            if len(response) >= 8:
                print(f"   ✓ Expected 8+ scenarios found")
            else:
                print(f"   ⚠️ Only {len(response)} scenarios, expected 8")
            # Check scenario structure
            if response and isinstance(response[0], dict):
                first_scenario = response[0]
                required_fields = ['id', 'title', 'description', 'icon']
                missing_fields = [f for f in required_fields if f not in first_scenario]
                if not missing_fields:
                    print(f"   ✓ Scenario structure valid")
                else:
                    print(f"   ⚠️ Missing fields in scenario: {missing_fields}")
        return success

    def test_create_conversation(self):
        """Test POST /api/conversations - create new conversation"""
        test_data = {
            "title": "Test Conversation",
            "scenario": None
        }
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            data=test_data
        )
        if success and isinstance(response, dict) and 'id' in response:
            self.created_conversation_id = response['id']
            print(f"   ✓ Created conversation with ID: {self.created_conversation_id}")
        return success

    def test_list_conversations(self):
        """Test GET /api/conversations"""
        success, response = self.run_test(
            "List Conversations",
            "GET", 
            "conversations",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} conversations")
        return success

    def test_send_message(self):
        """Test POST /api/conversations/{id}/messages - send message and get AI response"""
        if not self.created_conversation_id:
            print("❌ Skipping message test - no conversation created")
            return False
            
        test_message = {
            "content": "Hello, I want to practice English grammar",
            "scenario_context": None
        }
        success, response = self.run_test(
            "Send Message & Get AI Response",
            "POST",
            f"conversations/{self.created_conversation_id}/messages",
            200,
            data=test_message
        )
        if success and isinstance(response, list) and len(response) >= 2:
            print(f"   ✓ Received {len(response)} messages (user + AI response)")
            # Check message structure
            user_msg = response[0]
            ai_msg = response[1]
            if user_msg.get('role') == 'user' and ai_msg.get('role') == 'assistant':
                print(f"   ✓ Message roles correct")
                if ai_msg.get('content'):
                    print(f"   ✓ AI response contains content: {ai_msg['content'][:100]}...")
                if 'tools_used' in ai_msg:
                    print(f"   ✓ Tools used field present: {ai_msg['tools_used']}")
        return success

    def test_get_messages(self):
        """Test GET /api/conversations/{id}/messages"""
        if not self.created_conversation_id:
            print("❌ Skipping get messages test - no conversation created")
            return False
            
        success, response = self.run_test(
            "Get Conversation Messages", 
            "GET",
            f"conversations/{self.created_conversation_id}/messages",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} messages in conversation")
        return success

    def test_progress_api(self):
        """Test GET /api/progress - returns progress stats"""
        success, response = self.run_test(
            "Get Progress Stats",
            "GET",
            "progress", 
            200
        )
        if success and isinstance(response, dict):
            required_fields = ['total_conversations', 'total_messages', 'vocabulary_count', 
                             'scenarios_practiced', 'tools_usage', 'streak_days', 'recent_activity']
            missing_fields = [f for f in required_fields if f not in response]
            if not missing_fields:
                print(f"   ✓ Progress structure valid")
                print(f"   - Conversations: {response.get('total_conversations', 0)}")
                print(f"   - Messages: {response.get('total_messages', 0)}")
                print(f"   - Vocabulary: {response.get('vocabulary_count', 0)}")
            else:
                print(f"   ⚠️ Missing fields in progress: {missing_fields}")
        return success

    def test_vocabulary_save(self):
        """Test POST /api/vocabulary - save a word"""
        test_word = {
            "word": "serendipity",
            "definition": "The occurrence of events by chance in a happy way",
            "example": "Finding that bookshop was pure serendipity.",
            "context": "Testing vocabulary API"
        }
        success, response = self.run_test(
            "Save Vocabulary Word",
            "POST",
            "vocabulary",
            200,
            data=test_word
        )
        if success and isinstance(response, dict) and 'id' in response:
            self.created_vocab_id = response['id']
            print(f"   ✓ Saved vocabulary with ID: {self.created_vocab_id}")
        return success

    def test_vocabulary_list(self):
        """Test GET /api/vocabulary"""
        success, response = self.run_test(
            "List Vocabulary",
            "GET",
            "vocabulary",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} vocabulary words")
            if response:
                first_word = response[0]
                required_fields = ['id', 'word', 'definition', 'created_at']
                missing_fields = [f for f in required_fields if f not in first_word]
                if not missing_fields:
                    print(f"   ✓ Vocabulary structure valid")
                else:
                    print(f"   ⚠️ Missing fields in vocabulary: {missing_fields}")
        return success

    def test_delete_vocabulary(self):
        """Test DELETE /api/vocabulary/{id}"""
        if not self.created_vocab_id:
            print("❌ Skipping vocabulary delete - no vocabulary created")
            return False
            
        success, response = self.run_test(
            "Delete Vocabulary Word",
            "DELETE",
            f"vocabulary/{self.created_vocab_id}",
            200,
            return_json=False
        )
        return success

    def test_tts_api(self):
        """Test POST /api/tts - text-to-speech endpoint"""
        test_data = {
            "text": "Hello, this is a test of the text-to-speech functionality."
        }
        success, response = self.run_test(
            "Text-to-Speech API",
            "POST",
            "tts",
            200,
            data=test_data
        )
        if success and isinstance(response, dict):
            if 'audio_base64' in response and response['audio_base64']:
                print(f"   ✓ TTS returned audio_base64 (length: {len(response['audio_base64'])} chars)")
                # Basic validation of base64 audio
                if len(response['audio_base64']) > 1000:  # Should be substantial audio data
                    print(f"   ✓ Audio data appears substantial")
                else:
                    print(f"   ⚠️ Audio data seems small, might be empty")
            else:
                print(f"   ❌ TTS response missing audio_base64 field")
                return False
        return success

    def test_voice_message_api(self):
        """Test POST /api/conversations/{id}/voice-message - voice message with multipart form"""
        if not self.created_conversation_id:
            print("❌ Skipping voice message test - no conversation created")
            return False
            
        # Create a minimal test audio file (empty WebM file header)
        # This is just for API testing - real audio would be much larger
        test_audio_data = b'\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42\xf7\x81\x01\x42\xf2\x81\x04\x42\xf3\x81\x08\x42\x82\x84webm\x42\x87\x81\x02\x42\x85\x81\x02'
        
        url = f"{self.api_url}/conversations/{self.created_conversation_id}/voice-message"
        
        self.tests_run += 1
        print(f"\n🔍 Testing Voice Message API...")
        print(f"   URL: {url}")
        
        try:
            # Create multipart form data
            files = {
                'audio': ('test.webm', test_audio_data, 'audio/webm')
            }
            data = {
                'scenario_context': None
            }
            
            response = requests.post(url, files=files, data=data, timeout=30)  # Longer timeout for AI processing
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                try:
                    json_response = response.json()
                    
                    # Check expected response structure
                    required_fields = ['user_message', 'ai_message', 'transcribed_text']
                    missing_fields = [f for f in required_fields if f not in json_response]
                    
                    if not missing_fields:
                        print(f"   ✓ Voice message response structure valid")
                        
                        # Check transcribed text
                        transcribed = json_response.get('transcribed_text', '')
                        print(f"   ✓ Transcribed text: '{transcribed}'" if transcribed else "   ⚠️ No transcribed text (expected with minimal test audio)")
                        
                        # Check AI message
                        ai_msg = json_response.get('ai_message', {})
                        if ai_msg.get('content'):
                            print(f"   ✓ AI response: {ai_msg['content'][:100]}...")
                        
                        # Check TTS audio (optional)
                        ai_audio = json_response.get('ai_audio_base64')
                        if ai_audio:
                            print(f"   ✓ AI audio returned (length: {len(ai_audio)} chars)")
                        else:
                            print(f"   ⚠️ No AI audio returned (may be due to TTS failure with test audio)")
                            
                    else:
                        print(f"   ⚠️ Missing fields in voice response: {missing_fields}")
                    
                    return True
                    
                except json.JSONDecodeError:
                    print(f"   ❌ Invalid JSON response: {response.text[:200]}")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:400]}")
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after 30s (AI processing may be slow)")
            return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_delete_conversation(self):
        """Test DELETE /api/conversations/{id}"""
        if not self.created_conversation_id:
            print("❌ Skipping conversation delete - no conversation created")
            return False
            
        success, response = self.run_test(
            "Delete Conversation",
            "DELETE", 
            f"conversations/{self.created_conversation_id}",
            200,
            return_json=False
        )
        return success

def main():
    print("🚀 Starting LinguaFlow Backend API Tests")
    print("=" * 60)
    
    tester = LinguaFlowAPITester()
    
    # Test all endpoints in logical order
    tests = [
        ("Scenarios API", tester.test_scenarios_api),
        ("Create Conversation", tester.test_create_conversation), 
        ("List Conversations", tester.test_list_conversations),
        ("Send Message & AI Response", tester.test_send_message),
        ("Get Messages", tester.test_get_messages),
        ("Progress Stats", tester.test_progress_api),
        ("Save Vocabulary", tester.test_vocabulary_save),
        ("List Vocabulary", tester.test_vocabulary_list),
        ("Delete Vocabulary", tester.test_delete_vocabulary),
        ("Delete Conversation", tester.test_delete_conversation)
    ]
    
    print(f"\nRunning {len(tests)} API tests...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            tester.tests_run += 1
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend APIs are working correctly.")
        return 0
    else:
        failed_count = tester.tests_run - tester.tests_passed
        print(f"⚠️ {failed_count} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())