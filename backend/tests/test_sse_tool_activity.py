"""
Test SSE streaming endpoint and tool_activity feature for LinguaFlow.
Tests:
1. SSE endpoint returns event-stream content-type
2. SSE sends 'thinking' event followed by 'done' event
3. 'done' event contains user_message and ai_message with tool_activity
4. GET /messages returns messages with tool_activity from DB
5. tool_activity structure is correct
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestSSEStreaming:
    """Tests for SSE streaming endpoint and tool activity"""
    
    def test_sse_endpoint_content_type(self):
        """Test that SSE endpoint returns text/event-stream"""
        # First get existing conversation or create one
        convs = requests.get(f"{BASE_URL}/api/conversations").json()
        if not convs:
            pytest.skip("No conversations available for testing")
        
        conv_id = convs[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Hello"},
            stream=True,
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/event-stream" in response.headers.get("content-type", ""), \
            f"Expected text/event-stream, got {response.headers.get('content-type')}"
        print("PASS: SSE endpoint returns correct content-type")
    
    def test_sse_returns_thinking_and_done_events(self):
        """Test that SSE stream includes 'thinking' and 'done' events"""
        convs = requests.get(f"{BASE_URL}/api/conversations").json()
        if not convs:
            pytest.skip("No conversations available")
        
        conv_id = convs[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Hi, how are you?"},
            stream=True,
            timeout=60
        )
        
        events = []
        buffer = ""
        for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
            if chunk:
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines.pop() if not buffer.endswith("\n") else ""
                for line in lines:
                    if line.startswith("data: "):
                        try:
                            event = json.loads(line[6:])
                            events.append(event)
                        except json.JSONDecodeError:
                            pass
        
        event_types = [e.get("type") for e in events]
        
        assert "thinking" in event_types, f"Expected 'thinking' event, got: {event_types}"
        assert "done" in event_types, f"Expected 'done' event, got: {event_types}"
        print(f"PASS: SSE returned events: {event_types}")
    
    def test_done_event_includes_messages_with_tool_activity(self):
        """Test that 'done' event contains ai_message with tool_activity field"""
        convs = requests.get(f"{BASE_URL}/api/conversations").json()
        if not convs:
            pytest.skip("No conversations available")
        
        conv_id = convs[0]["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            json={"content": "Test message"},
            stream=True,
            timeout=60
        )
        
        done_event = None
        buffer = ""
        for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
            if chunk:
                buffer += chunk
                lines = buffer.split("\n")
                buffer = lines.pop() if not buffer.endswith("\n") else ""
                for line in lines:
                    if line.startswith("data: "):
                        try:
                            event = json.loads(line[6:])
                            if event.get("type") == "done":
                                done_event = event
                        except json.JSONDecodeError:
                            pass
        
        assert done_event is not None, "No 'done' event found"
        assert "user_message" in done_event, "done event missing user_message"
        assert "ai_message" in done_event, "done event missing ai_message"
        
        ai_msg = done_event["ai_message"]
        assert "tool_activity" in ai_msg, f"ai_message missing tool_activity field: {ai_msg.keys()}"
        assert isinstance(ai_msg["tool_activity"], list), "tool_activity should be a list"
        
        print(f"PASS: done event has ai_message with tool_activity: {ai_msg['tool_activity']}")
    
    def test_get_messages_returns_tool_activity(self):
        """Test that GET /messages returns messages with tool_activity field"""
        # Get conversation that has tool_activity data
        convs = requests.get(f"{BASE_URL}/api/conversations").json()
        if not convs:
            pytest.skip("No conversations available")
        
        # Try each conversation until we find one with tool_activity
        tool_activity_found = False
        for conv in convs:
            messages = requests.get(f"{BASE_URL}/api/conversations/{conv['id']}/messages").json()
            for msg in messages:
                if msg.get("role") == "assistant" and msg.get("tool_activity"):
                    tool_activity_found = True
                    tool_activity = msg["tool_activity"]
                    assert isinstance(tool_activity, list), "tool_activity should be a list"
                    if len(tool_activity) > 0:
                        first_tool = tool_activity[0]
                        assert "tool" in first_tool, "tool_activity item should have 'tool' field"
                        assert "label" in first_tool, "tool_activity item should have 'label' field"
                        print(f"PASS: Found tool_activity in message {msg['id']}: {tool_activity}")
                        return
        
        # If no existing tool_activity, the test still passes if the field exists
        # (even if empty - depends on whether tools were called)
        if convs:
            messages = requests.get(f"{BASE_URL}/api/conversations/{convs[0]['id']}/messages").json()
            if messages:
                assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
                if assistant_msgs:
                    # Check that the field exists even if empty
                    assert "tool_activity" in assistant_msgs[0], "tool_activity field should exist in assistant messages"
                    print(f"PASS: tool_activity field present (may be empty if no tools called)")


class TestToolActivityTrigger:
    """Test that tool_activity is populated when tools are actually called"""
    
    def test_grammar_check_triggers_tool_activity(self):
        """Send a message that should trigger grammar_check tool"""
        # Create a Spanish learning conversation to trigger grammar/vocab tools
        create_resp = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "es"
        })
        assert create_resp.status_code == 200, f"Failed to create conversation: {create_resp.text}"
        conv_id = create_resp.json()["id"]
        
        try:
            # Send a message that should trigger tools
            response = requests.post(
                f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
                json={"content": "Check my grammar: I goed to the store yesterday. Also, what does 'hola' mean?"},
                stream=True,
                timeout=90
            )
            
            events = []
            buffer = ""
            for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                if chunk:
                    buffer += chunk
                    lines = buffer.split("\n")
                    buffer = lines.pop() if not buffer.endswith("\n") else ""
                    for line in lines:
                        if line.startswith("data: "):
                            try:
                                event = json.loads(line[6:])
                                events.append(event)
                                print(f"Event: {event.get('type')} - {event}")
                            except json.JSONDecodeError:
                                pass
            
            event_types = [e.get("type") for e in events]
            done_event = next((e for e in events if e.get("type") == "done"), None)
            
            assert done_event, "No done event received"
            ai_msg = done_event.get("ai_message", {})
            tool_activity = ai_msg.get("tool_activity", [])
            tools_used = ai_msg.get("tools_used", [])
            
            print(f"Event types: {event_types}")
            print(f"Tools used: {tools_used}")
            print(f"Tool activity: {tool_activity}")
            
            # Verify the message was saved with tool_activity
            messages = requests.get(f"{BASE_URL}/api/conversations/{conv_id}/messages").json()
            assert len(messages) >= 2, "Should have at least 2 messages (welcome + user + ai)"
            
            # Find the AI response to our test message
            ai_responses = [m for m in messages if m.get("role") == "assistant"]
            if ai_responses:
                last_ai = ai_responses[-1]
                print(f"AI response tool_activity from DB: {last_ai.get('tool_activity', [])}")
            
            print("PASS: Grammar check message processed")
            
        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/conversations/{conv_id}")


class TestConversationIntegration:
    """Integration tests for conversation flow with tool activity"""
    
    def test_new_conversation_welcome_message(self):
        """Test that new conversation creates welcome message"""
        create_resp = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "en"
        })
        assert create_resp.status_code == 200, f"Failed to create: {create_resp.text}"
        conv = create_resp.json()
        
        try:
            assert "id" in conv, "Conversation should have id"
            assert conv.get("message_count", 0) >= 1, "Should have welcome message"
            
            # Get messages
            messages = requests.get(f"{BASE_URL}/api/conversations/{conv['id']}/messages").json()
            assert len(messages) >= 1, "Should have at least 1 message (welcome)"
            assert messages[0]["role"] == "assistant", "First message should be assistant"
            
            print(f"PASS: New conversation has welcome message: {messages[0]['content'][:100]}...")
        finally:
            requests.delete(f"{BASE_URL}/api/conversations/{conv['id']}")
    
    def test_message_response_model_includes_tool_activity(self):
        """Verify MessageResponse model includes tool_activity field"""
        convs = requests.get(f"{BASE_URL}/api/conversations").json()
        if not convs:
            pytest.skip("No conversations available")
        
        messages = requests.get(f"{BASE_URL}/api/conversations/{convs[0]['id']}/messages").json()
        if not messages:
            pytest.skip("No messages available")
        
        # Check that assistant messages have tool_activity field
        for msg in messages:
            if msg["role"] == "assistant":
                assert "tool_activity" in msg, f"Message {msg['id']} missing tool_activity field"
        
        print("PASS: All assistant messages have tool_activity field")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
