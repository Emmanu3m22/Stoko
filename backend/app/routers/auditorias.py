"""
routers/auditorias.py — Consulta del log de auditoría (solo lectura).

Endpoints:
  GET /api/v1/auditorias/   — Listar entradas del log (admin)
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.deps import require_admin

router = APIRouter(prefix="/api/v1/auditorias", tags=["Auditorías"])


@router.get("/", response_model=list[schemas.AuditoriaResponse])
def listar_auditorias(
    skip:  int = Query(0,   ge=0),
    limit: int = Query(100, ge=1, le=1000),
    operacion: str = Query("", description="Filtrar por tipo de operación"),
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """
    Consultar el log de auditoría. Solo administradores.
    Ordenado del más reciente al más antiguo.
    """
    q = db.query(models.LogAuditoria)
    if operacion:
        q = q.filter(models.LogAuditoria.operacion.ilike(f"%{operacion}%"))
    return q.order_by(models.LogAuditoria.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/reportes/resumen")
def resumen_reportes(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """
    Resumen de métricas para el módulo de Reportes del dashboard.
    Retorna totales de ventas, productos y operaciones del día.
    """
    from datetime import datetime, date
    from sqlalchemy import func

    hoy = date.today()

    # Ventas del día
    ventas_hoy = db.query(
        func.count(models.Venta.id_venta).label("num_ventas"),
        func.coalesce(func.sum(models.Venta.total), 0).label("total_ventas"),
    ).filter(
        func.date(models.Venta.fecha) == hoy,
        models.Venta.anulada == False,
    ).first()

    # Total productos
    total_productos = db.query(func.count(models.Producto.id_producto)).scalar()

    # Productos con stock bajo
    stock_bajos = db.query(func.count(models.Producto.id_producto)).filter(
        models.Producto.stock_actual <= models.Producto.stock_minimo
    ).scalar()

    # Valor del inventario
    valor_inventario = db.query(
        func.coalesce(
            func.sum(models.Producto.precio_unitario * models.Producto.stock_actual), 0
        )
    ).scalar()

    return {
        "ventas_hoy":       ventas_hoy.num_ventas,
        "total_hoy":        round(float(ventas_hoy.total_ventas), 2),
        "total_productos":  total_productos,
        "stock_bajos":      stock_bajos,
        "valor_inventario": round(float(valor_inventario), 2),
    }
