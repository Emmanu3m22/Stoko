from conftest import abrir_corte


def test_usuario_abre_consulta_y_cierra_corte(client, cajero_headers):
    abierto = abrir_corte(client, cajero_headers)

    activo = client.get("/api/v1/cortes/activo", headers=cajero_headers)
    assert activo.status_code == 200
    assert activo.json()["id_corte"] == abierto["id_corte"]
    assert activo.json()["estado"] == "abierto"

    segundo = client.post("/api/v1/cortes/", headers=cajero_headers)
    assert segundo.status_code == 400
    assert "turno abierto" in segundo.json()["detail"]

    cerrado = client.post(
        f"/api/v1/cortes/{abierto['id_corte']}/cerrar",
        headers=cajero_headers,
        json={"efectivo_real": 25.5},
    )
    assert cerrado.status_code == 200
    assert cerrado.json()["estado"] == "cerrado"
    assert cerrado.json()["efectivo_real"] == 25.5
    assert cerrado.json()["diferencia"] == 25.5

    activo_cerrado = client.get("/api/v1/cortes/activo", headers=cajero_headers)
    assert activo_cerrado.status_code == 404


def test_solo_admin_lista_todos_los_cortes(
    client,
    admin_headers,
    cajero_headers,
):
    abrir_corte(client, cajero_headers)

    listado_cajero = client.get("/api/v1/cortes/", headers=cajero_headers)
    listado_admin = client.get("/api/v1/cortes/", headers=admin_headers)

    assert listado_cajero.status_code == 403
    assert listado_admin.status_code == 200
    assert len(listado_admin.json()) == 1


def test_cajero_no_puede_cerrar_corte_de_otro_usuario(
    client,
    session_factory,
    cajero_headers,
):
    from conftest import crear_usuario, login_headers

    otro = crear_usuario(
        session_factory,
        nombre="Otro Cajero",
        email="otro.cajero@stoko.test",
        rol_nombre="cajero",
    )
    otro_headers = login_headers(client, otro["email"], otro["password"])
    corte_otro = abrir_corte(client, otro_headers)

    response = client.post(
        f"/api/v1/cortes/{corte_otro['id_corte']}/cerrar",
        headers=cajero_headers,
        json={"efectivo_real": 0},
    )

    assert response.status_code == 403
    assert "otro usuario" in response.json()["detail"]


def test_admin_puede_cerrar_corte_de_otro_usuario(
    client,
    admin_headers,
    cajero_headers,
):
    corte = abrir_corte(client, cajero_headers)

    response = client.post(
        f"/api/v1/cortes/{corte['id_corte']}/cerrar",
        headers=admin_headers,
        json={"efectivo_real": 0},
    )

    assert response.status_code == 200
    assert response.json()["estado"] == "cerrado"
