"""
Configuración de la base de datos SQLite con SQLAlchemy.

Este módulo establece la conexión a la base de datos, define la sesión
y provee la dependencia `get_db` para inyección en los endpoints de FastAPI.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# La base de datos se crea en la raíz del directorio backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'stoko.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Necesario para SQLite con FastAPI
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency que provee una sesión de base de datos por request.
    Se cierra automáticamente al finalizar el request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
