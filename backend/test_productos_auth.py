import os
import sys

from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app


client = TestClient(app)


def main():
    public_get = client.get("/productos/")
    assert public_get.status_code == 404, public_get.text

    public_post = client.post("/productos/", json={})
    assert public_post.status_code == 404, public_post.text

    public_delete = client.delete("/productos/1")
    assert public_delete.status_code == 404, public_delete.text

    protected_get = client.get("/api/v1/productos/")
    assert protected_get.status_code == 401, protected_get.text

    protected_post = client.post("/api/v1/productos/", json={})
    assert protected_post.status_code == 401, protected_post.text

    print("Pruebas de productos autenticados completadas correctamente.")


if __name__ == "__main__":
    main()
