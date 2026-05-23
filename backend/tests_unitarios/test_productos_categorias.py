from conftest import crear_categoria, crear_producto


def test_admin_crea_lista_filtra_y_actualiza_producto(
    client,
    session_factory,
    admin_headers,
    cajero_headers,
    categoria,
):
    crear_producto(
        session_factory,
        nombre="Correa Azul",
        codigo_barras="AZUL-001",
        stock_actual=1,
        stock_minimo=5,
        id_categoria=categoria["id_categoria"],
    )

    payload = {
        "nombre": "Reloj Plata",
        "codigo_barras": "REL-001",
        "precio_unitario": 250.0,
        "stock_actual": 8,
        "stock_minimo": 3,
        "id_categoria": categoria["id_categoria"],
    }
    creado = client.post("/api/v1/productos/", headers=admin_headers, json=payload)

    assert creado.status_code == 201, creado.text
    producto_id = creado.json()["id_producto"]

    duplicado = client.post("/api/v1/productos/", headers=admin_headers, json=payload)
    assert duplicado.status_code == 400

    busqueda = client.get(
        "/api/v1/productos/",
        headers=cajero_headers,
        params={"busqueda": "Plata"},
    )
    assert busqueda.status_code == 200
    assert [p["codigo_barras"] for p in busqueda.json()] == ["REL-001"]

    stock_bajo = client.get(
        "/api/v1/productos/",
        headers=cajero_headers,
        params={"stock_bajo": True},
    )
    assert stock_bajo.status_code == 200
    assert [p["codigo_barras"] for p in stock_bajo.json()] == ["AZUL-001"]

    por_codigo = client.get(
        "/api/v1/productos/codigo/REL-001",
        headers=cajero_headers,
    )
    assert por_codigo.status_code == 200
    assert por_codigo.json()["id_producto"] == producto_id

    actualizado = client.patch(
        f"/api/v1/productos/{producto_id}",
        headers=admin_headers,
        json={"precio_unitario": 275.5, "stock_minimo": 4},
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["precio_unitario"] == 275.5
    assert actualizado.json()["stock_minimo"] == 4


def test_cajero_no_puede_mutar_productos(client, cajero_headers, producto):
    crear = client.post(
        "/api/v1/productos/",
        headers=cajero_headers,
        json={
            "nombre": "Producto Restringido",
            "codigo_barras": "REST-001",
            "precio_unitario": 10,
            "stock_actual": 1,
            "stock_minimo": 1,
        },
    )
    editar = client.patch(
        f"/api/v1/productos/{producto['id_producto']}",
        headers=cajero_headers,
        json={"nombre": "Cambio no permitido"},
    )
    eliminar = client.delete(
        f"/api/v1/productos/{producto['id_producto']}",
        headers=cajero_headers,
    )

    assert crear.status_code == 403
    assert editar.status_code == 403
    assert eliminar.status_code == 403


def test_eliminar_producto_existente(client, admin_headers, producto):
    response = client.delete(
        f"/api/v1/productos/{producto['id_producto']}",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert "eliminado" in response.json()["mensaje"]


def test_categoria_crud_y_restriccion_con_productos(
    client,
    session_factory,
    admin_headers,
    cajero_headers,
):
    crear = client.post(
        "/api/v1/categorias/",
        headers=admin_headers,
        json={"nombre": "Accesorios"},
    )
    assert crear.status_code == 201
    categoria_id = crear.json()["id_categoria"]

    duplicada = client.post(
        "/api/v1/categorias/",
        headers=admin_headers,
        json={"nombre": "Accesorios"},
    )
    assert duplicada.status_code == 400

    listar = client.get("/api/v1/categorias/", headers=cajero_headers)
    assert listar.status_code == 200
    assert listar.json()[0]["nombre"] == "Accesorios"

    editar = client.patch(
        f"/api/v1/categorias/{categoria_id}",
        headers=admin_headers,
        json={"nombre": "Accesorios Premium"},
    )
    assert editar.status_code == 200
    assert editar.json()["nombre"] == "Accesorios Premium"

    crear_producto(
        session_factory,
        codigo_barras="CAT-001",
        id_categoria=categoria_id,
    )
    eliminar_con_producto = client.delete(
        f"/api/v1/categorias/{categoria_id}",
        headers=admin_headers,
    )
    assert eliminar_con_producto.status_code == 400

    crear_sin_permiso = client.post(
        "/api/v1/categorias/",
        headers=cajero_headers,
        json={"nombre": "No permitido"},
    )
    assert crear_sin_permiso.status_code == 403


def test_eliminar_categoria_sin_productos(client, session_factory, admin_headers):
    categoria = crear_categoria(session_factory, nombre="Temporal")

    response = client.delete(
        f"/api/v1/categorias/{categoria['id_categoria']}",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert "Temporal" in response.json()["mensaje"]
