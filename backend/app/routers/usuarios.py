"""
routers/usuarios.py — CRUD de usuarios del sistema.

Endpoints (solo ADMINISTRADOR puede gestionar usuarios):
  POST   /api/v1/usuarios/          — Crear usuario
  GET    /api/v1/usuarios/          — Listar usuarios
  GET    /api/v1/usuarios/{id}      — Obtener por ID
  PATCH  /api/v1/usuarios/{id}      — Actualizar
  DELETE /api/v1/usuarios/{id}      — Desactivar (soft-delete)
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/usuarios", tags=["Usuarios"])


def _crear_usuario_desde_datos(
    db: Session,
    *,
    nombre: str,
    email: str,
    password: str,
    id_rol: int,
) -> models.Usuario:
    if db.query(models.Usuario).filter(models.Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    rol = db.query(models.Rol).filter(models.Rol.id_rol == id_rol).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    usuario = models.Usuario(
        nombre=nombre,
        email=email,
        password=hash_password(password),
        id_rol=id_rol,
    )
    db.add(usuario)
    db.flush()
    return usuario


@router.post("/", response_model=schemas.UsuarioResponse, status_code=201)
def crear_usuario(
    datos: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Crear un nuevo usuario. Solo administradores."""
    usuario = _crear_usuario_desde_datos(
        db,
        nombre=datos.nombre,
        email=str(datos.email).lower(),
        password=datos.password,
        id_rol=datos.id_rol,
    )
    db.commit()
    db.refresh(usuario)

    auditoria_service.registrar(
        db,
        operacion="crear_usuario",
        detalles=f"Nuevo usuario creado: {usuario.email}",
        id_usuario=_admin.id_usuario,
    )
    return usuario


@router.get("/", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Listar todos los usuarios. Solo administradores."""
    return db.query(models.Usuario).all()


@router.get("/solicitudes-acceso/", response_model=list[schemas.SolicitudAccesoResponse])
def listar_solicitudes_acceso(
    estado: str = "pendiente",
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Listar solicitudes de acceso para revisión administrativa."""
    query = db.query(models.SolicitudAcceso)
    if estado != "todas":
        query = query.filter(models.SolicitudAcceso.estado == estado)
    return query.order_by(models.SolicitudAcceso.fecha.desc()).all()


@router.patch("/solicitudes-acceso/{solicitud_id}", response_model=schemas.SolicitudAccesoResponse)
def resolver_solicitud_acceso(
    solicitud_id: int,
    datos: schemas.SolicitudAccesoDecision,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin),
):
    """Aprobar o rechazar una solicitud de acceso."""
    solicitud = db.query(models.SolicitudAcceso).filter(
        models.SolicitudAcceso.id_solicitud == solicitud_id,
    ).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if solicitud.estado != "pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya fue resuelta")

    if datos.estado == "aprobada":
        if not datos.password:
            raise HTTPException(status_code=400, detail="Define una contraseña temporal para aprobar la solicitud")

        rol = None
        if datos.id_rol:
            rol = db.query(models.Rol).filter(models.Rol.id_rol == datos.id_rol).first()
        if not rol:
            rol = db.query(models.Rol).filter(models.Rol.nombre == solicitud.rol_solicitado).first()
        if not rol:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        usuario = _crear_usuario_desde_datos(
            db,
            nombre=solicitud.nombre,
            email=solicitud.email,
            password=datos.password,
            id_rol=rol.id_rol,
        )
        solicitud.id_usuario_creado = usuario.id_usuario

    solicitud.estado = datos.estado
    solicitud.fecha_resolucion = datetime.utcnow()
    solicitud.id_usuario_resolvio = admin.id_usuario

    db.commit()
    db.refresh(solicitud)

    auditoria_service.registrar(
        db,
        operacion="resolver_solicitud_acceso",
        detalles=f"Solicitud {solicitud.email} marcada como {solicitud.estado}",
        id_usuario=admin.id_usuario,
    )
    return solicitud


@router.get("/{usuario_id}", response_model=schemas.UsuarioResponse)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user),
):
    """Obtener usuario por ID. Administradores pueden ver cualquiera; cajeros solo su perfil."""
    if current_user.rol.nombre.lower() != "administrador" and current_user.id_usuario != usuario_id:
        raise HTTPException(status_code=403, detail="Sin permisos para ver este usuario")

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.patch("/{usuario_id}", response_model=schemas.UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    datos: schemas.UsuarioUpdate,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Actualizar un usuario parcialmente. Solo administradores."""
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    updates = datos.model_dump(exclude_unset=True)
    if "email" in updates:
        existente = db.query(models.Usuario).filter(
            models.Usuario.email == updates["email"],
            models.Usuario.id_usuario != usuario_id,
        ).first()
        if existente:
            raise HTTPException(status_code=400, detail="El email ya está registrado")

    if "password" in updates:
        updates["password"] = hash_password(updates["password"])

    for campo, valor in updates.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)

    auditoria_service.registrar(
        db,
        operacion="editar_usuario",
        detalles=f"Usuario {usuario.email} actualizado",
        id_usuario=_admin.id_usuario,
    )
    return usuario


@router.delete("/{usuario_id}", response_model=schemas.MensajeResponse)
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Desactivar usuario (soft-delete). Solo administradores."""
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.id_usuario == _admin.id_usuario:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propio usuario")

    usuario.activo = False
    db.commit()

    auditoria_service.registrar(
        db,
        operacion="desactivar_usuario",
        detalles=f"Usuario {usuario.email} desactivado",
        id_usuario=_admin.id_usuario,
    )
    return {"mensaje": f"Usuario '{usuario.nombre}' desactivado correctamente"}
