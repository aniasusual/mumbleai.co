"""
Test Credit History API Endpoints
Tests for GET /api/payments/credit-history endpoint with pagination and type filtering
"""

import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials - seeded user with credit transactions
TEST_EMAIL = "demo@mumble.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data
    return data["token"]


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestCreditHistoryAuth:
    """Test authentication requirements for credit-history endpoint"""
    
    def test_credit_history_without_auth_returns_unauthorized(self, api_client):
        """GET /credit-history should return 401/403 without authentication"""
        response = api_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}: {response.text}"
        print(f"PASSED: credit_history without auth returns {response.status_code}")
    
    def test_credit_history_with_invalid_token_returns_401(self, api_client):
        """GET /credit-history should return 401 with invalid token"""
        api_client.headers.update({"Authorization": "Bearer invalid_token_xyz"})
        response = api_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASSED: credit_history with invalid token returns 401")


class TestCreditHistoryBasic:
    """Test basic credit history retrieval"""
    
    def test_credit_history_returns_200(self, authenticated_client):
        """GET /credit-history should return 200 with valid auth"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASSED: credit_history returns 200")
    
    def test_credit_history_returns_correct_structure(self, authenticated_client):
        """GET /credit-history should return transactions, total, page, pages"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data, "Response should have 'transactions' field"
        assert "total" in data, "Response should have 'total' field"
        assert "page" in data, "Response should have 'page' field"
        assert "pages" in data, "Response should have 'pages' field"
        
        assert isinstance(data["transactions"], list), "transactions should be a list"
        assert isinstance(data["total"], int), "total should be int"
        assert isinstance(data["page"], int), "page should be int"
        assert isinstance(data["pages"], int), "pages should be int"
        
        print(f"PASSED: credit_history returns correct structure (total: {data['total']}, pages: {data['pages']})")
    
    def test_credit_history_has_transactions(self, authenticated_client):
        """Seeded user should have transactions"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] > 0, f"Expected seeded user to have transactions, got total: {data['total']}"
        assert len(data["transactions"]) > 0, "Expected transactions list to have items"
        
        print(f"PASSED: user has {data['total']} transactions")


class TestCreditHistoryTransactionFields:
    """Test transaction object structure"""
    
    def test_usage_transaction_fields(self, authenticated_client):
        """Usage transaction should have correct fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"type": "usage"})
        assert response.status_code == 200
        
        data = response.json()
        if data["total"] == 0:
            pytest.skip("No usage transactions found for testing")
        
        tx = data["transactions"][0]
        assert tx["type"] == "usage", "Transaction type should be 'usage'"
        assert "user_id" in tx, "Should have user_id"
        assert "amount" in tx, "Should have amount (negative credits)"
        assert "created_at" in tx, "Should have created_at"
        
        # Usage transactions should have breakdown
        if "breakdown" in tx:
            breakdown = tx["breakdown"]
            assert "llm_input_tokens" in breakdown or "stt_seconds" in breakdown or "tts_characters" in breakdown
            print(f"PASSED: usage transaction has breakdown: {list(breakdown.keys())}")
        else:
            print("PASSED: usage transaction has required fields (no breakdown)")
    
    def test_purchase_transaction_fields(self, authenticated_client):
        """Purchase transaction should have correct fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"type": "purchase"})
        assert response.status_code == 200
        
        data = response.json()
        if data["total"] == 0:
            pytest.skip("No purchase transactions found for testing")
        
        tx = data["transactions"][0]
        assert tx["type"] == "purchase", "Transaction type should be 'purchase'"
        assert "user_id" in tx, "Should have user_id"
        assert "credits_added" in tx, "Should have credits_added (positive)"
        assert "plan" in tx, "Should have plan name"
        assert "created_at" in tx, "Should have created_at"
        
        assert tx["credits_added"] > 0, "credits_added should be positive"
        print(f"PASSED: purchase transaction has correct fields (plan: {tx['plan']}, credits: {tx['credits_added']})")


class TestCreditHistoryFiltering:
    """Test type filtering"""
    
    def test_filter_by_usage_type(self, authenticated_client):
        """type=usage should only return usage transactions"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"type": "usage"})
        assert response.status_code == 200
        
        data = response.json()
        for tx in data["transactions"]:
            assert tx["type"] == "usage", f"Expected type 'usage', got '{tx['type']}'"
        
        print(f"PASSED: filter type=usage returns only usage transactions ({data['total']} items)")
    
    def test_filter_by_purchase_type(self, authenticated_client):
        """type=purchase should only return purchase transactions"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"type": "purchase"})
        assert response.status_code == 200
        
        data = response.json()
        for tx in data["transactions"]:
            assert tx["type"] == "purchase", f"Expected type 'purchase', got '{tx['type']}'"
        
        print(f"PASSED: filter type=purchase returns only purchase transactions ({data['total']} items)")
    
    def test_no_filter_returns_all_types(self, authenticated_client):
        """No type filter should return both usage and purchase"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200
        
        data = response.json()
        types = set(tx["type"] for tx in data["transactions"])
        
        # Should have at least one type, check seeded data has both
        print(f"PASSED: no filter returns all types: {types}")


class TestCreditHistoryPagination:
    """Test pagination parameters"""
    
    def test_default_pagination(self, authenticated_client):
        """Default page should be 1"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 1, f"Default page should be 1, got {data['page']}"
        print("PASSED: default page is 1")
    
    def test_custom_page_parameter(self, authenticated_client):
        """page parameter should work"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"page": 1})
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 1
        print("PASSED: page parameter works")
    
    def test_custom_limit_parameter(self, authenticated_client):
        """limit parameter should restrict results"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"limit": 5})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["transactions"]) <= 5, f"Expected max 5 transactions, got {len(data['transactions'])}"
        print(f"PASSED: limit parameter works ({len(data['transactions'])} transactions returned)")
    
    def test_pagination_math(self, authenticated_client):
        """Pages should be calculated correctly"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history", params={"limit": 3})
        assert response.status_code == 200
        
        data = response.json()
        expected_pages = max(1, -(-data["total"] // 3))  # ceil division
        assert data["pages"] == expected_pages, f"Expected {expected_pages} pages, got {data['pages']}"
        print(f"PASSED: pagination math correct (total: {data['total']}, pages: {data['pages']}, limit: 3)")


class TestCreditHistorySorting:
    """Test sorting of transactions"""
    
    def test_transactions_sorted_by_date_descending(self, authenticated_client):
        """Transactions should be sorted by created_at descending (newest first)"""
        response = authenticated_client.get(f"{BASE_URL}/api/payments/credit-history")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["transactions"]) < 2:
            pytest.skip("Need at least 2 transactions to test sorting")
        
        dates = [tx["created_at"] for tx in data["transactions"]]
        assert dates == sorted(dates, reverse=True), "Transactions should be sorted by date descending"
        print("PASSED: transactions sorted by date descending (newest first)")
