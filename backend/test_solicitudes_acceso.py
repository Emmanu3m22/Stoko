import os
import sys
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models
from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app


def crear_cliente_temporal():
    tmp = TemporaryDirectory()
    engine = create_engine(
        f"sqlite:///{tmp.name}/test.db",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), TestingSessionLocal, tmp


def sembrar_admin(SessionLocal):
    db = SessionLocal()
    try:
        admin_rol = models.Rol(nombre="administrador")
        cajero_rol = models.Rol(nombre="cajero")
        db.add_all([admin_rol, cajero_rol])
        db.flush()
        db.add(models.Usuario(
            nombre="Admin Accesos",
            email="admin.accesos@stokoapp.com",
            password=hash_password("password123"),
            id_rol=admin_rol.id_rol,
            activo=True,
        ))
        db.commit()
        return cajero_rol.id_rol
    finally:
        db.close()


def main():
    client, SessionLocal, tmp = crear_cliente_temporal()
    try:
        cajero_rol_id = sembrar_admin(SessionLocal)

        solicitud = client.post(
            "/api/v1/auth/solicitudes-acceso",
            json={
                "nombre": "Cajero Nuevo",
                "email": "cajero.nuevo@stokoapp.com",
                "rol_solicitado": "cajero",
                "mensaje": "Turno matutino",
            },
        )
        assert solicitud.status_code == 201, solicitud.text
        solicitud_id = solicitud.json()["id_solicitud"]
        assert solicitud.json()["estado"] == "pendiente"

        duplicada = client.post(
            "/api/v1/auth/solicitudes-acceso",
            json={
                "nombre": "Cajero Nuevo",
                "email": "cajero.nuevo@stokoapp.com",
                "rol_solicitado": "cajero",
            },
        )
        assert duplicada.status_code == 409, duplicada.text

        login_admin = client.post(
            "/api/v1/auth/login",
            data={"username": "admin.accesos@stokoapp.com", "password": "password123"},
        )
        assert login_admin.status_code == 200, login_admin.text
        headers = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

        listado = client.get("/api/v1/usuarios/solicitudes-acceso/", headers=headers)
        assert listado.status_code == 200, listado.text
        assert len(listado.json()) == 1

        aprobada = client.patch(
            f"/api/v1/usuarios/solicitudes-acceso/{solicitud_id}",
            headers=headers,
            json={
                "estado": "aprobada",
                "id_rol": cajero_rol_id,
                "password": "temporal123",
            },
        )
        assert aprobada.status_code == 200, aprobada.text
        assert aprobada.json()["estado"] == "aprobada"
        assert aprobada.json()["id_usuario_creado"]

        login_cajero = client.post(
            "/api/v1/auth/login",
            data={"username": "cajero.nuevo@stokoapp.com", "password": "temporal123"},
        )
        assert login_cajero.status_code == 200, login_cajero.text
        assert login_cajero.json()["rol"] == "cajero"

        print("Pruebas de solicitudes de acceso completadas correctamente.")
    finally:
        app.dependency_overrides.clear()
        tmp.cleanup()


if __name__ == "__main__":
    main()
