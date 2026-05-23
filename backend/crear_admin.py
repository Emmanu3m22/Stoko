"""
Crear o restablecer un administrador local.

Uso:
  .venv/bin/python crear_admin.py --email admin@negocio.com --nombre "Administrador"

Opcional:
  .venv/bin/python crear_admin.py --email admin@negocio.com --password temporal123
"""

import argparse
import getpass

from app import models
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine


def asegurar_rol_admin(db):
    rol = db.query(models.Rol).filter(models.Rol.nombre == "administrador").first()
    if rol:
        return rol

    rol = models.Rol(nombre="administrador")
    db.add(rol)
    db.flush()
    return rol


def main():
    parser = argparse.ArgumentParser(description="Crear o restablecer el administrador local de Stoko.")
    parser.add_argument("--email", required=True, help="Correo del administrador.")
    parser.add_argument("--nombre", default="Administrador Stoko", help="Nombre visible del administrador.")
    parser.add_argument("--password", help="Contraseña nueva. Si se omite, se pedirá de forma interactiva.")
    args = parser.parse_args()

    password = args.password or getpass.getpass("Contraseña nueva: ")
    if len(password) < 8:
        raise SystemExit("La contraseña debe tener al menos 8 caracteres.")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        rol_admin = asegurar_rol_admin(db)
        email = args.email.strip().lower()
        usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()

        if usuario:
            usuario.nombre = args.nombre.strip() or usuario.nombre
            usuario.password = hash_password(password)
            usuario.id_rol = rol_admin.id_rol
            usuario.activo = True
            accion = "restablecido"
        else:
            usuario = models.Usuario(
                nombre=args.nombre.strip(),
                email=email,
                password=hash_password(password),
                id_rol=rol_admin.id_rol,
                activo=True,
            )
            db.add(usuario)
            accion = "creado"

        db.commit()
        print(f"Administrador {accion}: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
