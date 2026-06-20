def test_register_user(client):
    response = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "full_name": "New User",
        "password": "Password@123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "customer"


def test_register_duplicate_email(client, test_user):
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "anotheruser",
        "full_name": "Another User",
        "password": "Password@123",
    })
    assert response.status_code == 400


def test_login_success(client, test_user):
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Test@1234",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_wrong_password(client, test_user):
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "Password@123",
    })
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_get_current_user_no_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


def test_change_password(client, auth_headers):
    response = client.post("/api/v1/auth/change-password", headers=auth_headers, json={
        "current_password": "Test@1234",
        "new_password": "NewPassword@123",
    })
    assert response.status_code == 200


def test_change_password_wrong_current(client, auth_headers):
    response = client.post("/api/v1/auth/change-password", headers=auth_headers, json={
        "current_password": "WrongPassword",
        "new_password": "NewPassword@123",
    })
    assert response.status_code == 400
