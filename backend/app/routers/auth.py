"""
routers/auth.py — Endpoints de autenticación (login).

POST /api/v1/auth/login  — Obtener token JWT
GET  /api/v1/auth/me     — Perfil del usuario autenticado
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.security import verify_password, create_access_token, hash_password
from app.core.deps import get_current_user
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])


def _asegurar_roles_base(db: Session) -> models.Rol:
    roles_existentes = {
        rol.nombre.lower(): rol
        for rol in db.query(models.Rol).filter(models.Rol.nombre.in_(["administrador", "cajero"])).all()
    }

    for nombre in ["administrador", "cajero"]:
        if nombre not in roles_existentes:
            rol = models.Rol(nombre=nombre)
            db.add(rol)
            db.flush()
            roles_existentes[nombre] = rol

    return roles_existentes["administrador"]


def _crear_respuesta_token(usuario: models.Usuario) -> schemas.TokenResponse:
    token = create_access_token(data={"sub": str(usuario.id_usuario)})
    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario_id=usuario.id_usuario,
        nombre=usuario.nombre,
        rol=usuario.rol.nombre,
    )


@router.get("/setup", response_model=schemas.SetupInicialStatus)
def estado_setup_inicial(db: Session = Depends(get_db)):
    """Indica si esta instalación todavía necesita crear el primer administrador."""
    return schemas.SetupInicialStatus(
        requiere_configuracion=db.query(models.Usuario).count() == 0,
    )


@router.post("/setup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def crear_setup_inicial(
    datos: schemas.SetupInicialCreate,
    db: Session = Depends(get_db),
):
    """Crea el primer administrador de una instalación local nueva."""
    if db.query(models.Usuario).count() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La instalación ya tiene usuarios configurados.",
        )

    rol_admin = _asegurar_roles_base(db)
    usuario = models.Usuario(
        nombre=datos.nombre.strip(),
        email=str(datos.email).strip().lower(),
        password=hash_password(datos.password),
        id_rol=rol_admin.id_rol,
        activo=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    auditoria_service.registrar(
        db,
        operacion="setup_inicial",
        detalles=f"Administrador inicial creado: {usuario.email}",
        id_usuario=usuario.id_usuario,
    )

    return _crear_respuesta_token(usuario)


@router.post("/solicitudes-acceso", response_model=schemas.SolicitudAccesoResponse, status_code=status.HTTP_201_CREATED)
def crear_solicitud_acceso(
    datos: schemas.SolicitudAccesoCreate,
    db: Session = Depends(get_db),
):
    """Registra una solicitud de acceso para revisión de un administrador."""
    email = str(datos.email).strip().lower()
    if db.query(models.Usuario).filter(models.Usuario.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese correo.",
        )

    pendiente = db.query(models.SolicitudAcceso).filter(
        models.SolicitudAcceso.email == email,
        models.SolicitudAcceso.estado == "pendiente",
    ).first()
    if pendiente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya hay una solicitud pendiente para ese correo.",
        )

    solicitud = models.SolicitudAcceso(
        nombre=datos.nombre.strip(),
        email=email,
        rol_solicitado=datos.rol_solicitado,
        mensaje=datos.mensaje.strip() if datos.mensaje else None,
        estado="pendiente",
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return solicitud


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Autenticar usuario y obtener JWT.

    Usa OAuth2 Password Flow (form data: username=email, password).
    """
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == form_data.username,
        models.Usuario.activo == True,
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no registrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, usuario.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log de auditoría
    auditoria_service.registrar(
        db,
        operacion="login",
        detalles=f"Usuario {usuario.email} inició sesión",
        id_usuario=usuario.id_usuario,
    )

    return _crear_respuesta_token(usuario)


@router.get("/me", response_model=schemas.UsuarioResponse)
def perfil_actual(current_user: models.Usuario = Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado."""
    return current_user
