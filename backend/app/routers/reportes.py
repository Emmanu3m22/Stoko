"""
routers/reportes.py — Endpoints de reportes avanzados e insights con IA.
"""

import io
from datetime import datetime, time, date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.deps import require_admin
from app.database import get_db
from app.services.configuracion_service import obtener_configuracion_ia
from app.services.ia_service import IAServiceError, generar_insights
from app.services import exportacion_service

router = APIRouter(prefix="/api/v1/reportes", tags=["Reportes"])

def obtener_datos_periodo(db: Session, fecha_inicio: date, fecha_fin: date):
    if fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha final no puede ser anterior a la fecha inicial",
        )

    inicio = datetime.combine(fecha_inicio, time.min)
    fin = datetime.combine(fecha_fin, time.max)

    resumen_ventas = db.query(
        func.count(models.Venta.id_venta).label("num_ventas"),
        func.coalesce(func.sum(models.Venta.total), 0).label("total_ventas"),
        func.coalesce(func.sum(models.Venta.subtotal), 0).label("subtotal"),
        func.coalesce(func.sum(models.Venta.impuesto), 0).label("impuestos"),
    ).filter(
        models.Venta.fecha >= inicio,
        models.Venta.fecha <= fin,
        models.Venta.anulada == False,
    ).first()

    productos_vendidos = db.query(
        models.Producto.id_producto,
        models.Producto.nombre,
        func.coalesce(func.sum(models.DetalleVenta.cantidad), 0).label("unidades"),
        func.coalesce(func.sum(models.DetalleVenta.subtotal), 0).label("importe"),
    ).join(
        models.DetalleVenta,
        models.DetalleVenta.id_producto == models.Producto.id_producto,
    ).join(
        models.Venta,
        models.Venta.id_venta == models.DetalleVenta.id_venta,
    ).filter(
        models.Venta.fecha >= inicio,
        models.Venta.fecha <= fin,
        models.Venta.anulada == False,
    ).group_by(
        models.Producto.id_producto,
        models.Producto.nombre,
    ).order_by(
        func.sum(models.DetalleVenta.cantidad).desc(),
    ).all()

    metodos_pago = db.query(
        models.Venta.metodo_pago,
        func.count(models.Venta.id_venta).label("ventas"),
        func.coalesce(func.sum(models.Venta.total), 0).label("total"),
    ).filter(
        models.Venta.fecha >= inicio,
        models.Venta.fecha <= fin,
        models.Venta.anulada == False,
    ).group_by(models.Venta.metodo_pago).all()

    mermas = db.query(
        models.Producto.nombre,
        func.coalesce(func.sum(models.Incidencia.cantidad), 0).label("cantidad"),
        func.count(models.Incidencia.id_incidencia).label("eventos"),
    ).join(
        models.Producto,
        models.Producto.id_producto == models.Incidencia.id_producto,
    ).filter(
        models.Incidencia.fecha >= inicio,
        models.Incidencia.fecha <= fin,
        models.Incidencia.cantidad < 0,
    ).group_by(models.Producto.nombre).all()

    mermas_por_dia = db.query(
        func.strftime("%w", models.Incidencia.fecha).label("dia_semana"),
        func.coalesce(func.sum(models.Incidencia.cantidad), 0).label("cantidad"),
        func.count(models.Incidencia.id_incidencia).label("eventos"),
    ).filter(
        models.Incidencia.fecha >= inicio,
        models.Incidencia.fecha <= fin,
        models.Incidencia.cantidad < 0,
    ).group_by("dia_semana").all()

    stock_bajo = db.query(models.Producto).filter(
        models.Producto.stock_actual <= models.Producto.stock_minimo
    ).order_by(models.Producto.stock_actual.asc()).limit(10).all()

    ids_vendidos = {item.id_producto for item in productos_vendidos}
    baja_rotacion = db.query(models.Producto).filter(
        models.Producto.stock_actual > 0,
        ~models.Producto.id_producto.in_(ids_vendidos) if ids_vendidos else True,
    ).order_by(models.Producto.stock_actual.desc()).limit(10).all()

    datos_ventas = {
        "periodo": {
            "fecha_inicio": fecha_inicio.isoformat(),
            "fecha_fin": fecha_fin.isoformat(),
        },
        "resumen": {
            "num_ventas": int(resumen_ventas.num_ventas or 0),
            "subtotal": round(float(resumen_ventas.subtotal or 0), 2),
            "impuestos": round(float(resumen_ventas.impuestos or 0), 2),
            "total_ventas": round(float(resumen_ventas.total_ventas or 0), 2),
        },
        "productos_vendidos": [
            {
                "id_producto": p.id_producto,
                "nombre": p.nombre,
                "unidades": int(p.unidades or 0),
                "importe": round(float(p.importe or 0), 2),
            }
            for p in productos_vendidos[:10]
        ],
        "metodos_pago": [
            {
                "metodo_pago": m.metodo_pago,
                "ventas": int(m.ventas or 0),
                "total": round(float(m.total or 0), 2),
            }
            for m in metodos_pago
        ],
        "productos_baja_rotacion": [
            {
                "id_producto": p.id_producto,
                "nombre": p.nombre,
                "stock_actual": p.stock_actual,
            }
            for p in baja_rotacion
        ],
    }

    datos_mermas = {
        "mermas_por_producto": [
            {
                "nombre": m.nombre,
                "cantidad": int(m.cantidad or 0),
                "eventos": int(m.eventos or 0),
            }
            for m in mermas
        ],
        "mermas_por_dia_semana": [
            {
                "dia_semana": m.dia_semana,
                "cantidad": int(m.cantidad or 0),
                "eventos": int(m.eventos or 0),
            }
            for m in mermas_por_dia
        ],
        "productos_en_riesgo_stock": [
            {
                "id_producto": p.id_producto,
                "nombre": p.nombre,
                "stock_actual": p.stock_actual,
                "stock_minimo": p.stock_minimo,
            }
            for p in stock_bajo
        ],
    }
    
    return datos_ventas, datos_mermas

@router.get("/ventas")
def reporte_ventas(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """
    Retorna métricas de ventas del periodo sin llamar a la IA:
    total, num_transacciones, productos_top, metodos_pago, baja_rotacion.
    """
    datos_ventas, datos_mermas = obtener_datos_periodo(db, fecha_inicio, fecha_fin)
    return {**datos_ventas, **datos_mermas}


@router.post("/insights", response_model=schemas.InsightsResponse)
def generar_reporte_insights(
    datos: schemas.InsightsRequest,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """
    Generar recomendaciones estratégicas con IA a partir de ventas y mermas.
    """
    datos_ventas, datos_mermas = obtener_datos_periodo(db, datos.fecha_inicio, datos.fecha_fin)
    config_ia = obtener_configuracion_ia(db)

    try:
        insights = generar_insights(
            datos_ventas,
            datos_mermas,
            api_key=config_ia.api_key,
            model=config_ia.modelo,
        )
    except IAServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return schemas.InsightsResponse(
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        insights=insights,
    )

@router.get("/exportar")
def exportar_reporte(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    formato: str = Query(..., pattern="^(pdf|excel)$"),
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """
    Exporta el reporte de ventas y movimientos en PDF o Excel.
    """
    datos_ventas, _ = obtener_datos_periodo(db, fecha_inicio, fecha_fin)

    if formato == "pdf":
        archivo_bytes = exportacion_service.generar_pdf(datos_ventas)
        media_type = "application/pdf"
        filename = f"reporte_{fecha_inicio}_a_{fecha_fin}.pdf"
    else:
        archivo_bytes = exportacion_service.generar_excel(datos_ventas)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"reporte_{fecha_inicio}_a_{fecha_fin}.xlsx"

    return StreamingResponse(
        io.BytesIO(archivo_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
