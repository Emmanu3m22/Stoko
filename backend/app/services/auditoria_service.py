"""
services/auditoria_service.py — Helper para escribir en el log de auditoría.

Uso:
  from app.services import auditoria_service
  auditoria_service.registrar(db, operacion="crear_producto", detalles="...", id_usuario=1)
"""

from sqlalchemy.orm import Session
from typing import Optional

from app import models


def registrar(
    db: Session,
    operacion: str,
    detalles: Optional[str] = None,
    id_usuario: Optional[int] = None,
) -> models.LogAuditoria:
    """
    Crea una entrada en el log de auditorías.
    La llamada NO hace commit — el commit es responsabilidad del router llamante
    o se puede dejar que SQLAlchemy lo incluya en la transacción actual.
    """
    log = models.LogAuditoria(
        operacion=operacion,
        detalles=detalles,
        id_usuario=id_usuario,
    )
    db.add(log)
    # Flush para que el log quede dentro de la transacción actual
    try:
        db.flush()
    except Exception:
        pass  # Si la sesión ya fue cerrada o hay un error, no bloquear
    return log
