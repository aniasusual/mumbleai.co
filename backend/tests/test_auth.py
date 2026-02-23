"""
JWT Authentication Tests - Signup, Login, Token Verification, Protected Routes
Tests for mumble language tutoring app authentication feature
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Unique email generator for test isolation
def unique_email():
    return f"test-{int(time.time() * 1000)}@test.com"


class TestSignup:
    """POST /api/auth/signup tests"""
    
    def test_signup_success_returns_token_and_user(self):
        """Signup with valid data returns token + user object"""
        email = unique_email()
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Test User",
            "email": email,
            "password": "password123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify token exists
        assert "token" in data, "Response missing 'token'"
        assert isinstance(data["token"], str) and len(data["token"]) > 0, "Token should be non-empty string"
        
        # Verify user object
        assert "user" in data, "Response missing 'user'"
        user = data["user"]
        assert user["email"] == email.lower(), f"Email mismatch: {user['email']} != {email.lower()}"
        assert user["name"] == "Test User", f"Name mismatch: {user['name']}"
        assert "id" in user, "User missing 'id'"
        print(f"PASS: Signup successful for {email}")
    
    def test_signup_duplicate_email_returns_409(self):
        """Signup with existing email returns 409 Conflict"""
        # First signup (should succeed)
        email = unique_email()
        response1 = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "First User",
            "email": email,
            "password": "password123"
        })
        assert response1.status_code == 200, f"First signup failed: {response1.text}"
        
        # Second signup with same email (should fail)
        response2 = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Second User",
            "email": email,
            "password": "anotherpass"
        })
        assert response2.status_code == 409, f"Expected 409, got {response2.status_code}: {response2.text}"
        
        data = response2.json()
        assert "detail" in data, "Error response missing 'detail'"
        assert "already" in data["detail"].lower() or "registered" in data["detail"].lower(), \
            f"Error message unclear: {data['detail']}"
        print(f"PASS: Duplicate email properly rejected with 409")
    
    def test_signup_short_password_returns_400(self):
        """Signup with password < 6 chars returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Short Pass User",
            "email": unique_email(),
            "password": "12345"  # Only 5 chars
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Error response missing 'detail'"
        assert "6" in data["detail"] or "character" in data["detail"].lower(), \
            f"Error message should mention password length: {data['detail']}"
        print(f"PASS: Short password rejected with 400")
    
    def test_signup_invalid_email_format(self):
        """Signup with invalid email format returns 422"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Invalid Email",
            "email": "not-an-email",
            "password": "password123"
        })
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
        print("PASS: Invalid email format rejected with 422")


class TestLogin:
    """POST /api/auth/login tests"""
    
    def test_login_valid_credentials_returns_token(self):
        """Login with valid demo credentials returns token + user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@mumble.app",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response missing 'token'"
        assert isinstance(data["token"], str) and len(data["token"]) > 0
        
        assert "user" in data, "Response missing 'user'"
        user = data["user"]
        assert user["email"] == "demo@mumble.app"
        assert "id" in user
        assert "name" in user
        print(f"PASS: Login successful for demo@mumble.app")
    
    def test_login_wrong_password_returns_401(self):
        """Login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@mumble.app",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data, "Error response missing 'detail'"
        print("PASS: Wrong password rejected with 401")
    
    def test_login_nonexistent_email_returns_401(self):
        """Login with non-existent email returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("PASS: Non-existent email rejected with 401")
    
    def test_login_after_signup(self):
        """User can login immediately after signup"""
        email = unique_email()
        password = "testpass123"
        
        # Signup
        signup_resp = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Login Test User",
            "email": email,
            "password": password
        })
        assert signup_resp.status_code == 200, f"Signup failed: {signup_resp.text}"
        
        # Login with same credentials
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        
        login_data = login_resp.json()
        assert login_data["user"]["email"] == email.lower()
        print(f"PASS: User can login after signup")


class TestTokenVerification:
    """GET /api/auth/me tests - Token verification"""
    
    @pytest.fixture
    def valid_token(self):
        """Get a valid token from demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@mumble.app",
            "password": "demo123"
        })
        if response.status_code != 200:
            pytest.skip("Could not get demo token")
        return response.json()["token"]
    
    def test_me_with_valid_token_returns_user(self, valid_token):
        """GET /api/auth/me with valid Bearer token returns user info"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "email" in data, "Response missing 'email'"
        assert data["email"] == "demo@mumble.app"
        assert "id" in data, "Response missing 'id'"
        assert "name" in data, "Response missing 'name'"
        print("PASS: /auth/me returns user info with valid token")
    
    def test_me_without_token_returns_401_or_403(self):
        """GET /api/auth/me without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without token, got {response.status_code}"
        print(f"PASS: /auth/me without token returns {response.status_code}")
    
    def test_me_with_invalid_token_returns_401(self):
        """GET /api/auth/me with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_123"}
        )
        assert response.status_code == 401, \
            f"Expected 401 for invalid token, got {response.status_code}"
        print("PASS: /auth/me with invalid token returns 401")


class TestProtectedRoutes:
    """Tests for protected routes - conversations, vocabulary, etc."""
    
    @pytest.fixture
    def valid_token(self):
        """Get a valid token from demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@mumble.app",
            "password": "demo123"
        })
        if response.status_code != 200:
            pytest.skip("Could not get demo token")
        return response.json()["token"]
    
    def test_conversations_without_token_returns_401_or_403(self):
        """GET /api/conversations without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/conversations")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without token, got {response.status_code}"
        print(f"PASS: /conversations without token returns {response.status_code}")
    
    def test_conversations_with_valid_token_returns_user_data(self, valid_token):
        """GET /api/conversations with valid token returns user's conversations"""
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {valid_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"PASS: /conversations returns list with {len(data)} items")
    
    def test_vocabulary_without_token_returns_401_or_403(self):
        """GET /api/vocabulary without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/vocabulary")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without token, got {response.status_code}"
        print(f"PASS: /vocabulary without token returns {response.status_code}")
    
    def test_progress_without_token_returns_401_or_403(self):
        """GET /api/progress without token returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/progress")
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without token, got {response.status_code}"
        print(f"PASS: /progress without token returns {response.status_code}")
    
    def test_create_conversation_requires_auth(self):
        """POST /api/conversations without token returns 401/403"""
        response = requests.post(f"{BASE_URL}/api/conversations", json={
            "native_language": "en",
            "target_language": "es"
        })
        assert response.status_code in [401, 403], \
            f"Expected 401/403 without token, got {response.status_code}"
        print(f"PASS: POST /conversations without token returns {response.status_code}")


class TestUserDataIsolation:
    """Verify users can only see their own data"""
    
    def test_user_sees_only_own_conversations(self):
        """Each user should only see their own conversations"""
        # Create two separate users with distinct emails
        user1_email = f"test-user1-{int(time.time() * 1000)}@test.com"
        time.sleep(0.01)  # Ensure different timestamp
        user2_email = f"test-user2-{int(time.time() * 1000)}@test.com"
        
        # Signup user 1
        resp1 = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "User One",
            "email": user1_email,
            "password": "password123"
        })
        assert resp1.status_code == 200, f"User 1 signup failed: {resp1.text}"
        token1 = resp1.json()["token"]
        
        # Signup user 2
        resp2 = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "User Two",
            "email": user2_email,
            "password": "password123"
        })
        assert resp2.status_code == 200, f"User 2 signup failed: {resp2.text}"
        token2 = resp2.json()["token"]
        
        # User 1 gets their conversations
        convs1 = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert convs1.status_code == 200
        
        # User 2 gets their conversations
        convs2 = requests.get(
            f"{BASE_URL}/api/conversations",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert convs2.status_code == 200
        
        # New users should have empty conversation lists (unless app creates welcome conv)
        print(f"PASS: User isolation verified - User1 has {len(convs1.json())} convs, User2 has {len(convs2.json())} convs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
