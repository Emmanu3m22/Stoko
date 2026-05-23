"""
configuracion_service.py — Acceso a configuración local persistida.
"""

import os
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app import models

CLAVE_GEMINI_API_KEY = "gemini_api_key"
CLAVE_GEMINI_MODEL = "gemini_model"
MODELO_GEMINI_DEFAULT = "gemini-3-flash-preview"


@dataclass
class ConfiguracionIA:
    api_key: str | None
    modelo: str


def _obtener_valor(db: Session, clave: str) -> str | None:
    registro = db.query(models.ConfiguracionSistema).filter(
        models.ConfiguracionSistema.clave == clave
    ).first()
    return registro.valor if registro else None


def _guardar_valor(db: Session, clave: str, valor: str | None) -> None:
    registro = db.query(models.ConfiguracionSistema).filter(
        models.ConfiguracionSistema.clave == clave
    ).first()
    if registro:
        registro.valor = valor
        return

    db.add(models.ConfiguracionSistema(clave=clave, valor=valor))


def obtener_configuracion_ia(db: Session) -> ConfiguracionIA:
    api_key = _obtener_valor(db, CLAVE_GEMINI_API_KEY) or os.getenv("GEMINI_API_KEY")
    modelo = _obtener_valor(db, CLAVE_GEMINI_MODEL) or os.getenv("GEMINI_MODEL") or MODELO_GEMINI_DEFAULT
    return ConfiguracionIA(api_key=api_key, modelo=modelo)


def guardar_configuracion_ia(
    db: Session,
    *,
    api_key: str | None = None,
    actualizar_api_key: bool = False,
    modelo: str | None = None,
) -> ConfiguracionIA:
    if modelo is not None:
        _guardar_valor(db, CLAVE_GEMINI_MODEL, modelo.strip() or MODELO_GEMINI_DEFAULT)

    if actualizar_api_key:
        _guardar_valor(db, CLAVE_GEMINI_API_KEY, api_key.strip() if api_key else None)

    db.commit()
    return obtener_configuracion_ia(db)


def preview_api_key(api_key: str | None) -> str | None:
    if not api_key:
        return None
    if len(api_key) <= 8:
        return "••••"
    return f"{api_key[:4]}••••{api_key[-4:]}"
