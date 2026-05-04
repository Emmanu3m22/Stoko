"""
routers/cortes.py — Gestión del turno de caja (Cortes de caja).

Reglas de negocio:
  - Solo puede existir UN corte abierto por usuario a la vez.
  - Al cerrar el corte se compara el total_ventas calculado con el efectivo_real.
  - La diferencia (faltante/sobrante) se persiste en la BD.

Endpoints:
  POST  /api/v1/cortes/              — Abrir nuevo turno
  GET   /api/v1/cortes/              — Listar cortes (admin)
  GET   /api/v1/cortes/activo        — Obtener el corte abierto del usuario actual
  GET   /api/v1/cortes/{id}          — Obtener corte por ID
  POST  /api/v1/cortes/{id}/cerrar   — Cerrar corte con efectivo real
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, require_admin
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/cortes", tags=["Cortes de Caja"])


@router.post("/", response_model=schemas.CorteResponse, status_code=201)
def abrir_corte(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """Abrir un nuevo turno de caja. Un usuario solo puede tener un turno abierto."""
    corte_activo = db.query(models.CorteCaja).filter(
        models.CorteCaja.id_usuario == current_user.id_usuario,
        models.CorteCaja.estado == "abierto",
    ).first()
    if corte_activo:
        raise HTTPException(
            status_code=400,
            detail=f"Ya tienes un turno abierto (ID #{corte_activo.id_corte}). Ciérralo antes de abrir uno nuevo.",
        )

    corte = models.CorteCaja(
        id_usuario=current_user.id_usuario,
        estado="abierto",
        total_ventas=0.0,
    )
    db.add(corte)
    db.commit()
    db.refresh(corte)

    auditoria_service.registrar(
        db,
        operacion="abrir_corte",
        detalles=f"Corte #{corte.id_corte} abierto",
        id_usuario=current_user.id_usuario,
    )
    return corte


@router.get("/activo", response_model=schemas.CorteResponse)
def obtener_corte_activo(
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """Obtener el corte de caja actualmente abierto del usuario autenticado."""
    corte = db.query(models.CorteCaja).filter(
        models.CorteCaja.id_usuario == current_user.id_usuario,
        models.CorteCaja.estado == "abierto",
    ).first()
    if not corte:
        raise HTTPException(status_code=404, detail="No hay turno abierto actualmente")
    return corte


@router.get("/", response_model=list[schemas.CorteResponse])
def listar_cortes(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Listar todos los cortes. Solo administradores."""
    return db.query(models.CorteCaja).order_by(models.CorteCaja.fecha_apertura.desc()).all()


@router.get("/{corte_id}", response_model=schemas.CorteResponse)
def obtener_corte(
    corte_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    corte = db.query(models.CorteCaja).filter(models.CorteCaja.id_corte == corte_id).first()
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    return corte


@router.post("/{corte_id}/cerrar", response_model=schemas.CorteResponse)
def cerrar_corte(
    corte_id: int,
    datos: schemas.CorteCierre,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """
    Cerrar un turno de caja.

    - Calcula la diferencia: efectivo_real - total_ventas.
    - Un valor negativo indica faltante; positivo indica sobrante.
    """
    corte = db.query(models.CorteCaja).filter(models.CorteCaja.id_corte == corte_id).first()
    if not corte:
        raise HTTPException(status_code=404, detail="Corte no encontrado")
    if corte.estado == "cerrado":
        raise HTTPException(status_code=400, detail="El corte ya está cerrado")
    if corte.id_usuario != current_user.id_usuario:
        # Solo el dueño del corte o un admin puede cerrarlo
        if current_user.rol.nombre.lower() != "administrador":
            raise HTTPException(status_code=403, detail="No puedes cerrar el turno de otro usuario")

    corte.estado        = "cerrado"
    corte.fecha_cierre  = datetime.utcnow()
    corte.efectivo_real = datos.efectivo_real
    corte.diferencia    = round(datos.efectivo_real - corte.total_ventas, 2)

    db.commit()
    db.refresh(corte)

    auditoria_service.registrar(
        db,
        operacion="cerrar_corte",
        detalles=f"Corte #{corte_id} cerrado. Ventas: ${corte.total_ventas:.2f} | "
                 f"Efectivo: ${datos.efectivo_real:.2f} | Diferencia: ${corte.diferencia:.2f}",
        id_usuario=current_user.id_usuario,
    )
    return corte
