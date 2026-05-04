"""
core/deps.py — Dependencias compartidas de FastAPI (autenticación, RBAC).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    """
    Dependencia que extrae y valida el usuario a partir del JWT Bearer token.
    Lanza 401 si el token es inválido o el usuario no existe/está inactivo.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    id_usuario: int = payload.get("sub")
    if id_usuario is None:
        raise credentials_exception

    usuario = db.query(models.Usuario).filter(
        models.Usuario.id_usuario == int(id_usuario),
        models.Usuario.activo == True,
    ).first()

    if usuario is None:
        raise credentials_exception

    return usuario


def require_admin(current_user: models.Usuario = Depends(get_current_user)) -> models.Usuario:
    """
    Dependencia que exige que el usuario tenga rol 'administrador'.
    Lanza 403 Forbidden en caso contrario.
    """
    if current_user.rol.nombre.lower() != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de Administrador para esta operación",
        )
    return current_user
