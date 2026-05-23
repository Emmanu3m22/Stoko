"""
ia_service.py — Servicio de generación de insights con modelo de lenguaje.

Usa Google Gemini vía la dependencia `google-genai`. La API key se lee desde
GEMINI_API_KEY y el modelo puede configurarse con GEMINI_MODEL.
"""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class IAServiceError(RuntimeError):
    """Error controlado al comunicarse con el proveedor de IA."""


def _mensaje_error_proveedor(exc: Exception, model: str) -> str:
    """Convierte errores del SDK de Gemini en mensajes útiles para soporte."""
    status_code = getattr(exc, "status_code", None)
    texto = str(exc)
    texto_lower = texto.lower()

    if status_code == 429 or "resource_exhausted" in texto_lower or "quota" in texto_lower:
        return (
            f"Gemini no tiene cuota disponible para el modelo {model}. "
            "Revisa la cuota, facturación o espera a que se restablezca el límite."
        )

    if status_code == 404 or "not_found" in texto_lower or "is not found" in texto_lower:
        return (
            f"El modelo de Gemini {model} no está disponible para esta API key. "
            "Configura GEMINI_MODEL con un modelo disponible."
        )

    if status_code in {400, 401, 403} or "api key" in texto_lower or "permission" in texto_lower:
        return "Gemini rechazó la solicitud. Verifica que GEMINI_API_KEY sea válida y tenga permisos."

    return "El servicio de IA no respondió correctamente"


def _construir_prompt(datos_ventas: dict[str, Any], datos_mermas: dict[str, Any]) -> str:
    return f"""
Eres un analista de operaciones para un sistema POS e inventario llamado STOKO.
Genera recomendaciones estratégicas en español, concretas y accionables.

Analiza estos datos reales del periodo:

Ventas:
{datos_ventas}

Mermas e inventario:
{datos_mermas}

Responde con:
1. Hallazgos principales.
2. Riesgos de inventario o rotura de stock.
3. Productos con baja rotación o desempeño destacado.
4. Recomendaciones operativas priorizadas.

Evita mencionar que eres un modelo de IA. No inventes cifras fuera de los datos.
""".strip()


def generar_insights(
    datos_ventas: dict[str, Any],
    datos_mermas: dict[str, Any],
    *,
    api_key: str | None = None,
    model: str | None = None,
) -> str:
    """
    Genera recomendaciones usando Gemini.

    Lanza IAServiceError si falta configuración, dependencia o falla el proveedor.
    """
    api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise IAServiceError("GEMINI_API_KEY no está configurada")

    model = model or os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    prompt = _construir_prompt(datos_ventas, datos_mermas)

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model, contents=prompt)
        texto = getattr(response, "text", None)
    except Exception as exc:
        raise IAServiceError(_mensaje_error_proveedor(exc, model)) from exc

    if not texto:
        raise IAServiceError("El servicio de IA no devolvió contenido")

    return texto.strip()
