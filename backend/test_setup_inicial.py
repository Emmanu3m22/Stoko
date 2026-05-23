import os
import sys
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
    return TestClient(app), tmp


def main():
    client, tmp = crear_cliente_temporal()
    try:
        status_inicial = client.get("/api/v1/auth/setup")
        assert status_inicial.status_code == 200, status_inicial.text
        assert status_inicial.json()["requiere_configuracion"] is True

        setup = client.post(
            "/api/v1/auth/setup",
            json={
                "nombre": "Admin Inicial",
                "email": "admin.local@stokoapp.com",
                "password": "password123",
            },
        )
        assert setup.status_code == 201, setup.text
        data = setup.json()
        assert data["access_token"]
        assert data["nombre"] == "Admin Inicial"
        assert data["rol"] == "administrador"

        status_final = client.get("/api/v1/auth/setup")
        assert status_final.status_code == 200, status_final.text
        assert status_final.json()["requiere_configuracion"] is False

        segundo_setup = client.post(
            "/api/v1/auth/setup",
            json={
                "nombre": "Otro Admin",
                "email": "otro@stokoapp.com",
                "password": "password123",
            },
        )
        assert segundo_setup.status_code == 409, segundo_setup.text

        login = client.post(
            "/api/v1/auth/login",
            data={"username": "admin.local@stokoapp.com", "password": "password123"},
        )
        assert login.status_code == 200, login.text

        print("Pruebas de configuración inicial completadas correctamente.")
    finally:
        app.dependency_overrides.clear()
        tmp.cleanup()


if __name__ == "__main__":
    main()
