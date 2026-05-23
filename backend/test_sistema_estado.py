import os
import sys
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import Base, get_db
from app.main import app
from app import models
from app.core.security import hash_password


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
        rol = models.Rol(nombre="administrador")
        db.add(rol)
        db.flush()
        db.add(models.Usuario(
            nombre="Admin Sistema",
            email="sistema@stoko.test",
            password=hash_password("password123"),
            id_rol=rol.id_rol,
            activo=True,
        ))
        db.commit()
    finally:
        db.close()


def main():
    client, SessionLocal, tmp = crear_cliente_temporal()
    try:
        sembrar_admin(SessionLocal)

        response = client.get("/api/v1/sistema/estado")
        assert response.status_code == 200, response.text
        data = response.json()
        assert data["estado"] == "ok"
        assert data["base_datos"] == "conectada"
        assert data["hora"]

        login = client.post(
            "/api/v1/auth/login",
            data={"username": "sistema@stoko.test", "password": "password123"},
        )
        assert login.status_code == 200, login.text
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        respaldo = client.get("/api/v1/sistema/respaldo", headers=headers)
        assert respaldo.status_code == 200, respaldo.text
        assert respaldo.content.startswith(b"SQLite format 3")
        assert "stoko_respaldo_" in respaldo.headers["content-disposition"]

        print("Pruebas de estado del sistema completadas correctamente.")
    finally:
        app.dependency_overrides.clear()
        tmp.cleanup()


if __name__ == "__main__":
    main()
