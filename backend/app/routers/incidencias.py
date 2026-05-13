"""
routers/incidencias.py — Registro de ajustes manuales de inventario.

Reglas de negocio:
  - `cantidad` negativa = merma/pérdida (descuenta del stock).
  - `cantidad` positiva = ajuste de entrada (suma al stock).
  - No se puede reducir el stock a menos de 0.

Endpoints:
  POST  /api/v1/incidencias/      — Registrar incidencia
  GET   /api/v1/incidencias/      — Listar incidencias (con filtros)
  GET   /api/v1/incidencias/{id}  — Obtener por ID
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/incidencias", tags=["Incidencias"])


@router.post("/", response_model=schemas.IncidenciaResponse, status_code=201)
def registrar_incidencia(
    datos: schemas.IncidenciaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """
    Registrar un ajuste manual de stock.
    - cantidad < 0: merma, daño, caducidad.
    - cantidad > 0: ajuste de entrada, devolución de proveedor.
    """
    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == datos.id_producto
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Calcular nuevo stock y validar que no sea negativo
    nuevo_stock = producto.stock_actual + datos.cantidad
    if nuevo_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede registrar la incidencia: el stock resultante sería {nuevo_stock}. "
                   f"Stock actual: {producto.stock_actual}",
        )

    if datos.id_corte:
        corte = db.query(models.CorteCaja).filter(
            models.CorteCaja.id_corte == datos.id_corte,
            models.CorteCaja.estado == "abierto",
        ).first()
        if not corte:
            raise HTTPException(status_code=400, detail="El turno indicado no existe o está cerrado")
        if corte.id_usuario != current_user.id_usuario:
            raise HTTPException(status_code=403, detail="No puedes registrar mermas en el turno de otro usuario")
    else:
        corte = db.query(models.CorteCaja).filter(
            models.CorteCaja.id_usuario == current_user.id_usuario,
            models.CorteCaja.estado == "abierto",
        ).first()

    if not corte:
        raise HTTPException(
            status_code=400,
            detail="No tienes un turno de caja abierto. Abre un turno antes de registrar mermas o ajustes.",
        )

    producto.stock_actual = nuevo_stock

    incidencia = models.Incidencia(
        id_producto=datos.id_producto,
        id_usuario=current_user.id_usuario,
        id_corte=corte.id_corte,
        cantidad=datos.cantidad,
        causa=datos.causa,
    )
    db.add(incidencia)
    db.commit()
    db.refresh(incidencia)

    tipo = "merma" if datos.cantidad < 0 else "ajuste de entrada"
    auditoria_service.registrar(
        db,
        operacion="registrar_incidencia",
        detalles=f"Incidencia ({tipo}) en '{producto.nombre}': {datos.cantidad} uds. Causa: {datos.causa}",
        id_usuario=current_user.id_usuario,
    )
    return incidencia


@router.get("/", response_model=list[schemas.IncidenciaResponse])
def listar_incidencias(
    skip:       int = Query(0,  ge=0),
    limit:      int = Query(50, ge=1, le=500),
    id_producto: int = Query(None, description="Filtrar por producto"),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Listar incidencias con filtros opcionales."""
    q = db.query(models.Incidencia)
    if id_producto:
        q = q.filter(models.Incidencia.id_producto == id_producto)
    return q.order_by(models.Incidencia.fecha.desc()).offset(skip).limit(limit).all()


@router.get("/{incidencia_id}", response_model=schemas.IncidenciaResponse)
def obtener_incidencia(
    incidencia_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    inc = db.query(models.Incidencia).filter(
        models.Incidencia.id_incidencia == incidencia_id
    ).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    return inc
