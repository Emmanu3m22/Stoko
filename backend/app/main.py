"""
main.py — Punto de entrada de la API Stoko.

Conecta la BD real (SQLite), registra todos los routers y siembra
datos iniciales (roles, admin, productos de ejemplo) en el primer arranque.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, SessionLocal
from app import models

# Importar todos los modelos para que SQLAlchemy los registre
from app.models import (
    Rol, Usuario, Categoria, Producto,
    Venta, DetalleVenta, CorteCaja, Incidencia, LogAuditoria,
    ConfiguracionSistema,
)

# Crear todas las tablas 
models.Base.metadata.create_all(bind=engine)

# Crear la aplicación
app = FastAPI(
    title="Stoko API",
    description=(
        "API REST para el Sistema de Inventarios y Punto de Venta STOKO. "
        "Gestiona productos, ventas, cortes de caja, incidencias y auditorías."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers 
from app.routers import auth, usuarios, categorias, productos, ventas, cortes, incidencias, auditorias, reportes, configuracion, sistema

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(cortes.router)
app.include_router(incidencias.router)
app.include_router(auditorias.router)
app.include_router(reportes.router)
app.include_router(configuracion.router)
app.include_router(sistema.router)


# Endpoint raíz 
@app.get("/", tags=["Root"])
def root():
    return {
        "mensaje": "Bienvenido a Stoko API v2.0",
        "documentacion": "/docs",
        "redoc": "/redoc",
    }


# Seed inicial (se ejecuta una vez al arrancar) 

def _seed_database():
    """
    Siembra datos iniciales si la BD está vacía:
    - Roles: administrador, cajero
    - Categorías y productos de ejemplo
    """
    db = SessionLocal()
    try:
        # Roles 
        if db.query(Rol).count() == 0:
            roles = [
                Rol(nombre="administrador"),
                Rol(nombre="cajero"),
            ]
            db.add_all(roles)
            db.commit()
            print("[Seed] Roles creados: administrador, cajero")

        if db.query(Usuario).count() == 0:
            print("[Seed] Sin usuarios: crea el administrador inicial desde la app.")

        # Categorías
        if db.query(Categoria).count() == 0:
            cats = [
                Categoria(nombre="Relojería"),
                Categoria(nombre="Accesorios"),
                Categoria(nombre="Óptica"),
                Categoria(nombre="Calzado Deportivo"),
                Categoria(nombre="General"),
            ]
            db.add_all(cats)
            db.commit()
            print("[Seed] Categorías creadas")

        #Productos de ejemplo 
        if db.query(Producto).count() == 0:
            cat_map = {c.nombre: c.id_categoria for c in db.query(Categoria).all()}
            productos = [
                Producto(
                    nombre="Reloj Cronógrafo Sovereign A",
                    codigo_barras="STK-0024-X",
                    precio_unitario=1240.0,
                    stock_actual=42,
                    stock_minimo=5,
                    id_categoria=cat_map.get("Relojería"),
                ),
                Producto(
                    nombre="Pulsera Titanium Edge",
                    codigo_barras="STK-0037-B",
                    precio_unitario=580.0,
                    stock_actual=15,
                    stock_minimo=5,
                    id_categoria=cat_map.get("Accesorios"),
                ),
                Producto(
                    nombre="Gafas Polarizadas Onyx",
                    codigo_barras="STK-0051-C",
                    precio_unitario=890.0,
                    stock_actual=8,
                    stock_minimo=10,
                    id_categoria=cat_map.get("Óptica"),
                ),
                Producto(
                    nombre="Zapatillas Running Pro",
                    codigo_barras="ZAP-RUN-001",
                    precio_unitario=850.5,
                    stock_actual=3,
                    stock_minimo=5,
                    id_categoria=cat_map.get("Calzado Deportivo"),
                ),
            ]
            db.add_all(productos)
            db.commit()
            print("[Seed] Productos de ejemplo creados (4 productos)")

    except Exception as e:
        print(f"[Seed] Error durante el seed: {e}")
        db.rollback()
    finally:
        db.close()


# Ejecutar seed al iniciar 
_seed_database()
