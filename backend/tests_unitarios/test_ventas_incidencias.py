from app import models

from conftest import abrir_corte, crear_producto, obtener_producto


def test_venta_requiere_turno_abierto(client, cajero_headers, producto):
    response = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json={
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto["id_producto"], "cantidad": 1}],
        },
    )

    assert response.status_code == 400
    assert "turno de caja abierto" in response.json()["detail"]


def test_registrar_venta_calcula_totales_y_descuenta_stock(
    client,
    session_factory,
    cajero_headers,
    producto,
):
    corte = abrir_corte(client, cajero_headers)

    response = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json={
            "metodo_pago": "tarjeta",
            "items": [{"id_producto": producto["id_producto"], "cantidad": 2}],
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["id_corte"] == corte["id_corte"]
    assert body["subtotal"] == 200.0
    assert body["impuesto"] == 32.0
    assert body["total"] == 232.0
    assert body["detalles"][0]["precio_historico"] == 100.0
    assert body["detalles"][0]["subtotal"] == 200.0
    assert obtener_producto(session_factory, producto["id_producto"])["stock_actual"] == 8

    db = session_factory()
    try:
        corte_db = db.query(models.CorteCaja).filter(
            models.CorteCaja.id_corte == corte["id_corte"]
        ).first()
        assert corte_db.total_ventas == 232.0
    finally:
        db.close()


def test_venta_con_stock_insuficiente_no_modifica_inventario(
    client,
    session_factory,
    cajero_headers,
    producto,
):
    abrir_corte(client, cajero_headers)

    response = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json={
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto["id_producto"], "cantidad": 99}],
        },
    )

    assert response.status_code == 400
    assert "Stock insuficiente" in response.json()["detail"]
    assert obtener_producto(session_factory, producto["id_producto"])["stock_actual"] == 10


def test_admin_anula_venta_y_restaura_stock(
    client,
    session_factory,
    admin_headers,
    cajero_headers,
    producto,
):
    abrir_corte(client, cajero_headers)
    venta = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json={
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto["id_producto"], "cantidad": 3}],
        },
    )
    venta_id = venta.json()["id_venta"]

    response = client.post(
        f"/api/v1/ventas/{venta_id}/anular",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert "anulada" in response.json()["mensaje"]
    assert obtener_producto(session_factory, producto["id_producto"])["stock_actual"] == 10

    repetida = client.post(
        f"/api/v1/ventas/{venta_id}/anular",
        headers=admin_headers,
    )
    assert repetida.status_code == 400


def test_cajero_no_puede_anular_venta(client, cajero_headers, producto):
    abrir_corte(client, cajero_headers)
    venta = client.post(
        "/api/v1/ventas/",
        headers=cajero_headers,
        json={
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto["id_producto"], "cantidad": 1}],
        },
    )

    response = client.post(
        f"/api/v1/ventas/{venta.json()['id_venta']}/anular",
        headers=cajero_headers,
    )

    assert response.status_code == 403


def test_incidencia_requiere_turno_y_valida_stock(client, cajero_headers, producto):
    sin_turno = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json={
            "id_producto": producto["id_producto"],
            "cantidad": -1,
            "causa": "Merma de prueba",
        },
    )
    assert sin_turno.status_code == 400
    assert "turno de caja abierto" in sin_turno.json()["detail"]

    abrir_corte(client, cajero_headers)
    stock_negativo = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json={
            "id_producto": producto["id_producto"],
            "cantidad": -99,
            "causa": "Merma mayor al stock",
        },
    )
    assert stock_negativo.status_code == 400
    assert "stock resultante" in stock_negativo.json()["detail"]


def test_incidencia_aplica_merma_y_ajuste(
    client,
    session_factory,
    cajero_headers,
    producto,
):
    corte = abrir_corte(client, cajero_headers)

    merma = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json={
            "id_producto": producto["id_producto"],
            "cantidad": -2,
            "causa": "Producto danado en almacen",
        },
    )
    assert merma.status_code == 201, merma.text
    assert merma.json()["id_corte"] == corte["id_corte"]
    assert obtener_producto(session_factory, producto["id_producto"])["stock_actual"] == 8

    ajuste = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json={
            "id_producto": producto["id_producto"],
            "cantidad": 4,
            "causa": "Ajuste por recuento fisico",
        },
    )
    assert ajuste.status_code == 201, ajuste.text
    assert obtener_producto(session_factory, producto["id_producto"])["stock_actual"] == 12


def test_incidencia_rechaza_turno_cerrado(client, cajero_headers, producto):
    corte = abrir_corte(client, cajero_headers)
    cerrar = client.post(
        f"/api/v1/cortes/{corte['id_corte']}/cerrar",
        headers=cajero_headers,
        json={"efectivo_real": 0},
    )
    assert cerrar.status_code == 200

    response = client.post(
        "/api/v1/incidencias/",
        headers=cajero_headers,
        json={
            "id_producto": producto["id_producto"],
            "id_corte": corte["id_corte"],
            "cantidad": -1,
            "causa": "Merma posterior al cierre",
        },
    )

    assert response.status_code == 400
    assert "cerrado" in response.json()["detail"]
