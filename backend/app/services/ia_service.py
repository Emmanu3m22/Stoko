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


def generar_insights(datos_ventas: dict[str, Any], datos_mermas: dict[str, Any]) -> str:
    """
    Genera recomendaciones usando Gemini.

    Lanza IAServiceError si falta configuración, dependencia o falla el proveedor.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise IAServiceError("GEMINI_API_KEY no está configurada")

    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")
    prompt = _construir_prompt(datos_ventas, datos_mermas)

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model, contents=prompt)
        texto = getattr(response, "text", None)
    except Exception as exc:
        raise IAServiceError("El servicio de IA no respondió correctamente") from exc

    if not texto:
        raise IAServiceError("El servicio de IA no devolvió contenido")

    return texto.strip()
