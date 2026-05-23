import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import construir_database_url


def main():
    with TemporaryDirectory() as tmp:
        db_path = Path(tmp) / "datos" / "stoko.db"
        url = construir_database_url(db_path=str(db_path))
        assert url == f"sqlite:///{db_path}"
        assert db_path.parent.exists()

        sqlite_url_path = Path(tmp) / "otra" / "stoko.db"
        sqlite_url = f"sqlite:///{sqlite_url_path}"
        assert construir_database_url(database_url=sqlite_url) == sqlite_url
        assert sqlite_url_path.parent.exists()

        postgres_url = "postgresql://usuario:password@localhost/stoko"
        assert construir_database_url(database_url=postgres_url) == postgres_url

    print("Pruebas de configuración de base de datos completadas correctamente.")


if __name__ == "__main__":
    main()
