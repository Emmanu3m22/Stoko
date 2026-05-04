"""
routers/categorias.py — CRUD de categorías de productos.

Endpoints:
  POST   /api/v1/categorias/      — Crear categoría (admin)
  GET    /api/v1/categorias/      — Listar todas
  PATCH  /api/v1/categorias/{id}  — Renombrar (admin)
  DELETE /api/v1/categorias/{id}  — Eliminar (admin)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/categorias", tags=["Categorías"])


@router.post("/", response_model=schemas.CategoriaResponse, status_code=201)
def crear_categoria(
    datos: schemas.CategoriaCreate,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    if db.query(models.Categoria).filter(models.Categoria.nombre == datos.nombre).first():
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")

    cat = models.Categoria(nombre=datos.nombre)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/", response_model=list[schemas.CategoriaResponse])
def listar_categorias(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    return db.query(models.Categoria).order_by(models.Categoria.nombre).all()


@router.patch("/{categoria_id}", response_model=schemas.CategoriaResponse)
def actualizar_categoria(
    categoria_id: int,
    datos: schemas.CategoriaUpdate,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    cat = db.query(models.Categoria).filter(models.Categoria.id_categoria == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if datos.nombre:
        cat.nombre = datos.nombre

    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{categoria_id}", response_model=schemas.MensajeResponse)
def eliminar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    _admin: models.Usuario = Depends(require_admin),
):
    cat = db.query(models.Categoria).filter(models.Categoria.id_categoria == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if cat.productos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar una categoría con productos asociados",
        )

    db.delete(cat)
    db.commit()
    return {"mensaje": f"Categoría '{cat.nombre}' eliminada"}
