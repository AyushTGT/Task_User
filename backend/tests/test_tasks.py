def test_create_task(client, auth_headers):
    resp = client.post("/api/v1/tasks", json={
        "title": "My First Task",
        "description": "Test description",
        "status": "todo",
        "priority": "high",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My First Task"
    assert data["priority"] == "high"
    assert data["status"] == "todo"


def test_create_task_empty_title(client, auth_headers):
    resp = client.post("/api/v1/tasks", json={"title": "  "}, headers=auth_headers)
    assert resp.status_code == 422


def test_list_tasks(client, auth_headers):
    client.post("/api/v1/tasks", json={"title": "Task A", "status": "todo"}, headers=auth_headers)
    client.post("/api/v1/tasks", json={"title": "Task B", "status": "done"}, headers=auth_headers)
    resp = client.get("/api/v1/tasks", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "data" in data
    assert "pagination" in data
    assert len(data["data"]) >= 2


def test_filter_tasks_by_status(client, auth_headers):
    client.post("/api/v1/tasks", json={"title": "Done Task", "status": "done"}, headers=auth_headers)
    resp = client.get("/api/v1/tasks?status=done", headers=auth_headers)
    assert resp.status_code == 200
    for task in resp.json()["data"]:
        assert task["status"] == "done"


def test_search_tasks(client, auth_headers):
    client.post("/api/v1/tasks", json={"title": "Unique Search Term XYZ"}, headers=auth_headers)
    resp = client.get("/api/v1/tasks?search=Unique+Search+Term", headers=auth_headers)
    assert resp.status_code == 200
    assert any("XYZ" in t["title"] for t in resp.json()["data"])


def test_get_task(client, auth_headers):
    create_resp = client.post("/api/v1/tasks", json={"title": "Fetch Me"}, headers=auth_headers)
    task_id = create_resp.json()["id"]
    resp = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == task_id


def test_update_task(client, auth_headers):
    create_resp = client.post("/api/v1/tasks", json={"title": "Old Title"}, headers=auth_headers)
    task_id = create_resp.json()["id"]
    resp = client.patch(f"/api/v1/tasks/{task_id}", json={"title": "New Title", "priority": "urgent"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"
    assert resp.json()["priority"] == "urgent"


def test_delete_task(client, auth_headers):
    create_resp = client.post("/api/v1/tasks", json={"title": "Delete Me"}, headers=auth_headers)
    task_id = create_resp.json()["id"]
    del_resp = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    get_resp = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404


def test_cannot_access_others_task(client):
    # Register two users
    client.post("/api/v1/auth/register", json={"email": "user1@example.com", "name": "U1", "password": "pass"})
    r1 = client.post("/api/v1/auth/login", json={"email": "user1@example.com", "password": "pass"})
    headers1 = {"Authorization": f"Bearer {r1.json()['access_token']}"}

    client.post("/api/v1/auth/register", json={"email": "user2@example.com", "name": "U2", "password": "pass"})
    r2 = client.post("/api/v1/auth/login", json={"email": "user2@example.com", "password": "pass"})
    headers2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}

    task_resp = client.post("/api/v1/tasks", json={"title": "Private Task"}, headers=headers1)
    task_id = task_resp.json()["id"]

    resp = client.get(f"/api/v1/tasks/{task_id}", headers=headers2)
    assert resp.status_code == 404
