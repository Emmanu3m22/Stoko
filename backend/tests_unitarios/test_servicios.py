import openpyxl

from app.services.exportacion_service import generar_excel, generar_pdf
from app.services.ia_service import IAServiceError, _mensaje_error_proveedor, generar_insights


class ErrorProveedor(Exception):
    def __init__(self, status_code, message):
        super().__init__(message)
        self.status_code = status_code


def datos_reporte():
    return {
        "periodo": {"fecha_inicio": "2026-05-21", "fecha_fin": "2026-05-21"},
        "resumen": {
            "num_ventas": 1,
            "subtotal": 100.0,
            "impuestos": 16.0,
            "total_ventas": 116.0,
        },
        "metodos_pago": [{"metodo_pago": "efectivo", "ventas": 1, "total": 116.0}],
        "productos_vendidos": [
            {"id_producto": 1, "nombre": "Producto Test", "unidades": 1, "importe": 100.0}
        ],
    }


def test_mensajes_de_error_del_proveedor_ia():
    modelo = "gemini-test"

    assert "cuota disponible" in _mensaje_error_proveedor(
        ErrorProveedor(429, "RESOURCE_EXHAUSTED quota exceeded"),
        modelo,
    )
    assert "disponible" in _mensaje_error_proveedor(
        ErrorProveedor(404, "models/gemini-old is not found"),
        modelo,
    )
    assert "GEMINI_API_KEY" in _mensaje_error_proveedor(
        ErrorProveedor(403, "API key not valid"),
        modelo,
    )
    assert "servicio de IA" in _mensaje_error_proveedor(
        ErrorProveedor(500, "upstream failed"),
        modelo,
    )


def test_generar_insights_falla_sin_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    try:
        generar_insights({}, {})
    except IAServiceError as exc:
        assert "GEMINI_API_KEY" in str(exc)
    else:
        raise AssertionError("Se esperaba IAServiceError")


def test_exportacion_pdf_y_excel_generan_archivos_validos(tmp_path):
    pdf = generar_pdf(datos_reporte())
    assert pdf.startswith(b"%PDF")

    excel = generar_excel(datos_reporte())
    archivo = tmp_path / "reporte.xlsx"
    archivo.write_bytes(excel)

    workbook = openpyxl.load_workbook(archivo)
    sheet = workbook["Reporte de Ventas"]
    assert sheet["A1"].value == "Reporte de Ventas"
    assert sheet["B6"].value == 116.0
