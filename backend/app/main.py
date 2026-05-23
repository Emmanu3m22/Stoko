"""
main.py — Punto de entrada de la API Stoko.

Conecta la BD real (SQLite), registra todos los routers y siembra
solo los roles base del sistema en el primer arranque.
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
    El catálogo queda vacío para que cada instalación capture sus datos reales.
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

        if db.query(Categoria).count() == 0 and db.query(Producto).count() == 0:
            print("[Seed] Catálogo sin datos de ejemplo.")

    except Exception as e:
        print(f"[Seed] Error durante el seed: {e}")
        db.rollback()
    finally:
        db.close()


# Ejecutar seed al iniciar 
_seed_database()
