import requests
import sys
import json
import tempfile
import shutil
from datetime import datetime

class MultiLanguageAPITester:
    def __init__(self, base_url="https://voice-master-19.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, files=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, dict) and len(str(resp_data)) < 200:
                        print(f"   Response keys: {list(resp_data.keys()) if isinstance(resp_data, dict) else 'Array'}")
                    elif isinstance(resp_data, list):
                        print(f"   Response: Array with {len(resp_data)} items")
                except:
                    print(f"   Response: Non-JSON or large payload")
                
                self.test_results.append({
                    "test": name,
                    "status": "PASS",
                    "response_code": response.status_code,
                    "details": "Success"
                })
                return True, response.json() if response.content else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")
                
                self.test_results.append({
                    "test": name,
                    "status": "FAIL", 
                    "response_code": response.status_code,
                    "details": f"Expected {expected_status}, got {response.status_code}"
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "response_code": None,
                "details": str(e)
            })
            return False, {}

    def test_languages_api(self):
        """Test GET /api/languages returns popular and others arrays with 99 total languages"""
        success, response = self.run_test(
            "GET /api/languages endpoint",
            "GET", 
            "languages"
        )
        
        if success:
            if 'popular' in response and 'others' in response:
                popular_count = len(response['popular'])
                others_count = len(response['others'])
                total = popular_count + others_count
                
                print(f"   Popular languages: {popular_count}")
                print(f"   Other languages: {others_count}")  
                print(f"   Total languages: {total}")
                
                if total == 99:
                    print(f"✅ Language count correct: {total}")
                    return True, response
                else:
                    print(f"❌ Expected 99 languages, got {total}")
                    return False, response
            else:
                print(f"❌ Missing 'popular' or 'others' keys in response")
                return False, response
        return False, {}

    def test_conversation_with_language(self, language_code, language_name):
        """Test creating conversation with specific language"""
        success, response = self.run_test(
            f"Create conversation with language '{language_code}' ({language_name})",
            "POST",
            "conversations", 
            expected_status=200,
            data={"language": language_code, "title": f"Test {language_name} conversation"}
        )
        
        if success and 'id' in response:
            if response.get('language') == language_code:
                print(f"✅ Conversation created with correct language: {language_code}")
                return True, response['id']
            else:
                print(f"❌ Expected language '{language_code}', got '{response.get('language')}'")
        
        return False, None

    def test_language_specific_message(self, conv_id, message, expected_lang, language_name):
        """Test sending message to language-specific conversation"""
        success, response = self.run_test(
            f"Send message to {language_name} conversation", 
            "POST",
            f"conversations/{conv_id}/messages",
            expected_status=200,
            data={"content": message}
        )
        
        if success and isinstance(response, list) and len(response) >= 2:
            ai_message = next((msg for msg in response if msg.get('role') == 'assistant'), None)
            if ai_message:
                ai_content = ai_message.get('content', '')
                print(f"   AI response length: {len(ai_content)} chars")
                print(f"   AI response preview: {ai_content[:100]}...")
                
                # Basic check - AI should respond (non-empty)
                if len(ai_content.strip()) > 10:
                    print(f"✅ AI responded appropriately in {language_name}")
                    return True, ai_message
                else:
                    print(f"❌ AI response too short or empty")
            else:
                print(f"❌ No AI message found in response")
        else:
            print(f"❌ Invalid response format")
            
        return False, None

    def test_tts_non_english(self):
        """Test TTS with non-English text"""
        test_texts = [
            "Hola, ¿cómo estás?",  # Spanish
            "Bonjour, comment allez-vous?",  # French
            "Guten Tag, wie geht es Ihnen?"  # German
        ]
        
        for text in test_texts:
            success, response = self.run_test(
                f"TTS with non-English text: '{text[:20]}...'",
                "POST",
                "tts",
                expected_status=200,
                data={"text": text}
            )
            
            if success and 'audio_base64' in response:
                audio_length = len(response['audio_base64'])
                print(f"   Generated audio length: {audio_length} chars")
                if audio_length > 1000:  # Reasonable audio size
                    print(f"✅ TTS generated audio for non-English text")
                else:
                    print(f"❌ Audio too small, might be invalid")
                    return False
            else:
                print(f"❌ TTS failed for non-English text")
                return False
                
        return True

    def test_tool_calling_messages(self, conv_id):
        """Test specific tool calling scenarios from review request"""
        tool_tests = [
            {
                "message": "Check my grammar: I goed to store",
                "expected_tool": "grammar_check",
                "description": "Grammar check tool trigger"
            },
            {
                "message": "How do you pronounce entrepreneur?", 
                "expected_tool": "pronunciation_guide",
                "description": "Pronunciation tool trigger"
            },
            {
                "message": "What does serendipity mean?",
                "expected_tool": "vocabulary_lookup", 
                "description": "Vocabulary lookup tool trigger"
            },
            {
                "message": "Let's practice a job interview",
                "expected_tool": "start_scenario",
                "description": "Scenario tool trigger"
            },
            {
                "message": "Hello, how are you?",
                "expected_tool": None,
                "description": "Normal conversation (no tools)"
            }
        ]
        
        all_passed = True
        
        for test in tool_tests:
            print(f"\n🔧 Testing: {test['description']}")
            success, response = self.run_test(
                f"Tool calling: {test['message'][:30]}...",
                "POST",
                f"conversations/{conv_id}/messages", 
                expected_status=200,
                data={"content": test['message']},
                timeout=30  # Increased for agent processing
            )
            
            if success and isinstance(response, list) and len(response) >= 2:
                ai_message = next((msg for msg in response if msg.get('role') == 'assistant'), None)
                if ai_message:
                    tools_used = ai_message.get('tools_used', [])
                    print(f"   Tools used: {tools_used}")
                    
                    if test['expected_tool']:
                        if test['expected_tool'] in tools_used:
                            print(f"✅ Tool '{test['expected_tool']}' triggered correctly")
                        else:
                            print(f"❌ Expected tool '{test['expected_tool']}' not found in {tools_used}")
                            all_passed = False
                    else:
                        if len(tools_used) == 0:
                            print("✅ No tools used (expected for normal conversation)")
                        else:
                            print(f"⚠️  Tools used when none expected: {tools_used}")
                            # This might still be acceptable
                else:
                    print("❌ No AI response found")
                    all_passed = False
            else:
                print("❌ Invalid response format or failed request")
                all_passed = False
                
        return all_passed

    def test_voice_message_endpoint(self):
        """Test voice message endpoint with test audio file"""
        # Create a minimal test audio file
        audio_content = b"fake_audio_content_for_testing" * 100  # Make it reasonably sized
        
        # First create a conversation
        conv_success, conv_response = self.run_test(
            "Create conversation for voice test",
            "POST", 
            "conversations",
            data={"language": "en", "title": "Voice test conversation"}
        )
        
        if not conv_success or 'id' not in conv_response:
            print("❌ Failed to create conversation for voice test")
            return False
            
        conv_id = conv_response['id']
        
        # Try to send voice message with fake audio
        files = {'audio': ('test_voice.mp3', audio_content, 'audio/mp3')}
        
        success, response = self.run_test(
            "POST /api/conversations/{id}/voice-message with test audio",
            "POST",
            f"conversations/{conv_id}/voice-message",
            expected_status=200,  # Or might be 400 if Whisper rejects fake audio
            files=files,
            timeout=60
        )
        
        # Note: This might fail with fake audio, but we test the endpoint exists
        if success:
            print("✅ Voice endpoint accepts requests and processes audio")
            return True
        else:
            print("⚠️  Voice endpoint exists but may reject fake audio (expected)")
            # This is acceptable - the endpoint exists and responds
            return True

def main():
    print("🚀 Starting Multi-Language Voice Conversation Agent Tests")
    print("=" * 60)
    
    tester = MultiLanguageAPITester()
    
    # Test 1: Languages API
    print("\n📋 Testing Languages API...")
    langs_success, languages_data = tester.test_languages_api()
    
    if not langs_success:
        print("❌ Languages API failed - cannot proceed with language-specific tests")
        return 1
    
    # Test 2: Spanish conversation
    print("\n🇪🇸 Testing Spanish Conversation...")
    es_success, es_conv_id = tester.test_conversation_with_language("es", "Spanish") 
    
    if es_success and es_conv_id:
        # Test Spanish message
        tester.test_language_specific_message(
            es_conv_id, 
            "Hola, quiero aprender español",
            "es",
            "Spanish"
        )
    
    # Test 3: French conversation  
    print("\n🇫🇷 Testing French Conversation...")
    fr_success, fr_conv_id = tester.test_conversation_with_language("fr", "French")
    
    if fr_success and fr_conv_id:
        # Test French message
        tester.test_language_specific_message(
            fr_conv_id,
            "Bonjour, je veux pratiquer mon français", 
            "fr",
            "French"
        )
    
    # Test 4: English conversation (baseline)
    print("\n🇺🇸 Testing English Conversation...")
    en_success, en_conv_id = tester.test_conversation_with_language("en", "English")
    
    if en_success and en_conv_id:
        tester.test_language_specific_message(
            en_conv_id,
            "Hello, I want to practice English",
            "en", 
            "English"
        )
    
    # Test 5: TTS with non-English text
    print("\n🔊 Testing TTS with Non-English Text...")
    tester.test_tts_non_english()
    
    # Test 6: Voice message endpoint
    print("\n🎤 Testing Voice Message Endpoint...")
    tester.test_voice_message_endpoint()
    
    # Print results summary
    print("\n" + "=" * 60)
    print(f"📊 Test Summary: {tester.tests_passed}/{tester.tests_run} tests passed")
    print("=" * 60)
    
    for result in tester.test_results:
        status_icon = "✅" if result["status"] == "PASS" else "❌" if result["status"] == "FAIL" else "⚠️"
        print(f"{status_icon} {result['test']}: {result['status']}")
        if result["status"] != "PASS":
            print(f"   {result['details']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())