import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ia_service import _mensaje_error_proveedor


class ErrorGemini(Exception):
    def __init__(self, status_code, message):
        super().__init__(message)
        self.status_code = status_code


def main():
    modelo = "gemini-2.0-flash-lite"

    cuota = _mensaje_error_proveedor(
        ErrorGemini(429, "RESOURCE_EXHAUSTED quota exceeded"),
        modelo,
    )
    assert "cuota disponible" in cuota
    assert modelo in cuota

    modelo_invalido = _mensaje_error_proveedor(
        ErrorGemini(404, "models/gemini-1.5-flash is not found"),
        "gemini-1.5-flash",
    )
    assert "no está disponible" in modelo_invalido

    permisos = _mensaje_error_proveedor(
        ErrorGemini(403, "API key not valid"),
        modelo,
    )
    assert "GEMINI_API_KEY" in permisos

    desconocido = _mensaje_error_proveedor(ErrorGemini(500, "upstream failed"), modelo)
    assert desconocido == "El servicio de IA no respondió correctamente"

    print("Pruebas de mensajes de IA completadas correctamente.")


if __name__ == "__main__":
    main()
