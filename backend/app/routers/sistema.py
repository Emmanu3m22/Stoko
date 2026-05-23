"""
routers/sistema.py — Estado operativo local.
"""

from datetime import datetime, timezone
from pathlib import Path
import sqlite3
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import models
from app.core.deps import require_admin
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


def _obtener_ruta_sqlite(db: Session) -> Path:
    rows = db.execute(text("PRAGMA database_list")).mappings().all()
    principal = next((row for row in rows if row.get("name") == "main"), None)
    db_file = principal.get("file") if principal else None

    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La base de datos actual no permite generar un respaldo de archivo.",
        )

    path = Path(db_file)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el archivo de base de datos local.",
        )

    return path


@router.get("/respaldo")
def descargar_respaldo_sistema(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Descarga un respaldo consistente de la base SQLite local."""
    origen_path = _obtener_ruta_sqlite(db)

    with NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        destino_path = Path(tmp.name)

    try:
        origen = sqlite3.connect(str(origen_path))
        destino = sqlite3.connect(str(destino_path))
        try:
            origen.backup(destino)
        finally:
            destino.close()
            origen.close()

        contenido = destino_path.read_bytes()
    finally:
        destino_path.unlink(missing_ok=True)

    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Response(
        content=contenido,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="stoko_respaldo_{fecha}.db"',
        },
    )
