from datetime import timedelta

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.services.ia_service import _mensaje_error_proveedor


class ProviderError(Exception):
    def __init__(self, status_code, message):
        super().__init__(message)
        self.status_code = status_code


def test_tc_uni_001_hash_password_retorna_hash_bcrypt_distinto_al_texto_plano():
    hashed = hash_password("admin1234")

    assert isinstance(hashed, str)
    assert hashed != "admin1234"
    assert hashed.startswith("$2")


def test_tc_uni_002_verify_password_retorna_true_si_coincide():
    hashed = hash_password("admin1234")

    assert verify_password("admin1234", hashed) is True


def test_tc_uni_003_verify_password_retorna_false_si_no_coincide():
    hashed = hash_password("admin1234")

    assert verify_password("wrongpass", hashed) is False


def test_tc_uni_004_create_access_token_retorna_jwt_con_tres_segmentos():
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(minutes=5))

    assert isinstance(token, str)
    assert len(token.split(".")) == 3


def test_tc_uni_005_decode_access_token_retorna_payload_con_sub():
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(minutes=5))

    payload = decode_access_token(token)

    assert payload["sub"] == "1"


def test_tc_uni_006_decode_access_token_retorna_none_con_firma_invalida():
    assert decode_access_token("token.invalido.xyz") is None


def test_tc_uni_007_mensaje_error_ia_por_cuota_incluye_modelo():
    mensaje = _mensaje_error_proveedor(
        ProviderError(429, "quota exceeded"),
        "gemini-2.0-flash-lite",
    )

    assert "cuota disponible" in mensaje
    assert "gemini-2.0-flash-lite" in mensaje


def test_tc_uni_008_mensaje_error_ia_modelo_no_disponible():
    mensaje = _mensaje_error_proveedor(
        ProviderError(404, "is not found"),
        "gemini-1.5-flash",
    )

    assert "no esta disponible" in mensaje.lower() or "no está disponible" in mensaje.lower()


def test_tc_uni_009_mensaje_error_ia_api_key_invalida():
    mensaje = _mensaje_error_proveedor(
        ProviderError(403, "API key not valid"),
        "gemini-2.0-flash-lite",
    )

    assert "GEMINI_API_KEY" in mensaje


def test_tc_uni_010_mensaje_error_ia_generico():
    mensaje = _mensaje_error_proveedor(
        ProviderError(500, "upstream failed"),
        "gemini-2.0-flash-lite",
    )

    assert mensaje == "El servicio de IA no respondió correctamente"
