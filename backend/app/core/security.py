"""
core/security.py — Utilidades de seguridad: hashing de passwords y JWT.
"""

from datetime import datetime, timedelta
import os
from typing import Optional

from jose import JWTError, jwt
import bcrypt

# Configuración 
SECRET_KEY  = os.getenv("STOKO_SECRET_KEY", "stoko-super-secret-key-cambiar-en-produccion")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480   # 8 horas


# Password 

def hash_password(password: str) -> str:
    """Genera el hash bcrypt de un password en texto plano."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si el password en texto plano coincide con el hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# JWT 

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT firmado con los datos del usuario."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y verifica el JWT.
    Retorna el payload si es válido, None si está expirado o es inválido.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
