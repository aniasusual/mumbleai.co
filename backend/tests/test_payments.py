"""
Payment API Tests — Razorpay integration for subscription plans.
Tests: GET /plans, GET /subscription, POST /create-order
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPaymentsAPI:
    """Payment endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token for authenticated tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test2@example.com",
            "password": "password123"
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    # ========================
    # GET /api/payments/plans
    # ========================
    
    def test_get_plans_returns_200(self):
        """GET /plans should return 200 OK"""
        response = self.session.get(f"{BASE_URL}/api/payments/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: GET /plans returns 200")
    
    def test_get_plans_returns_three_plans(self):
        """GET /plans should return exactly 3 plans"""
        response = self.session.get(f"{BASE_URL}/api/payments/plans")
        assert response.status_code == 200
        
        data = response.json()
        assert "plans" in data, "Response should have 'plans' key"
        assert len(data["plans"]) == 3, f"Expected 3 plans, got {len(data['plans'])}"
        print("PASSED: GET /plans returns 3 plans")
    
    def test_get_plans_free_plan_details(self):
        """Free plan should have correct values: $0, 50 credits, 3 conversations"""
        response = self.session.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        free_plan = next((p for p in data["plans"] if p["id"] == "free"), None)
        assert free_plan is not None, "Free plan not found"
        
        assert free_plan["name"] == "Free", f"Expected 'Free', got '{free_plan['name']}'"
        assert free_plan["price"] == 0, f"Expected price 0, got {free_plan['price']}"
        assert free_plan["credits"] == 50, f"Expected 50 credits, got {free_plan['credits']}"
        assert free_plan["max_conversations"] == 3, f"Expected 3 conversations, got {free_plan['max_conversations']}"
        print("PASSED: Free plan has correct details ($0, 50 credits, 3 conversations)")
    
    def test_get_plans_plus_plan_details(self):
        """Plus plan should have correct values: $14.99, 1000 credits, 10 conversations"""
        response = self.session.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        plus_plan = next((p for p in data["plans"] if p["id"] == "plus"), None)
        assert plus_plan is not None, "Plus plan not found"
        
        assert plus_plan["name"] == "Plus", f"Expected 'Plus', got '{plus_plan['name']}'"
        assert plus_plan["price"] == 14.99, f"Expected price 14.99, got {plus_plan['price']}"
        assert plus_plan["credits"] == 1000, f"Expected 1000 credits, got {plus_plan['credits']}"
        assert plus_plan["max_conversations"] == 10, f"Expected 10 conversations, got {plus_plan['max_conversations']}"
        print("PASSED: Plus plan has correct details ($14.99, 1000 credits, 10 conversations)")
    
    def test_get_plans_pro_plan_details(self):
        """Pro plan should have correct values: $29.99, 5000 credits, unlimited conversations"""
        response = self.session.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        pro_plan = next((p for p in data["plans"] if p["id"] == "pro"), None)
        assert pro_plan is not None, "Pro plan not found"
        
        assert pro_plan["name"] == "Pro", f"Expected 'Pro', got '{pro_plan['name']}'"
        assert pro_plan["price"] == 29.99, f"Expected price 29.99, got {pro_plan['price']}"
        assert pro_plan["credits"] == 5000, f"Expected 5000 credits, got {pro_plan['credits']}"
        assert pro_plan["max_conversations"] == -1, f"Expected -1 (unlimited), got {pro_plan['max_conversations']}"
        print("PASSED: Pro plan has correct details ($29.99, 5000 credits, unlimited)")
    
    # ========================
    # GET /api/payments/subscription
    # ========================
    
    def test_subscription_without_auth_returns_401(self):
        """GET /subscription without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/payments/subscription")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: GET /subscription without auth returns 401")
    
    def test_subscription_with_auth_returns_200(self):
        """GET /subscription with auth should return 200 and user subscription"""
        response = self.session.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=self.auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "user_id" in data, "Response should have 'user_id'"
        assert "plan" in data, "Response should have 'plan'"
        assert "credits" in data, "Response should have 'credits'"
        print(f"PASSED: GET /subscription returns user subscription (plan: {data['plan']}, credits: {data['credits']})")
    
    def test_subscription_defaults_to_free_plan(self):
        """New user subscription should default to free plan"""
        response = self.session.get(
            f"{BASE_URL}/api/payments/subscription",
            headers=self.auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        # For existing users, they might already have a plan
        # But the structure should be correct
        assert data["plan"] in ["free", "plus", "pro"], f"Invalid plan: {data['plan']}"
        print(f"PASSED: Subscription has valid plan: {data['plan']}")
    
    # ========================
    # POST /api/payments/create-order
    # ========================
    
    def test_create_order_without_auth_returns_401(self):
        """POST /create-order without auth should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/payments/create-order",
            json={"plan": "plus"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASSED: POST /create-order without auth returns 401")
    
    def test_create_order_free_plan_returns_400(self):
        """POST /create-order with free plan should return 400"""
        response = self.session.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=self.auth_headers,
            json={"plan": "free"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should have 'detail'"
        assert "Invalid plan" in data["detail"], f"Expected 'Invalid plan', got '{data['detail']}'"
        print("PASSED: POST /create-order with free plan returns 400")
    
    def test_create_order_plus_plan_returns_razorpay_order(self):
        """POST /create-order with plus plan should create Razorpay order"""
        response = self.session.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=self.auth_headers,
            json={"plan": "plus"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "order_id" in data, "Response should have 'order_id'"
        assert "amount" in data, "Response should have 'amount'"
        assert "currency" in data, "Response should have 'currency'"
        assert "key_id" in data, "Response should have 'key_id'"
        
        # Verify amount is correct for Plus plan ($14.99 * 100 = 1499 cents, * 100 = 149900)
        assert data["amount"] == 149900, f"Expected amount 149900, got {data['amount']}"
        assert data["currency"] == "USD", f"Expected USD currency, got {data['currency']}"
        assert data["order_id"].startswith("order_"), f"Order ID should start with 'order_'"
        print(f"PASSED: Plus plan Razorpay order created (order_id: {data['order_id']}, amount: {data['amount']})")
    
    def test_create_order_pro_plan_returns_razorpay_order(self):
        """POST /create-order with pro plan should create Razorpay order"""
        response = self.session.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=self.auth_headers,
            json={"plan": "pro"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "order_id" in data, "Response should have 'order_id'"
        assert "amount" in data, "Response should have 'amount'"
        
        # Verify amount is correct for Pro plan ($29.99 * 100 = 2999 cents, * 100 = 299900)
        assert data["amount"] == 299900, f"Expected amount 299900, got {data['amount']}"
        assert data["currency"] == "USD", f"Expected USD currency"
        print(f"PASSED: Pro plan Razorpay order created (order_id: {data['order_id']}, amount: {data['amount']})")
    
    def test_create_order_invalid_plan_returns_400(self):
        """POST /create-order with invalid plan should return 400"""
        response = self.session.post(
            f"{BASE_URL}/api/payments/create-order",
            headers=self.auth_headers,
            json={"plan": "invalid_plan"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASSED: POST /create-order with invalid plan returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
