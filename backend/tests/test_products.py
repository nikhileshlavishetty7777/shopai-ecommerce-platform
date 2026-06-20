def create_test_category(client, admin_headers):
    response = client.post("/api/v1/categories", headers=admin_headers, json={
        "name": "Test Category",
        "description": "A test category",
    })
    return response.json()["id"]


def test_create_category(client, admin_headers):
    response = client.post("/api/v1/categories", headers=admin_headers, json={
        "name": "Electronics",
        "description": "Electronic items",
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Electronics"


def test_create_category_requires_admin(client, auth_headers):
    response = client.post("/api/v1/categories", headers=auth_headers, json={
        "name": "Electronics",
    })
    assert response.status_code == 403


def test_list_categories(client, admin_headers):
    create_test_category(client, admin_headers)
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_create_product(client, admin_headers):
    cat_id = create_test_category(client, admin_headers)
    response = client.post("/api/v1/products", headers=admin_headers, json={
        "name": "Test Product",
        "sku": "TEST-001",
        "price": 999.99,
        "category_id": cat_id,
        "initial_stock": 50,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert data["sku"] == "TEST-001"


def test_create_product_requires_admin(client, auth_headers):
    response = client.post("/api/v1/products", headers=auth_headers, json={
        "name": "Test Product",
        "sku": "TEST-002",
        "price": 999.99,
        "category_id": 1,
    })
    assert response.status_code == 403


def test_list_products(client, admin_headers):
    cat_id = create_test_category(client, admin_headers)
    client.post("/api/v1/products", headers=admin_headers, json={
        "name": "Product A", "sku": "SKU-A", "price": 100, "category_id": cat_id, "initial_stock": 10,
    })
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "items" in data


def test_get_product_detail(client, admin_headers):
    cat_id = create_test_category(client, admin_headers)
    create_resp = client.post("/api/v1/products", headers=admin_headers, json={
        "name": "Detail Product", "sku": "SKU-DETAIL", "price": 500, "category_id": cat_id, "initial_stock": 5,
    })
    product_id = create_resp.json()["id"]
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Detail Product"


def test_get_nonexistent_product(client):
    response = client.get("/api/v1/products/99999")
    assert response.status_code == 404


def test_update_product(client, admin_headers):
    cat_id = create_test_category(client, admin_headers)
    create_resp = client.post("/api/v1/products", headers=admin_headers, json={
        "name": "Original Name", "sku": "SKU-UPDATE", "price": 200, "category_id": cat_id, "initial_stock": 5,
    })
    product_id = create_resp.json()["id"]
    response = client.put(f"/api/v1/products/{product_id}", headers=admin_headers, json={
        "name": "Updated Name",
    })
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_delete_product(client, admin_headers):
    cat_id = create_test_category(client, admin_headers)
    create_resp = client.post("/api/v1/products", headers=admin_headers, json={
        "name": "To Delete", "sku": "SKU-DELETE", "price": 100, "category_id": cat_id, "initial_stock": 5,
    })
    product_id = create_resp.json()["id"]
    response = client.delete(f"/api/v1/products/{product_id}", headers=admin_headers)
    assert response.status_code == 204

    get_response = client.get(f"/api/v1/products/{product_id}")
    assert get_response.status_code == 404
