def setup_product(client, admin_headers, stock=50):
    cat_resp = client.post("/api/v1/categories", headers=admin_headers, json={"name": "Cart Category"})
    cat_id = cat_resp.json()["id"]
    prod_resp = client.post("/api/v1/products", headers=admin_headers, json={
        "name": "Cart Product", "sku": "CART-SKU-1", "price": 250, "category_id": cat_id, "initial_stock": stock,
    })
    return prod_resp.json()["id"]


def test_get_empty_cart(client, auth_headers):
    response = client.get("/api/v1/cart", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_add_to_cart(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    response = client.post("/api/v1/cart/items", headers=auth_headers, json={
        "product_id": product_id, "quantity": 2,
    })
    assert response.status_code == 200

    cart_resp = client.get("/api/v1/cart", headers=auth_headers)
    cart = cart_resp.json()
    assert cart["total_items"] == 2
    assert len(cart["items"]) == 1


def test_add_to_cart_insufficient_stock(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers, stock=2)
    response = client.post("/api/v1/cart/items", headers=auth_headers, json={
        "product_id": product_id, "quantity": 10,
    })
    assert response.status_code == 400


def test_update_cart_item(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    client.post("/api/v1/cart/items", headers=auth_headers, json={"product_id": product_id, "quantity": 1})
    cart = client.get("/api/v1/cart", headers=auth_headers).json()
    item_id = cart["items"][0]["id"]

    response = client.put(f"/api/v1/cart/items/{item_id}", headers=auth_headers, json={"quantity": 3})
    assert response.status_code == 200

    cart = client.get("/api/v1/cart", headers=auth_headers).json()
    assert cart["items"][0]["quantity"] == 3


def test_remove_cart_item(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    client.post("/api/v1/cart/items", headers=auth_headers, json={"product_id": product_id, "quantity": 1})
    cart = client.get("/api/v1/cart", headers=auth_headers).json()
    item_id = cart["items"][0]["id"]

    response = client.delete(f"/api/v1/cart/items/{item_id}", headers=auth_headers)
    assert response.status_code == 200

    cart = client.get("/api/v1/cart", headers=auth_headers).json()
    assert len(cart["items"]) == 0


def test_create_order_requires_address(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    client.post("/api/v1/cart/items", headers=auth_headers, json={"product_id": product_id, "quantity": 1})

    response = client.post("/api/v1/orders", headers=auth_headers, json={
        "address_id": 99999,
        "payment_method": "cod",
    })
    assert response.status_code == 400


def test_create_order_success(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    client.post("/api/v1/cart/items", headers=auth_headers, json={"product_id": product_id, "quantity": 2})

    addr_resp = client.post("/api/v1/users/me/addresses", headers=auth_headers, json={
        "full_name": "Test User", "phone": "1234567890", "address_line1": "123 Main St",
        "city": "Test City", "state": "Test State", "postal_code": "12345",
    })
    address_id = addr_resp.json()["address_id"]

    response = client.post("/api/v1/orders", headers=auth_headers, json={
        "address_id": address_id,
        "payment_method": "cod",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1

    # Cart should be empty after order
    cart = client.get("/api/v1/cart", headers=auth_headers).json()
    assert len(cart["items"]) == 0


def test_wishlist_toggle(client, auth_headers, admin_headers):
    product_id = setup_product(client, admin_headers)
    response = client.post(f"/api/v1/wishlist/toggle/{product_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["action"] == "added"

    response2 = client.post(f"/api/v1/wishlist/toggle/{product_id}", headers=auth_headers)
    assert response2.json()["action"] == "removed"
