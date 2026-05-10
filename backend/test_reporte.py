import sys
import os
from fastapi.testclient import TestClient
from datetime import datetime, date, timedelta

# Asegurar que importamos desde el backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal, engine
from app import models
from app.core.security import hash_password

client = TestClient(app)

def setup_test_data(db):
    # Crear roles si no existen
    rol_admin = db.query(models.Rol).filter(models.Rol.nombre == "administrador").first()
    if not rol_admin:
        rol_admin = models.Rol(nombre="administrador")
        db.add(rol_admin)
        db.commit()
        db.refresh(rol_admin)

    # Crear usuario admin si no existe
    admin = db.query(models.Usuario).filter(models.Usuario.email == "admin_test@stoko.com").first()
    if not admin:
        admin = models.Usuario(
            nombre="Admin Test",
            email="admin_test@stoko.com",
            password=hash_password("password123"),
            id_rol=rol_admin.id_rol,
            activo=True
        )
        db.add(admin)
        db.commit()
    
    return "admin_test@stoko.com", "password123"

def main():
    print("Iniciando prueba de verificación...")
    db = SessionLocal()
    
    try:
        # 1. Preparar datos (usuario admin)
        email, password = setup_test_data(db)
        print(f"Usuario admin preparado: {email}")

        # 2. Login para obtener token
        login_data = {
            "username": email,
            "password": password
        }
        # FastAPI's OAuth2PasswordRequestForm uses form data (username, password)
        # However, looking at schemas.py, LoginRequest expects json {"email", "password"}
        # Let's check auth.py directly. If it uses schema.LoginRequest, we send json.
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        
        # fallback to form-data if it's using OAuth2 form
        if response.status_code == 422:
            response = client.post("/api/v1/auth/login", data={"username": email, "password": password})
            
        if response.status_code != 200:
            print("Error al hacer login:", response.json())
            return
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Token de acceso obtenido correctamente.")

        # 3. Consultar reporte
        fecha_inicio = "2020-01-01"
        fecha_fin = "2030-12-31"
        print(f"Consultando endpoint /api/v1/ventas/reporte?fecha_inicio={fecha_inicio}&fecha_fin={fecha_fin}")
        
        reporte_response = client.get(
            f"/api/v1/ventas/reporte?fecha_inicio={fecha_inicio}&fecha_fin={fecha_fin}",
            headers=headers
        )
        
        if reporte_response.status_code == 200:
            print("¡Éxito! El endpoint respondió correctamente:")
            print(reporte_response.json())
        else:
            print("Error en el endpoint:", reporte_response.status_code)
            print(reporte_response.json())
            
        # 4. Verificar auditoría
        auditorias = db.query(models.LogAuditoria).order_by(models.LogAuditoria.id_auditoria.desc()).limit(5).all()
        encontrado = False
        for aud in auditorias:
            if aud.operacion == "generar_reporte_ventas":
                encontrado = True
                print(f"Registro de auditoría encontrado: [{aud.fecha}] {aud.operacion} - {aud.detalles}")
                break
        
        if not encontrado:
            print("Advertencia: No se encontró el registro de auditoría.")

    finally:
        db.close()

if __name__ == "__main__":
    main()
