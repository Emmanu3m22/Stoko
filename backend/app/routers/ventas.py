"""
routers/ventas.py — Registro y consulta de ventas (POS).

Reglas de negocio:
  - Al crear una venta se descuenta el stock de cada producto.
  - El precio_historico se fija al precio_unitario actual del producto.
  - El subtotal, impuesto (16% IVA) y total se calculan en el servidor.
  - Una venta anulada devuelve el stock (rollback de inventario).
  - No se puede crear una venta con un producto sin stock suficiente.

Endpoints:
  POST  /api/v1/ventas/           — Registrar venta
  GET   /api/v1/ventas/           — Listar ventas (con filtros)
  GET   /api/v1/ventas/{id}       — Obtener venta con detalles
  POST  /api/v1/ventas/{id}/anular — Anular venta
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, require_admin
from app.services import auditoria_service

IVA = 0.16

router = APIRouter(prefix="/api/v1/ventas", tags=["Ventas"])


@router.post("/", response_model=schemas.VentaResponse, status_code=201)
def registrar_venta(
    datos: schemas.VentaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """
    Registrar una nueva venta.

    - Valida stock disponible para cada ítem.
    - Descuenta stock de cada producto.
    - Calcula subtotal, IVA 16% y total.
    - Guarda precio_historico de cada producto en el momento de la venta.
    """
    # Validar y construir detalles
    detalles = []
    subtotal = 0.0

    for item in datos.items:
        producto = db.query(models.Producto).filter(
            models.Producto.id_producto == item.id_producto
        ).first()
        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto ID {item.id_producto} no encontrado",
            )
        if producto.stock_actual < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{producto.nombre}'. "
                       f"Disponible: {producto.stock_actual}, solicitado: {item.cantidad}",
            )

        precio_hist = producto.precio_unitario
        sub_item    = precio_hist * item.cantidad
        subtotal   += sub_item

        detalles.append(models.DetalleVenta(
            id_producto=item.id_producto,
            cantidad=item.cantidad,
            precio_historico=precio_hist,
            subtotal=sub_item,
        ))

        # Descontar stock
        producto.stock_actual -= item.cantidad

    impuesto = round(subtotal * IVA, 2)
    total    = round(subtotal + impuesto, 2)
    subtotal = round(subtotal, 2)

    venta = models.Venta(
        subtotal=subtotal,
        impuesto=impuesto,
        total=total,
        metodo_pago=datos.metodo_pago,
        id_usuario=current_user.id_usuario,
        id_corte=datos.id_corte,
    )
    db.add(venta)
    db.flush()  # Obtener id_venta antes del commit

    for detalle in detalles:
        detalle.id_venta = venta.id_venta
        db.add(detalle)

    # Sumar al total del corte si aplica
    if datos.id_corte:
        corte = db.query(models.CorteCaja).filter(
            models.CorteCaja.id_corte == datos.id_corte,
            models.CorteCaja.estado == "abierto",
        ).first()
        if corte:
            corte.total_ventas = round(corte.total_ventas + total, 2)

    db.commit()
    db.refresh(venta)

    auditoria_service.registrar(
        db,
        operacion="registrar_venta",
        detalles=f"Venta #{venta.id_venta} — Total: ${total:.2f} — Método: {datos.metodo_pago}",
        id_usuario=current_user.id_usuario,
    )
    return venta


@router.get("/", response_model=list[schemas.VentaResumen])
def listar_ventas(
    skip:    int  = Query(0,   ge=0),
    limit:   int  = Query(50,  ge=1, le=500),
    anuladas: bool = Query(False, description="Incluir ventas anuladas"),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Listar ventas (sin detalles de línea para mayor eficiencia)."""
    q = db.query(models.Venta)
    if not anuladas:
        q = q.filter(models.Venta.anulada == False)
    return q.order_by(models.Venta.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/reporte", response_model=schemas.VentaReporte)
def generar_reporte(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin),
):
    """
    Genera un reporte agregado de ventas en un periodo dado.
    Solo para administradores.
    """
    if fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="fecha_inicio no puede ser posterior a fecha_fin")

    # 1. Total y número de transacciones
    resumen = db.query(
        func.count(models.Venta.id_venta).label("num_transacciones"),
        func.sum(models.Venta.total).label("total_periodo")
    ).filter(
        models.Venta.anulada == False,
        func.date(models.Venta.fecha) >= fecha_inicio,
        func.date(models.Venta.fecha) <= fecha_fin
    ).first()

    num_transacciones = resumen.num_transacciones or 0
    total_periodo = resumen.total_periodo or 0.0

    # 2. Desglose por método de pago
    pagos_query = db.query(
        models.Venta.metodo_pago,
        func.sum(models.Venta.total).label("total")
    ).filter(
        models.Venta.anulada == False,
        func.date(models.Venta.fecha) >= fecha_inicio,
        func.date(models.Venta.fecha) <= fecha_fin
    ).group_by(models.Venta.metodo_pago).all()

    por_metodo_pago = {p.metodo_pago: float(p.total) for p in pagos_query}

    # 3. Productos más vendidos (Top 10)
    top_query = db.query(
        models.Producto.nombre,
        func.sum(models.DetalleVenta.cantidad).label("cantidad_vendida"),
        func.sum(models.DetalleVenta.subtotal).label("ingreso_generado")
    ).join(
        models.DetalleVenta, models.DetalleVenta.id_producto == models.Producto.id_producto
    ).join(
        models.Venta, models.Venta.id_venta == models.DetalleVenta.id_venta
    ).filter(
        models.Venta.anulada == False,
        func.date(models.Venta.fecha) >= fecha_inicio,
        func.date(models.Venta.fecha) <= fecha_fin
    ).group_by(
        models.Producto.id_producto
    ).order_by(
        desc("cantidad_vendida")
    ).limit(10).all()

    productos_top = [
        {
            "nombre": row.nombre,
            "cantidad": row.cantidad_vendida,
            "ingreso": float(row.ingreso_generado)
        }
        for row in top_query
    ]

    # Auditoría
    auditoria_service.registrar(
        db,
        operacion="generar_reporte_ventas",
        detalles=f"Reporte consultado del {fecha_inicio} al {fecha_fin}",
        id_usuario=current_user.id_usuario,
    )
    db.commit()

    return {
        "total_periodo": total_periodo,
        "num_transacciones": num_transacciones,
        "por_metodo_pago": por_metodo_pago,
        "productos_top": productos_top,
    }


@router.get("/{venta_id}", response_model=schemas.VentaResponse)
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Obtener venta con todos sus detalles de línea."""
    venta = db.query(models.Venta).filter(models.Venta.id_venta == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("/{venta_id}/anular", response_model=schemas.MensajeResponse)
def anular_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin),
):
    """
    Anular una venta y restaurar el stock de cada producto.
    Solo administradores pueden anular ventas.
    """
    venta = db.query(models.Venta).filter(models.Venta.id_venta == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.anulada:
        raise HTTPException(status_code=400, detail="La venta ya fue anulada")

    # Restaurar stock
    for detalle in venta.detalles:
        detalle.producto.stock_actual += detalle.cantidad

    # Restar del total del corte
    if venta.id_corte:
        corte = db.query(models.CorteCaja).filter(
            models.CorteCaja.id_corte == venta.id_corte
        ).first()
        if corte:
            corte.total_ventas = round(max(0, corte.total_ventas - venta.total), 2)

    venta.anulada = True
    db.commit()

    auditoria_service.registrar(
        db,
        operacion="anular_venta",
        detalles=f"Venta #{venta_id} anulada. Stock restaurado.",
        id_usuario=current_user.id_usuario,
    )
    return {"mensaje": f"Venta #{venta_id} anulada correctamente"}
