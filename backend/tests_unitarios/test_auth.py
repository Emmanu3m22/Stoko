from app import models

from conftest import crear_usuario


def test_login_exitoso_retorna_token_y_perfil(client, session_factory, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": admin_user["email"], "password": admin_user["password"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["usuario_id"] == admin_user["id_usuario"]
    assert body["rol"] == "administrador"

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == admin_user["email"]

    db = session_factory()
    try:
        log = db.query(models.LogAuditoria).filter(
            models.LogAuditoria.operacion == "login"
        ).first()
        assert log is not None
        assert log.id_usuario == admin_user["id_usuario"]
    finally:
        db.close()


def test_login_rechaza_password_incorrecto(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": admin_user["email"], "password": "incorrecto"},
    )

    assert response.status_code == 401
    assert "incorrecta" in response.json()["detail"]


def test_login_rechaza_usuario_inactivo(client, session_factory):
    usuario = crear_usuario(
        session_factory,
        email="inactivo@stoko.test",
        password="password123",
        activo=False,
    )

    response = client.post(
        "/api/v1/auth/login",
        data={"username": usuario["email"], "password": usuario["password"]},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Usuario no registrado"


def test_endpoint_protegido_sin_token_responde_401(client):
    response = client.get("/api/v1/productos/")

    assert response.status_code == 401
