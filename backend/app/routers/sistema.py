"""
routers/sistema.py — Estado operativo local.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/api/v1/sistema", tags=["Sistema"])


@router.get("/estado")
def obtener_estado_sistema(db: Session = Depends(get_db)):
    """Comprueba que la API y la conexión SQLite están disponibles."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La base de datos local no está disponible.",
        ) from exc

    return {
        "estado": "ok",
        "base_datos": "conectada",
        "hora": datetime.now(timezone.utc).isoformat(),
    }
