"""
database.py — Configuración de la base de datos SQLite con SQLAlchemy.

Establece la conexión, la sesión y la dependencia `get_db` para inyección en FastAPI.
"""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).resolve().parents[1]


def _asegurar_directorio_sqlite(database_url: str) -> None:
    if not database_url.startswith("sqlite:///"):
        return

    raw_path = database_url.removeprefix("sqlite:///")
    if not raw_path or raw_path == ":memory:":
        return

    Path(raw_path).expanduser().parent.mkdir(parents=True, exist_ok=True)


def construir_database_url(database_url: str | None = None, db_path: str | None = None) -> str:
    """
    Resuelve la ubicación de la base.

    Prioridad:
    1. DATABASE_URL para despliegues avanzados.
    2. STOKO_DB_PATH para instalación local/Electron.
    3. backend/stoko.db para desarrollo.
    """
    if database_url:
        _asegurar_directorio_sqlite(database_url)
        return database_url

    path = Path(db_path).expanduser() if db_path else BASE_DIR / "stoko.db"
    if not path.is_absolute():
        path = BASE_DIR / path

    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path}"


DATABASE_URL = construir_database_url(
    database_url=os.getenv("DATABASE_URL"),
    db_path=os.getenv("STOKO_DB_PATH"),
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Requerido para SQLite con FastAPI
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependencia que provee una sesión de BD por request.
    Se cierra automáticamente al finalizar el request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
