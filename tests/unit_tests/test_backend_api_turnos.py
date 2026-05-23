def venta_payload(producto_id):
    return {
        "metodo_pago": "efectivo",
        "items": [{"id_producto": producto_id, "cantidad": 1}],
    }


def incidencia_payload(producto_id, **extra):
    payload = {
        "id_producto": producto_id,
        "cantidad": -1,
        "causa": "Merma de prueba",
    }
    payload.update(extra)
    return payload


def test_tc_uni_033_get_productos_sin_token_retorna_401(client):
    response = client.get("/api/v1/productos/")

    assert response.status_code == 401


def test_tc_uni_034_post_productos_sin_token_retorna_401(client, categoria):
    response = client.post(
        "/api/v1/productos/",
        json={
            "nombre": "Producto sin token",
            "codigo_barras": "SIN-TOKEN-001",
            "precio_unitario": 100,
            "stock_actual": 5,
            "stock_minimo": 1,
            "id_categoria": categoria["id_categoria"],
        },
    )

    assert response.status_code == 401


def test_tc_uni_035_delete_productos_sin_token_retorna_401(client):
    response = client.delete("/api/v1/productos/1")

    assert response.status_code == 401


def test_tc_uni_036_ruta_productos_sin_version_retorna_404(client):
    response = client.get("/productos/")

    assert response.status_code == 404


def test_tc_uni_037_registrar_venta_sin_turno_activo_retorna_400(
    client,
    cajero_headers,
    producto,
):
    response = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json=venta_payload(producto["id_producto"]),
    )

    assert response.status_code == 400
    assert "turno de caja abierto" in response.json()["detail"]


def test_tc_uni_038_registrar_incidencia_sin_turno_activo_retorna_400(
    client,
    cajero_headers,
    producto,
):
    response = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json=incidencia_payload(producto["id_producto"]),
    )

    assert response.status_code == 400
    assert "turno de caja abierto" in response.json()["detail"]


def test_tc_uni_039_abrir_corte_con_turno_ya_abierto_retorna_400(
    client,
    cajero_headers,
    abrir_turno,
):
    response = client.post("/api/v1/cortes/", headers=cajero_headers)

    assert response.status_code == 400
    assert "turno abierto" in response.json()["detail"]


def test_tc_uni_040_registrar_venta_con_turno_abierto_retorna_201_e_id_corte(
    client,
    cajero_headers,
    producto,
    abrir_turno,
):
    response = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json=venta_payload(producto["id_producto"]),
    )

    assert response.status_code == 201, response.text
    assert response.json()["id_corte"] == abrir_turno["id_corte"]


def test_tc_uni_041_cerrar_corte_abierto_cambia_estado_a_cerrado(
    client,
    cajero_headers,
    abrir_turno,
):
    response = client.post(
        f"/api/v1/cortes/{abrir_turno['id_corte']}/cerrar",
        headers=cajero_headers,
        json={"efectivo_real": 0},
    )

    assert response.status_code == 200
    assert response.json()["estado"] == "cerrado"


def test_tc_uni_042_registrar_incidencia_con_turno_abierto_retorna_201_e_id_corte(
    client,
    cajero_headers,
    producto,
    abrir_turno,
):
    response = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json=incidencia_payload(producto["id_producto"], causa="Merma valida"),
    )

    assert response.status_code == 201, response.text
    assert response.json()["id_corte"] == abrir_turno["id_corte"]


def test_tc_uni_043_registrar_incidencia_en_turno_cerrado_retorna_400(
    client,
    cajero_headers,
    producto,
    abrir_turno,
):
    client.post(
        f"/api/v1/cortes/{abrir_turno['id_corte']}/cerrar",
        headers=cajero_headers,
        json={"efectivo_real": 0},
    )

    response = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json=incidencia_payload(
            producto["id_producto"],
            id_corte=abrir_turno["id_corte"],
            causa="Merma posterior al cierre",
        ),
    )

    assert response.status_code == 400
    assert "cerrado" in response.json()["detail"]
