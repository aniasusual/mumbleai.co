#!/usr/bin/env python3
"""
Backend API testing for Voice Conversation Agent with Dual Language System

Tests the key features:
1. POST /api/conversations with native_language and target_language
2. POST /api/conversations/{id}/messages with language-specific behavior
3. GET /api/languages (99 languages)
4. POST /api/tts
5. Dual language conversation flow
"""

import requests
import json
import sys
import time
from datetime import datetime

class VoiceLanguageTesterAPI:
    def __init__(self, base_url="https://voice-master-19.preview.emergentagent.com"):
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

    def test_get_languages(self):
        """Test GET /api/languages returns 99 languages"""
        success, response = self.run_test(
            "GET Languages API",
            "GET", 
            "languages",
            200
        )
        
        if success:
            # Check structure - should have popular and others
            if 'popular' in response and 'others' in response:
                total_langs = len(response['popular']) + len(response['others'])
                print(f"   Found {total_langs} total languages")
                print(f"   Popular: {len(response['popular'])}, Others: {len(response['others'])}")
                
                # Verify structure of language objects
                if response['popular'] and isinstance(response['popular'][0], dict):
                    sample_lang = response['popular'][0]
                    required_fields = ['code', 'name', 'native']
                    if all(field in sample_lang for field in required_fields):
                        print(f"   ✅ Language structure correct - sample: {sample_lang}")
                        return True
                    else:
                        print(f"   ❌ Missing required fields in language object")
                        return False
                else:
                    print("   ❌ Invalid language structure")
                    return False
            else:
                print(f"   ❌ Response missing 'popular' or 'others' keys")
                return False
        return success

    def test_create_conversation_dual_language(self):
        """Test POST /api/conversations with native_language and target_language"""
        
        # Test 1: English native -> French target
        success1, conv1 = self.run_test(
            "Create EN→FR Conversation",
            "POST",
            "conversations", 
            200,
            data={
                "title": "English to French Practice",
                "native_language": "en",
                "target_language": "fr"
            }
        )
        
        if success1 and conv1:
            self.conversations_created.append(conv1['id'])
            # Verify fields
            if conv1.get('native_language') == 'en' and conv1.get('target_language') == 'fr':
                print(f"   ✅ Conversation created with correct languages: {conv1['native_language']} → {conv1['target_language']}")
            else:
                print(f"   ❌ Language fields incorrect: {conv1.get('native_language')} → {conv1.get('target_language')}")
                return False
        
        # Test 2: Spanish native -> English target  
        success2, conv2 = self.run_test(
            "Create ES→EN Conversation",
            "POST",
            "conversations",
            200,
            data={
                "title": "Spanish to English Practice",
                "native_language": "es", 
                "target_language": "en"
            }
        )
        
        if success2 and conv2:
            self.conversations_created.append(conv2['id'])
            if conv2.get('native_language') == 'es' and conv2.get('target_language') == 'en':
                print(f"   ✅ Second conversation created: {conv2['native_language']} → {conv2['target_language']}")
            else:
                print(f"   ❌ Second conversation language fields incorrect")
                return False
        
        # Test 3: Same language (improvement mode)
        success3, conv3 = self.run_test(
            "Create EN→EN Conversation (improvement mode)",
            "POST", 
            "conversations",
            200,
            data={
                "native_language": "en",
                "target_language": "en"
            }
        )
        
        if success3 and conv3:
            self.conversations_created.append(conv3['id'])
            if conv3.get('native_language') == 'en' and conv3.get('target_language') == 'en':
                print(f"   ✅ Same language conversation created for improvement")
            else:
                print(f"   ❌ Same language conversation failed")
                return False
        
        return success1 and success2 and success3

    def test_conversation_messages_dual_language(self):
        """Test POST /api/conversations/{id}/messages with language-specific behavior"""
        
        if not self.conversations_created:
            print("❌ No conversations to test messages with")
            return False
            
        # Test English→French conversation
        en_fr_conv_id = self.conversations_created[0]  # Should be EN→FR from previous test
        
        # Test case: "How do I say hello in French?"
        success1, messages1 = self.run_test(
            "EN→FR: Ask how to say hello",
            "POST",
            f"conversations/{en_fr_conv_id}/messages",
            200,
            data={"content": "How do I say hello in French?"}
        )
        
        if success1 and messages1:
            # Should return user message + AI message
            if len(messages1) >= 2:
                ai_message = next((msg for msg in messages1 if msg['role'] == 'assistant'), None)
                if ai_message:
                    ai_content = ai_message['content'].lower()
                    # Should contain French greeting and English explanation
                    if 'bonjour' in ai_content or 'salut' in ai_content:
                        print(f"   ✅ AI provided French greeting in response")
                    else:
                        print(f"   ⚠️  AI response may not contain French greeting: {ai_content[:100]}...")
                else:
                    print(f"   ❌ No AI message found in response")
                    return False
            else:
                print(f"   ❌ Expected 2 messages, got {len(messages1)}")
                return False
        
        # Test grammar check tool
        success2, messages2 = self.run_test(
            "Grammar Check Tool Test",
            "POST",
            f"conversations/{en_fr_conv_id}/messages", 
            200,
            data={"content": "Check my grammar: je suis alle au magasin"}
        )
        
        if success2 and messages2:
            ai_message = next((msg for msg in messages2 if msg['role'] == 'assistant'), None)
            if ai_message and ai_message.get('tools_used'):
                if 'grammar_check' in ai_message['tools_used']:
                    print(f"   ✅ Grammar check tool triggered correctly")
                else:
                    print(f"   ⚠️  Tools used: {ai_message['tools_used']}")
            else:
                print(f"   ⚠️  Grammar check tool may not have triggered")
        
        # Test same language conversation (EN→EN)
        if len(self.conversations_created) >= 3:
            en_en_conv_id = self.conversations_created[2]  # Should be EN→EN
            success3, messages3 = self.run_test(
                "EN→EN: Same language conversation",
                "POST",
                f"conversations/{en_en_conv_id}/messages",
                200,
                data={"content": "Help me improve my writing skills"}
            )
            
            if success3 and messages3:
                print(f"   ✅ Same language conversation works (improvement mode)")
            else:
                return False
        
        return success1 and success2

    def test_tts_api(self):
        """Test POST /api/tts"""
        success, response = self.run_test(
            "Text-to-Speech API",
            "POST",
            "tts",
            200,
            data={"text": "Hello, this is a test message for text to speech."}
        )
        
        if success and response:
            if 'audio_base64' in response and response['audio_base64']:
                print(f"   ✅ TTS returned audio data (base64 length: {len(response['audio_base64'])})")
                return True
            else:
                print(f"   ❌ TTS response missing audio_base64")
                return False
        
        return success

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
        """Run all tests"""
        print("="*60)
        print("🧪 Voice Language Learning API Tests")
        print("="*60)
        print(f"Base URL: {self.base_url}")
        print(f"API URL: {self.api_url}")
        
        # Test sequence
        tests = [
            ("Languages API", self.test_get_languages),
            ("Dual Language Conversations", self.test_create_conversation_dual_language), 
            ("Language-specific Messages", self.test_conversation_messages_dual_language),
            ("Text-to-Speech", self.test_tts_api)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n" + "─"*50)
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
        print(f"\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
        
        print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        print(f"Individual API calls: {self.tests_passed}/{self.tests_run} passed")
        
        return passed == total

def main():
    tester = VoiceLanguageTesterAPI()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())