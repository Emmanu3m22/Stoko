"""
core/security.py — Utilidades de seguridad: hashing de passwords y JWT.
"""

from datetime import datetime, timedelta
import os
from pathlib import Path
import secrets
from typing import Optional

from jose import JWTError, jwt
import bcrypt

BASE_DIR = Path(__file__).resolve().parents[2]


def _directorio_configuracion_local() -> Path:
    config_dir = os.getenv("STOKO_CONFIG_DIR")
    if config_dir:
        return Path(config_dir).expanduser()

    db_path = os.getenv("STOKO_DB_PATH")
    if db_path:
        return Path(db_path).expanduser().parent

    return BASE_DIR / ".stoko"


def obtener_secret_key() -> str:
    """
    Obtiene la clave JWT de la instalación.

    Si no se define STOKO_SECRET_KEY, se genera una clave local persistente.
    Esto evita compartir un secreto fijo entre instalaciones.
    """
    env_secret = os.getenv("STOKO_SECRET_KEY", "").strip()
    if env_secret:
        return env_secret

    secret_path = _directorio_configuracion_local() / "jwt_secret"
    secret_path.parent.mkdir(parents=True, exist_ok=True)

    if secret_path.exists():
        saved_secret = secret_path.read_text(encoding="utf-8").strip()
        if saved_secret:
            return saved_secret

    generated_secret = secrets.token_urlsafe(64)
    secret_path.write_text(generated_secret, encoding="utf-8")
    try:
        secret_path.chmod(0o600)
    except OSError:
        pass
    return generated_secret


# Configuración
SECRET_KEY  = obtener_secret_key()
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
