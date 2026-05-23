import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("STOKO_SKIP_STARTUP_DB", "1")

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import models
from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app


ADMIN_PASSWORD = "password123"
CAJERO_PASSWORD = "password123"


@pytest.fixture()
def session_factory(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'stoko_unit_test.db'}",
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
    try:
        yield TestingSessionLocal
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(session_factory):
    return TestClient(app)


def crear_rol(session_factory, nombre):
    db = session_factory()
    try:
        rol = db.query(models.Rol).filter(models.Rol.nombre == nombre).first()
        if not rol:
            rol = models.Rol(nombre=nombre)
            db.add(rol)
            db.commit()
            db.refresh(rol)
        return {"id_rol": rol.id_rol, "nombre": rol.nombre}
    finally:
        db.close()


def crear_usuario(
    session_factory,
    *,
    nombre="Usuario Test",
    email="usuario@stoko.test",
    password=ADMIN_PASSWORD,
    rol_nombre="administrador",
    activo=True,
):
    rol = crear_rol(session_factory, rol_nombre)
    db = session_factory()
    try:
        usuario = models.Usuario(
            nombre=nombre,
            email=email,
            password=hash_password(password),
            id_rol=rol["id_rol"],
            activo=activo,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "password": password,
            "id_rol": usuario.id_rol,
            "rol": rol_nombre,
            "activo": usuario.activo,
        }
    finally:
        db.close()


def login_headers(client, email, password):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture()
def admin_user(session_factory):
    return crear_usuario(
        session_factory,
        nombre="Admin Test",
        email="admin@stoko.test",
        password=ADMIN_PASSWORD,
        rol_nombre="administrador",
    )


@pytest.fixture()
def cajero_user(session_factory):
    return crear_usuario(
        session_factory,
        nombre="Cajero Test",
        email="cajero@stoko.test",
        password=CAJERO_PASSWORD,
        rol_nombre="cajero",
    )


@pytest.fixture()
def admin_headers(client, admin_user):
    return login_headers(client, admin_user["email"], admin_user["password"])


@pytest.fixture()
def cajero_headers(client, cajero_user):
    return login_headers(client, cajero_user["email"], cajero_user["password"])


def crear_categoria(session_factory, nombre="Categoria Test"):
    db = session_factory()
    try:
        categoria = models.Categoria(nombre=nombre, descripcion="Categoria de pruebas")
        db.add(categoria)
        db.commit()
        db.refresh(categoria)
        return {"id_categoria": categoria.id_categoria, "nombre": categoria.nombre}
    finally:
        db.close()


def crear_producto(
    session_factory,
    *,
    nombre="Producto Test",
    codigo_barras="PROD-TEST-001",
    precio_unitario=100.0,
    stock_actual=10,
    stock_minimo=2,
    id_categoria=None,
):
    if id_categoria is None:
        id_categoria = crear_categoria(session_factory)["id_categoria"]

    db = session_factory()
    try:
        producto = models.Producto(
            nombre=nombre,
            codigo_barras=codigo_barras,
            precio_unitario=precio_unitario,
            stock_actual=stock_actual,
            stock_minimo=stock_minimo,
            id_categoria=id_categoria,
        )
        db.add(producto)
        db.commit()
        db.refresh(producto)
        return {
            "id_producto": producto.id_producto,
            "nombre": producto.nombre,
            "codigo_barras": producto.codigo_barras,
            "precio_unitario": producto.precio_unitario,
            "stock_actual": producto.stock_actual,
            "stock_minimo": producto.stock_minimo,
            "id_categoria": producto.id_categoria,
        }
    finally:
        db.close()


@pytest.fixture()
def categoria(session_factory):
    return crear_categoria(session_factory)


@pytest.fixture()
def producto(session_factory, categoria):
    return crear_producto(session_factory, id_categoria=categoria["id_categoria"])


def obtener_producto(session_factory, producto_id):
    db = session_factory()
    try:
        producto = db.query(models.Producto).filter(
            models.Producto.id_producto == producto_id
        ).first()
        return {
            "id_producto": producto.id_producto,
            "stock_actual": producto.stock_actual,
            "stock_minimo": producto.stock_minimo,
        }
    finally:
        db.close()


def abrir_corte(client, headers):
    response = client.post("/api/v1/cortes/", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture()
def abrir_turno(client, cajero_headers):
    return abrir_corte(client, cajero_headers)
