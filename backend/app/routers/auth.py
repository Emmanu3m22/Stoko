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
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])


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

    token = create_access_token(data={"sub": str(usuario.id_usuario)})

    # Log de auditoría
    auditoria_service.registrar(
        db,
        operacion="login",
        detalles=f"Usuario {usuario.email} inició sesión",
        id_usuario=usuario.id_usuario,
    )

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario_id=usuario.id_usuario,
        nombre=usuario.nombre,
        rol=usuario.rol.nombre,
    )


@router.get("/me", response_model=schemas.UsuarioResponse)
def perfil_actual(current_user: models.Usuario = Depends(get_current_user)):
    """Retorna el perfil del usuario autenticado."""
    return current_user
