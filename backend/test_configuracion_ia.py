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
        rol = models.Rol(nombre="administrador")
        db.add(rol)
        db.flush()
        usuario = models.Usuario(
            nombre="Admin Config IA",
            email="configia@stoko.test",
            password=hash_password("password123"),
            id_rol=rol.id_rol,
            activo=True,
        )
        db.add(usuario)
        db.commit()
    finally:
        db.close()


def main():
    old_key = os.environ.pop("GEMINI_API_KEY", None)
    old_model = os.environ.pop("GEMINI_MODEL", None)
    client, SessionLocal, tmp = crear_cliente_temporal()
    try:
        sembrar_admin(SessionLocal)
        login = client.post(
            "/api/v1/auth/login",
            data={"username": "configia@stoko.test", "password": "password123"},
        )
        assert login.status_code == 200, login.text
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        inicial = client.get("/api/v1/configuracion/ia", headers=headers)
        assert inicial.status_code == 200, inicial.text
        assert inicial.json()["api_key_configurada"] is False
        assert inicial.json()["modelo"] == "gemini-3-flash-preview"

        prueba_sin_key = client.post("/api/v1/configuracion/ia/probar", headers=headers)
        assert prueba_sin_key.status_code == 200, prueba_sin_key.text
        assert prueba_sin_key.json()["ok"] is False

        guardar = client.put(
            "/api/v1/configuracion/ia",
            headers=headers,
            json={
                "modelo": "gemini-3-flash-preview",
                "api_key": "AIzaSyConfiguracionLocal123456",
            },
        )
        assert guardar.status_code == 200, guardar.text
        data = guardar.json()
        assert data["api_key_configurada"] is True
        assert data["api_key_preview"].startswith("AIza")
        assert data["api_key_preview"].endswith("3456")
        assert "ConfiguracionLocal" not in data["api_key_preview"]

        borrar = client.put(
            "/api/v1/configuracion/ia",
            headers=headers,
            json={"modelo": "gemini-3-flash-preview", "api_key": ""},
        )
        assert borrar.status_code == 200, borrar.text
        assert borrar.json()["api_key_configurada"] is False

        print("Pruebas de configuración IA completadas correctamente.")
    finally:
        app.dependency_overrides.clear()
        tmp.cleanup()
        if old_key is not None:
            os.environ["GEMINI_API_KEY"] = old_key
        if old_model is not None:
            os.environ["GEMINI_MODEL"] = old_model


if __name__ == "__main__":
    main()
