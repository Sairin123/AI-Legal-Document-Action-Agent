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
    assert response.json() == {"status": "backend running"}

def test_user_signup(client):
    response = client.post(
        "/auth/signup",
        json={"email": "test@legalagent.ai", "password": "securepassword123"}
    )
    assert response.status_code in [200, 400] # 400 if already exists

def test_user_login(client):
    response = client.post(
        "/auth/login",
        json={"email": "test@legalagent.ai", "password": "securepassword123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_get_stats(client):
    response = client.get("/api/stats")
    assert response.status_code == 200
    assert "processed" in response.json()
