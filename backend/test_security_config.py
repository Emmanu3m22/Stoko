import os
import sys
from tempfile import TemporaryDirectory

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import obtener_secret_key


def main():
    old_secret = os.environ.pop("STOKO_SECRET_KEY", None)
    old_config_dir = os.environ.pop("STOKO_CONFIG_DIR", None)
    old_db_path = os.environ.pop("STOKO_DB_PATH", None)

    try:
        with TemporaryDirectory() as tmp:
            os.environ["STOKO_CONFIG_DIR"] = tmp

            first = obtener_secret_key()
            second = obtener_secret_key()
            assert first == second
            assert len(first) >= 64

            secret_file = os.path.join(tmp, "jwt_secret")
            assert os.path.exists(secret_file)
            assert open(secret_file, encoding="utf-8").read().strip() == first

            os.environ["STOKO_SECRET_KEY"] = "clave-definida-por-entorno"
            assert obtener_secret_key() == "clave-definida-por-entorno"

        print("Pruebas de configuración de seguridad completadas correctamente.")
    finally:
        if old_secret is not None:
            os.environ["STOKO_SECRET_KEY"] = old_secret
        else:
            os.environ.pop("STOKO_SECRET_KEY", None)

        if old_config_dir is not None:
            os.environ["STOKO_CONFIG_DIR"] = old_config_dir
        else:
            os.environ.pop("STOKO_CONFIG_DIR", None)

        if old_db_path is not None:
            os.environ["STOKO_DB_PATH"] = old_db_path
        else:
            os.environ.pop("STOKO_DB_PATH", None)


if __name__ == "__main__":
    main()
