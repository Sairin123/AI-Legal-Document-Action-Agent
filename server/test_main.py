from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
import pytest

# Setup test database
Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "LexAgent backend running", "version": "2.0.0"}

def test_user_signup(client):
    response = client.post(
        "/auth/signup",
        json={"email": "test@legalagent.ai", "password": "securepassword123"}
    )
    assert response.status_code in [201, 400] # 201 Created or 400 if already exists

def test_user_login(client):
    response = client.post(
        "/auth/login",
        json={"email": "test@legalagent.ai", "password": "securepassword123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_stats(client):
    # Authenticate to get valid JWT token
    login_res = client.post(
        "/auth/login",
        json={"email": "test@legalagent.ai", "password": "securepassword123"}
    )
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    response = client.get("/api/stats", headers=headers)
    assert response.status_code == 200
    assert "processed" in response.json()
