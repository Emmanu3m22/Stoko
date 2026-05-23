"""
routers/configuracion.py — Configuración local de la instalación.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.deps import require_admin
from app.database import get_db
from app.services.configuracion_service import (
    guardar_configuracion_ia,
    obtener_configuracion_ia,
    preview_api_key,
)
from app.services.ia_service import IAServiceError, generar_insights

router = APIRouter(prefix="/api/v1/configuracion", tags=["Configuración"])


def _respuesta_ia(config) -> schemas.ConfiguracionIAResponse:
    return schemas.ConfiguracionIAResponse(
        modelo=config.modelo,
        api_key_configurada=bool(config.api_key),
        api_key_preview=preview_api_key(config.api_key),
    )


@router.get("/ia", response_model=schemas.ConfiguracionIAResponse)
def obtener_configuracion_ia_endpoint(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Obtiene la configuración local de IA sin exponer la API key completa."""
    return _respuesta_ia(obtener_configuracion_ia(db))


@router.put("/ia", response_model=schemas.ConfiguracionIAResponse)
def actualizar_configuracion_ia(
    datos: schemas.ConfiguracionIAUpdate,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Actualiza modelo y API key de Gemini en la instalación local."""
    updates = datos.model_dump(exclude_unset=True)
    config = guardar_configuracion_ia(
        db,
        modelo=updates.get("modelo"),
        api_key=updates.get("api_key"),
        actualizar_api_key="api_key" in updates,
    )
    return _respuesta_ia(config)


@router.post("/ia/probar", response_model=schemas.PruebaIAResponse)
def probar_configuracion_ia(
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    """Prueba la conexión con Gemini usando la configuración guardada."""
    config = obtener_configuracion_ia(db)
    if not config.api_key:
        return schemas.PruebaIAResponse(
            ok=False,
            modelo=config.modelo,
            mensaje="Configura una API key de Gemini antes de probar la conexión.",
        )

    try:
        generar_insights(
            {"resumen": {"total_ventas": 100, "num_ventas": 2}},
            {"productos_en_riesgo_stock": []},
            api_key=config.api_key,
            model=config.modelo,
        )
    except IAServiceError as exc:
        return schemas.PruebaIAResponse(ok=False, modelo=config.modelo, mensaje=str(exc))

    return schemas.PruebaIAResponse(
        ok=True,
        modelo=config.modelo,
        mensaje="Conexión con Gemini verificada correctamente.",
    )
