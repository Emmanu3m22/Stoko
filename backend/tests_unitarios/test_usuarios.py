from conftest import crear_rol


def test_admin_crea_lista_actualiza_y_desactiva_usuario(
    client,
    session_factory,
    admin_headers,
):
    rol_cajero = crear_rol(session_factory, "cajero")
    payload = {
        "nombre": "Nuevo Cajero",
        "email": "nuevo.cajero@example.com",
        "password": "password123",
        "id_rol": rol_cajero["id_rol"],
    }

    creado = client.post("/api/v1/usuarios/", headers=admin_headers, json=payload)
    assert creado.status_code == 201, creado.text
    usuario_id = creado.json()["id_usuario"]
    assert creado.json()["email"] == payload["email"]

    duplicado = client.post("/api/v1/usuarios/", headers=admin_headers, json=payload)
    assert duplicado.status_code == 400

    listar = client.get("/api/v1/usuarios/", headers=admin_headers)
    assert listar.status_code == 200
    assert any(u["id_usuario"] == usuario_id for u in listar.json())

    actualizado = client.patch(
        f"/api/v1/usuarios/{usuario_id}",
        headers=admin_headers,
        json={"nombre": "Cajero Actualizado", "password": "nuevo123"},
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["nombre"] == "Cajero Actualizado"

    desactivado = client.delete(
        f"/api/v1/usuarios/{usuario_id}",
        headers=admin_headers,
    )
    assert desactivado.status_code == 200
    assert "desactivado" in desactivado.json()["mensaje"]


def test_admin_no_puede_desactivarse_a_si_mismo(client, admin_headers, admin_user):
    response = client.delete(
        f"/api/v1/usuarios/{admin_user['id_usuario']}",
        headers=admin_headers,
    )

    assert response.status_code == 400
    assert "propio usuario" in response.json()["detail"]


def test_cajero_solo_puede_ver_su_propio_perfil(
    client,
    cajero_headers,
    cajero_user,
    admin_user,
):
    propio = client.get(
        f"/api/v1/usuarios/{cajero_user['id_usuario']}",
        headers=cajero_headers,
    )
    otro = client.get(
        f"/api/v1/usuarios/{admin_user['id_usuario']}",
        headers=cajero_headers,
    )
    listado = client.get("/api/v1/usuarios/", headers=cajero_headers)

    assert propio.status_code == 200
    assert propio.json()["email"] == cajero_user["email"]
    assert otro.status_code == 403
    assert listado.status_code == 403


def test_crear_usuario_requiere_rol_existente(client, admin_headers):
    response = client.post(
        "/api/v1/usuarios/",
        headers=admin_headers,
        json={
            "nombre": "Sin Rol",
            "email": "sin.rol@example.com",
            "password": "password123",
            "id_rol": 999,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Rol no encontrado"
