from datetime import date

from app import models
from app.services.ia_service import IAServiceError

from conftest import abrir_corte


def registrar_venta(client, headers, producto_id, cantidad=1):
    abrir_corte(client, headers)
    response = client.post(
        "/api/v1/ventas/",
        headers=headers,
        json={
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto_id, "cantidad": cantidad}],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_reporte_ventas_resume_periodo_y_audita(
    client,
    session_factory,
    admin_headers,
    producto,
):
    registrar_venta(client, admin_headers, producto["id_producto"], cantidad=2)
    hoy = date.today().isoformat()

    response = client.get(
        "/api/v1/ventas/reporte",
        headers=admin_headers,
        params={"fecha_inicio": hoy, "fecha_fin": hoy},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["num_transacciones"] == 1
    assert body["total_periodo"] == 232.0
    assert body["por_metodo_pago"] == {"efectivo": 232.0}
    assert body["productos_top"][0]["nombre"] == producto["nombre"]
    assert body["productos_top"][0]["cantidad"] == 2

    db = session_factory()
    try:
        log = db.query(models.LogAuditoria).filter(
            models.LogAuditoria.operacion == "generar_reporte_ventas"
        ).first()
        assert log is not None
    finally:
        db.close()


def test_reporte_ventas_rechaza_periodo_invalido(client, admin_headers):
    response = client.get(
        "/api/v1/ventas/reporte",
        headers=admin_headers,
        params={"fecha_inicio": "2030-01-02", "fecha_fin": "2030-01-01"},
    )

    assert response.status_code == 400
    assert "fecha_inicio" in response.json()["detail"]


def test_reportes_avanzados_y_exportacion(
    client,
    admin_headers,
    producto,
):
    registrar_venta(client, admin_headers, producto["id_producto"], cantidad=1)
    hoy = date.today().isoformat()
    params = {"fecha_inicio": hoy, "fecha_fin": hoy}

    reporte = client.get("/api/v1/reportes/ventas", headers=admin_headers, params=params)
    assert reporte.status_code == 200, reporte.text
    body = reporte.json()
    assert body["periodo"] == {"fecha_inicio": hoy, "fecha_fin": hoy}
    assert body["resumen"]["num_ventas"] == 1
    assert body["resumen"]["total_ventas"] == 116.0
    assert body["productos_vendidos"][0]["unidades"] == 1

    pdf = client.get(
        "/api/v1/reportes/exportar",
        headers=admin_headers,
        params={**params, "formato": "pdf"},
    )
    assert pdf.status_code == 200
    assert pdf.content.startswith(b"%PDF")

    excel = client.get(
        "/api/v1/reportes/exportar",
        headers=admin_headers,
        params={**params, "formato": "excel"},
    )
    assert excel.status_code == 200
    assert excel.content.startswith(b"PK")


def test_insights_usa_servicio_ia_mockeado(
    client,
    monkeypatch,
    admin_headers,
    producto,
):
    import app.routers.reportes as reportes_router

    registrar_venta(client, admin_headers, producto["id_producto"], cantidad=1)

    def fake_generar_insights(datos_ventas, datos_mermas):
        assert datos_ventas["resumen"]["num_ventas"] == 1
        assert "productos_en_riesgo_stock" in datos_mermas
        return "Recomendacion generada para pruebas"

    monkeypatch.setattr(reportes_router, "generar_insights", fake_generar_insights)
    hoy = date.today().isoformat()
    response = client.post(
        "/api/v1/reportes/insights",
        headers=admin_headers,
        json={"fecha_inicio": hoy, "fecha_fin": hoy},
    )

    assert response.status_code == 200, response.text
    assert response.json()["insights"] == "Recomendacion generada para pruebas"


def test_insights_devuelve_503_si_falla_ia(
    client,
    monkeypatch,
    admin_headers,
    producto,
):
    import app.routers.reportes as reportes_router

    registrar_venta(client, admin_headers, producto["id_producto"], cantidad=1)

    def fake_generar_insights(datos_ventas, datos_mermas):
        raise IAServiceError("Servicio no disponible")

    monkeypatch.setattr(reportes_router, "generar_insights", fake_generar_insights)
    hoy = date.today().isoformat()
    response = client.post(
        "/api/v1/reportes/insights",
        headers=admin_headers,
        json={"fecha_inicio": hoy, "fecha_fin": hoy},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Servicio no disponible"


def test_auditorias_solo_admin_y_filtra_operacion(
    client,
    admin_headers,
    cajero_headers,
):
    sin_permiso = client.get("/api/v1/auditorias/", headers=cajero_headers)
    assert sin_permiso.status_code == 403

    response = client.get(
        "/api/v1/auditorias/",
        headers=admin_headers,
        params={"operacion": "login"},
    )

    assert response.status_code == 200
    assert all("login" in item["operacion"] for item in response.json())


def test_resumen_reportes_calcula_metricas(client, admin_headers, producto):
    registrar_venta(client, admin_headers, producto["id_producto"], cantidad=1)

    response = client.get("/api/v1/auditorias/reportes/resumen", headers=admin_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["ventas_hoy"] == 1
    assert body["total_hoy"] == 116.0
    assert body["total_productos"] == 1
    assert body["valor_inventario"] == 900.0
