def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_google_login_url(client):
    response = client.get("/api/auth/google/login-url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "accounts.google.com" in data["url"]


def test_violation_moderation():
    from dsa_interviewer.api.interview import _contains_violation
    assert _contains_violation("hello there") is False
    assert _contains_violation("kill yourself") is True

