"""
Credit-based Payment System Tests for 'mumble' Language Tutor App
Tests all features for Razorpay-based subscription plans with credit management.

Test Users (pre-seeded):
- free@test.com / password123 (Free plan, 50 credits, max 3 convs - has 3 conversations)
- plus@test.com / password123 (Plus plan, 1000 credits, max 10 convs - has 10 conversations)
- pro@test.com / password123 (Pro plan, 5000 credits, unlimited - has 12 conversations)
- broke@test.com / password123 (Free plan, 0 credits, max 3 convs - has 1 conversation)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def free_user():
    """Login free@test.com - Free plan, 50 credits, 3 convs (at limit)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "free@test.com", "password": "password123"
    })
    if response.status_code != 200:
        pytest.skip("free@test.com login failed")
    data = response.json()
    return {"token": data["token"], "user_id": data["user"]["id"]}


@pytest.fixture(scope="module")
def plus_user():
    """Login plus@test.com - Plus plan, 1000 credits, 10 convs (at limit)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "plus@test.com", "password": "password123"
    })
    if response.status_code != 200:
        pytest.skip("plus@test.com login failed")
    data = response.json()
    return {"token": data["token"], "user_id": data["user"]["id"]}


@pytest.fixture(scope="module")
def pro_user():
    """Login pro@test.com - Pro plan, 5000 credits, unlimited"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "pro@test.com", "password": "password123"
    })
    if response.status_code != 200:
        pytest.skip("pro@test.com login failed")
    data = response.json()
    return {"token": data["token"], "user_id": data["user"]["id"]}


@pytest.fixture(scope="module")
def broke_user():
    """Login broke@test.com - Free plan, 0 credits"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "broke@test.com", "password": "password123"
    })
    if response.status_code != 200:
        pytest.skip("broke@test.com login failed")
    data = response.json()
    return {"token": data["token"], "user_id": data["user"]["id"]}


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# =============================================
# PLAN DETAILS - GET /api/payments/plans
# =============================================

class TestPlansEndpoint:
    """Tests for GET /api/payments/plans"""
    
    def test_plans_returns_all_three_plans(self):
        """GET /plans returns Free, Plus, Pro with correct pricing"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        plans = response.json()["plans"]
        plan_ids = {p["id"] for p in plans}
        assert plan_ids == {"free", "plus", "pro"}, f"Missing plans: {plan_ids}"
        print("PASSED: GET /plans returns 3 plans (free, plus, pro)")
    
    def test_free_plan_pricing(self):
        """Free plan: $0, 50 credits, 3 conversations"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        plans = {p["id"]: p for p in response.json()["plans"]}
        
        free = plans["free"]
        assert free["price"] == 0, f"Free price should be 0, got {free['price']}"
        assert free["credits"] == 50, f"Free credits should be 50, got {free['credits']}"
        assert free["max_conversations"] == 3, f"Free convs should be 3, got {free['max_conversations']}"
        print("PASSED: Free plan: $0, 50 credits, 3 convs")
    
    def test_plus_plan_pricing(self):
        """Plus plan: $14.99, 1000 credits, 10 conversations"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        plans = {p["id"]: p for p in response.json()["plans"]}
        
        plus = plans["plus"]
        assert plus["price"] == 14.99, f"Plus price should be 14.99, got {plus['price']}"
        assert plus["credits"] == 1000, f"Plus credits should be 1000, got {plus['credits']}"
        assert plus["max_conversations"] == 10, f"Plus convs should be 10, got {plus['max_conversations']}"
        print("PASSED: Plus plan: $14.99, 1000 credits, 10 convs")
    
    def test_pro_plan_pricing(self):
        """Pro plan: $29.99, 5000 credits, unlimited conversations (-1)"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        plans = {p["id"]: p for p in response.json()["plans"]}
        
        pro = plans["pro"]
        assert pro["price"] == 29.99, f"Pro price should be 29.99, got {pro['price']}"
        assert pro["credits"] == 5000, f"Pro credits should be 5000, got {pro['credits']}"
        assert pro["max_conversations"] == -1, f"Pro convs should be -1 (unlimited), got {pro['max_conversations']}"
        print("PASSED: Pro plan: $29.99, 5000 credits, unlimited")


# =============================================
# SUBSCRIPTION ENDPOINT - GET /api/payments/subscription
# =============================================

class TestSubscriptionEndpoint:
    """Tests for GET /api/payments/subscription"""
    
    def test_subscription_returns_correct_plan_free(self, free_user):
        """Free user subscription returns plan=free, credits, max_conversations=3"""
        response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=auth_headers(free_user["token"])
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["plan"] == "free", f"Expected plan=free, got {data['plan']}"
        assert data["max_conversations"] == 3, f"Expected max_convs=3, got {data['max_conversations']}"
        assert "credits" in data, "Response should have credits"
        print(f"PASSED: Free user subscription: plan={data['plan']}, credits={data['credits']}, max_convs={data['max_conversations']}")
    
    def test_subscription_returns_correct_plan_plus(self, plus_user):
        """Plus user subscription returns plan=plus, credits, max_conversations=10"""
        response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=auth_headers(plus_user["token"])
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan"] == "plus", f"Expected plan=plus, got {data['plan']}"
        assert data["max_conversations"] == 10, f"Expected max_convs=10, got {data['max_conversations']}"
        print(f"PASSED: Plus user subscription: plan={data['plan']}, credits={data['credits']}, max_convs={data['max_conversations']}")
    
    def test_subscription_returns_correct_plan_pro(self, pro_user):
        """Pro user subscription returns plan=pro, credits, max_conversations=-1"""
        response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=auth_headers(pro_user["token"])
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan"] == "pro", f"Expected plan=pro, got {data['plan']}"
        assert data["max_conversations"] == -1, f"Expected max_convs=-1 (unlimited), got {data['max_conversations']}"
        print(f"PASSED: Pro user subscription: plan={data['plan']}, credits={data['credits']}, max_convs={data['max_conversations']}")
    
    def test_broke_user_has_zero_credits(self, broke_user):
        """Broke user has 0 credits"""
        response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=auth_headers(broke_user["token"])
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["credits"] == 0, f"Expected credits=0, got {data['credits']}"
        print(f"PASSED: Broke user has 0 credits")


# =============================================
# CONVERSATION LIMIT ENFORCEMENT
# =============================================

class TestConversationLimits:
    """Tests for conversation limits based on plan"""
    
    def test_free_user_blocked_at_4th_conversation(self, free_user):
        """Free user with 3 conversations gets 403 when creating 4th"""
        # First verify user has 3 conversations
        list_response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(free_user["token"])
        )
        conv_count = len(list_response.json())
        print(f"Free user current conversation count: {conv_count}")
        
        # Try to create a new conversation
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(free_user["token"]),
            json={"native_language": "en", "target_language": "es"}
        )
        
        if conv_count >= 3:
            assert response.status_code == 403, f"Expected 403 when at limit, got {response.status_code}"
            error_detail = response.json().get("detail", "")
            assert "3" in error_detail or "maximum" in error_detail.lower(), f"Error should mention limit: {error_detail}"
            print(f"PASSED: Free user blocked at 4th conversation with 403. Error: {error_detail[:100]}")
        else:
            # User doesn't have 3 convs yet, this test is not applicable
            pytest.skip(f"Free user only has {conv_count} conversations, need 3 to test limit")
    
    def test_plus_user_blocked_at_11th_conversation(self, plus_user):
        """Plus user with 10 conversations gets 403 when creating 11th"""
        list_response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(plus_user["token"])
        )
        conv_count = len(list_response.json())
        print(f"Plus user current conversation count: {conv_count}")
        
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(plus_user["token"]),
            json={"native_language": "en", "target_language": "fr"}
        )
        
        if conv_count >= 10:
            assert response.status_code == 403, f"Expected 403 when at limit, got {response.status_code}"
            error_detail = response.json().get("detail", "")
            assert "10" in error_detail or "maximum" in error_detail.lower(), f"Error should mention limit: {error_detail}"
            print(f"PASSED: Plus user blocked at 11th conversation with 403. Error: {error_detail[:100]}")
        else:
            pytest.skip(f"Plus user only has {conv_count} conversations, need 10 to test limit")
    
    def test_pro_user_can_create_unlimited_conversations(self, pro_user):
        """Pro user can create conversations beyond 10 (unlimited)"""
        list_response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(pro_user["token"])
        )
        conv_count = len(list_response.json())
        print(f"Pro user current conversation count: {conv_count}")
        
        # Pro should be able to create regardless of count (since they're unlimited)
        # We just verify they don't get 403 like other plans would at high counts
        response = requests.post(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(pro_user["token"]),
            json={"native_language": "en", "target_language": "de"}
        )
        
        # Should succeed (201) or might fail for other reasons, but NOT 403 for limit
        assert response.status_code != 403 or "limit" not in response.text.lower(), \
            f"Pro user should NOT be limited. Got {response.status_code}: {response.text[:200]}"
        
        if response.status_code == 200:
            # Clean up: delete the created conversation
            conv_id = response.json().get("id")
            if conv_id:
                requests.delete(
                    f"{BASE_URL}/api/conversations/{conv_id}",
                    headers=auth_headers(pro_user["token"])
                )
            print(f"PASSED: Pro user can create unlimited conversations (was at {conv_count})")
        else:
            print(f"INFO: Pro user request status: {response.status_code}")
    
    def test_error_message_includes_plan_limit(self, free_user):
        """Conversation limit error message includes actionable advice"""
        list_response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(free_user["token"])
        )
        conv_count = len(list_response.json())
        
        if conv_count >= 3:
            response = requests.post(
                f"{BASE_URL}/api/conversations",
                headers=auth_headers(free_user["token"]),
                json={"native_language": "en", "target_language": "es"}
            )
            assert response.status_code == 403
            
            error_detail = response.json().get("detail", "")
            # Should mention upgrade or delete
            has_actionable_advice = "upgrade" in error_detail.lower() or "delete" in error_detail.lower()
            assert has_actionable_advice, f"Error should include upgrade/delete advice: {error_detail}"
            print(f"PASSED: Error includes actionable advice: {error_detail}")
        else:
            pytest.skip(f"Need user at limit to test error message")


# =============================================
# CREDIT CHECK ON MESSAGE ENDPOINTS
# =============================================

class TestCreditCheckOnMessages:
    """Tests for credit checks on message endpoints"""
    
    def _get_first_conversation(self, user_token):
        """Helper to get user's first conversation ID"""
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=auth_headers(user_token)
        )
        convs = response.json()
        return convs[0]["id"] if convs else None
    
    def test_zero_credit_user_gets_402_on_non_streaming_message(self, broke_user):
        """User with 0 credits gets 402 on POST /conversations/{id}/messages"""
        conv_id = self._get_first_conversation(broke_user["token"])
        if not conv_id:
            pytest.skip("Broke user has no conversations")
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            headers=auth_headers(broke_user["token"]),
            json={"content": "Hello test message"}
        )
        
        assert response.status_code == 402, f"Expected 402 for insufficient credits, got {response.status_code}"
        error_detail = response.json().get("detail", "")
        assert "credit" in error_detail.lower() or "upgrade" in error_detail.lower(), \
            f"Error should mention credits: {error_detail}"
        print(f"PASSED: Zero-credit user gets 402 on non-streaming message. Error: {error_detail}")
    
    def test_zero_credit_user_gets_402_on_streaming_message(self, broke_user):
        """User with 0 credits gets 402 on POST /conversations/{id}/messages/stream"""
        conv_id = self._get_first_conversation(broke_user["token"])
        if not conv_id:
            pytest.skip("Broke user has no conversations")
        
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages/stream",
            headers=auth_headers(broke_user["token"]),
            json={"content": "Hello test message"}
        )
        
        assert response.status_code == 402, f"Expected 402 for insufficient credits, got {response.status_code}"
        print(f"PASSED: Zero-credit user gets 402 on streaming message")
    
    def test_zero_credit_user_gets_402_on_voice_message(self, broke_user):
        """User with 0 credits gets 402 on POST /conversations/{id}/voice-message"""
        conv_id = self._get_first_conversation(broke_user["token"])
        if not conv_id:
            pytest.skip("Broke user has no conversations")
        
        # Create minimal valid audio-like content
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/voice-message",
            headers={"Authorization": f"Bearer {broke_user['token']}"},
            files={"audio": ("test.webm", b"fake audio data", "audio/webm")}
        )
        
        # Should get 402 before processing audio (credit check happens first)
        assert response.status_code == 402, f"Expected 402 for insufficient credits, got {response.status_code}"
        print(f"PASSED: Zero-credit user gets 402 on voice message")
    
    def test_user_with_credits_can_send_messages(self, free_user):
        """User with credits (free_user has 50) can successfully send messages"""
        # Verify user has credits
        sub_response = requests.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=auth_headers(free_user["token"])
        )
        credits = sub_response.json().get("credits", 0)
        
        if credits <= 0:
            pytest.skip("Free user has no credits to test with")
        
        conv_id = self._get_first_conversation(free_user["token"])
        if not conv_id:
            pytest.skip("Free user has no conversations")
        
        # This should succeed (not return 402)
        response = requests.post(
            f"{BASE_URL}/api/conversations/{conv_id}/messages",
            headers=auth_headers(free_user["token"]),
            json={"content": "Test message from user with credits"}
        )
        
        # Should NOT be 402
        assert response.status_code != 402, f"User with {credits} credits should not get 402"
        print(f"PASSED: User with {credits} credits can send messages (status: {response.status_code})")


# =============================================
# CREATE ORDER ENDPOINT
# =============================================

class TestCreateOrderEndpoint:
    """Tests for POST /api/payments/create-order"""
    
    def test_create_order_rejects_free_plan(self, free_user):
        """POST /create-order rejects 'free' plan with 400"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=auth_headers(free_user["token"]),
            json={"plan": "free"}
        )
        
        assert response.status_code == 400, f"Expected 400 for free plan, got {response.status_code}"
        error_detail = response.json().get("detail", "")
        assert "invalid" in error_detail.lower(), f"Error should say invalid plan: {error_detail}"
        print(f"PASSED: create-order rejects free plan with 400")
    
    def test_create_order_creates_valid_razorpay_order_plus(self, free_user):
        """POST /create-order creates valid Razorpay order for 'plus'"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=auth_headers(free_user["token"]),
            json={"plan": "plus"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "order_id" in data, "Should have order_id"
        assert data["order_id"].startswith("order_"), f"Order ID should start with 'order_'"
        assert "amount" in data, "Should have amount"
        assert "currency" in data, "Should have currency"
        assert data["currency"] == "USD", f"Expected USD, got {data['currency']}"
        assert "key_id" in data, "Should have key_id for Razorpay"
        
        # $14.99 = 1499 cents (stored in plan as 1499)
        # Razorpay expects smallest unit, so 1499 cents = 1499
        print(f"PASSED: Plus plan Razorpay order created. order_id={data['order_id']}, amount={data['amount']}")
    
    def test_create_order_creates_valid_razorpay_order_pro(self, free_user):
        """POST /create-order creates valid Razorpay order for 'pro'"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=auth_headers(free_user["token"]),
            json={"plan": "pro"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data["order_id"].startswith("order_"), f"Order ID should start with 'order_'"
        # $29.99 = 2999 cents
        print(f"PASSED: Pro plan Razorpay order created. order_id={data['order_id']}, amount={data['amount']}")


# =============================================
# VERIFY PAYMENT ENDPOINT
# =============================================

class TestVerifyPaymentEndpoint:
    """Tests for POST /api/payments/verify-payment"""
    
    def test_verify_payment_rejects_invalid_signature(self, free_user):
        """POST /verify-payment rejects invalid Razorpay signature with 400"""
        response = requests.post(
            f"{BASE_URL}/api/payments/verify-payment",
            headers=auth_headers(free_user["token"]),
            json={
                "razorpay_order_id": "order_fake123",
                "razorpay_payment_id": "pay_fake456",
                "razorpay_signature": "invalid_signature_here",
                "plan": "plus"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid signature, got {response.status_code}"
        error_detail = response.json().get("detail", "")
        assert "verification" in error_detail.lower() or "failed" in error_detail.lower(), \
            f"Error should mention verification failed: {error_detail}"
        print(f"PASSED: verify-payment rejects invalid signature with 400")


# =============================================
# CREDIT HISTORY ENDPOINT
# =============================================

class TestCreditHistoryEndpoint:
    """Tests for GET /api/payments/credit-history"""
    
    def test_credit_history_returns_paginated_transactions(self, free_user):
        """GET /credit-history returns paginated results"""
        response = requests.get(
            f"{BASE_URL}/api/payments/credit-history",
            headers=auth_headers(free_user["token"])
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "transactions" in data, "Should have transactions array"
        assert "total" in data, "Should have total count"
        assert "page" in data, "Should have page number"
        assert "pages" in data, "Should have total pages"
        print(f"PASSED: Credit history returns paginated data (total={data['total']}, pages={data['pages']})")
    
    def test_credit_history_filter_by_usage(self, free_user):
        """GET /credit-history?type=usage returns only usage transactions"""
        response = requests.get(
            f"{BASE_URL}/api/payments/credit-history?type=usage",
            headers=auth_headers(free_user["token"])
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned transactions should be type=usage
        for tx in data["transactions"]:
            assert tx["type"] == "usage", f"Expected type=usage, got {tx['type']}"
        print(f"PASSED: Filter type=usage works (found {len(data['transactions'])} usage transactions)")
    
    def test_credit_history_filter_by_purchase(self, free_user):
        """GET /credit-history?type=purchase returns only purchase transactions"""
        response = requests.get(
            f"{BASE_URL}/api/payments/credit-history?type=purchase",
            headers=auth_headers(free_user["token"])
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for tx in data["transactions"]:
            assert tx["type"] == "purchase", f"Expected type=purchase, got {tx['type']}"
        print(f"PASSED: Filter type=purchase works (found {len(data['transactions'])} purchase transactions)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
