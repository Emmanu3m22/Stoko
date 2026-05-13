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


def sembrar_datos(SessionLocal):
    db = SessionLocal()
    try:
        rol = models.Rol(nombre="administrador")
        db.add(rol)
        db.flush()

        usuario = models.Usuario(
            nombre="Admin Turnos",
            email="turnos@stoko.test",
            password=hash_password("password123"),
            id_rol=rol.id_rol,
            activo=True,
        )
        categoria = models.Categoria(nombre="Pruebas")
        db.add_all([usuario, categoria])
        db.flush()

        producto = models.Producto(
            nombre="Producto de turno",
            codigo_barras="TURNOS-001",
            precio_unitario=10,
            stock_actual=10,
            stock_minimo=1,
            id_categoria=categoria.id_categoria,
        )
        db.add(producto)
        db.commit()
        db.refresh(producto)
        return producto.id_producto
    finally:
        db.close()


def main():
    client, SessionLocal, tmp = crear_cliente_temporal()
    try:
        producto_id = sembrar_datos(SessionLocal)
        login = client.post(
            "/api/v1/auth/login",
            data={"username": "turnos@stoko.test", "password": "password123"},
        )
        assert login.status_code == 200, login.text
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        venta_payload = {
            "metodo_pago": "efectivo",
            "items": [{"id_producto": producto_id, "cantidad": 1}],
        }
        venta_sin_turno = client.post("/api/v1/ventas/", headers=headers, json=venta_payload)
        assert venta_sin_turno.status_code == 400, venta_sin_turno.text
        assert "turno de caja abierto" in venta_sin_turno.json()["detail"]

        merma_payload = {
            "id_producto": producto_id,
            "cantidad": -1,
            "causa": "Merma de prueba",
        }
        merma_sin_turno = client.post("/api/v1/incidencias/", headers=headers, json=merma_payload)
        assert merma_sin_turno.status_code == 400, merma_sin_turno.text
        assert "turno de caja abierto" in merma_sin_turno.json()["detail"]

        abrir = client.post("/api/v1/cortes/", headers=headers)
        assert abrir.status_code == 201, abrir.text
        corte_id = abrir.json()["id_corte"]

        venta_con_turno = client.post("/api/v1/ventas/", headers=headers, json=venta_payload)
        assert venta_con_turno.status_code == 201, venta_con_turno.text
        assert venta_con_turno.json()["id_corte"] == corte_id

        merma_con_turno = client.post("/api/v1/incidencias/", headers=headers, json=merma_payload)
        assert merma_con_turno.status_code == 201, merma_con_turno.text
        assert merma_con_turno.json()["id_corte"] == corte_id

        cerrar = client.post(
            f"/api/v1/cortes/{corte_id}/cerrar",
            headers=headers,
            json={"efectivo_real": 0},
        )
        assert cerrar.status_code == 200, cerrar.text

        merma_turno_cerrado = client.post(
            "/api/v1/incidencias/",
            headers=headers,
            json={**merma_payload, "id_corte": corte_id},
        )
        assert merma_turno_cerrado.status_code == 400, merma_turno_cerrado.text
        assert "cerrado" in merma_turno_cerrado.json()["detail"]

        print("Pruebas de operaciones ligadas a turno completadas correctamente.")
    finally:
        app.dependency_overrides.clear()
        tmp.cleanup()


if __name__ == "__main__":
    main()
