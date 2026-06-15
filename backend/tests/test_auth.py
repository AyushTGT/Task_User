def test_register(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "name": "New User",
        "password": "securepass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register", json={"email": "dup@example.com", "name": "A", "password": "pass"})
    resp = client.post("/api/v1/auth/register", json={"email": "dup@example.com", "name": "B", "password": "pass"})
    assert resp.status_code == 409


def test_login_success(client):
    client.post("/api/v1/auth/register", json={"email": "login@example.com", "name": "Login User", "password": "mypassword"})
    resp = client.post("/api/v1/auth/login", json={"email": "login@example.com", "password": "mypassword"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={"email": "wrong@example.com", "name": "Wrong", "password": "correct"})
    resp = client.post("/api/v1/auth/login", json={"email": "wrong@example.com", "password": "incorrect"})
    assert resp.status_code == 401


def test_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_me_unauthorized(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403
