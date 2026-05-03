"""
Router CRUD para el recurso Producto.

Endpoints:
    POST   /api/v1/productos/                     — Crear producto
    GET    /api/v1/productos/                      — Listar productos (paginación)
    GET    /api/v1/productos/{producto_id}          — Obtener por ID
    GET    /api/v1/productos/codigo/{codigo_barras} — Buscar por código de barras
    PATCH  /api/v1/productos/{producto_id}          — Actualizar parcialmente
    DELETE /api/v1/productos/{producto_id}          — Eliminar producto
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Producto
from app.schemas import ProductoCreate, ProductoUpdate, ProductoResponse

router = APIRouter(
    prefix="/api/v1/productos",
    tags=["Productos"],
)


@router.post("/", response_model=ProductoResponse, status_code=201)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo producto en el inventario."""
    # Verificar que el código de barras no exista ya
    existente = db.query(Producto).filter(
        Producto.codigo_barras == producto.codigo_barras
    ).first()
    if existente:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un producto con el código de barras '{producto.codigo_barras}'",
        )

    db_producto = Producto(**producto.model_dump())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(
    skip: int = Query(0, ge=0, description="Registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Máximo de registros a devolver"),
    db: Session = Depends(get_db),
):
    """Listar todos los productos con paginación."""
    productos = db.query(Producto).offset(skip).limit(limit).all()
    return productos


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    """Obtener un producto por su ID."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/codigo/{codigo_barras}", response_model=ProductoResponse)
def buscar_por_codigo(codigo_barras: str, db: Session = Depends(get_db)):
    """Buscar un producto por su código de barras."""
    producto = db.query(Producto).filter(
        Producto.codigo_barras == codigo_barras
    ).first()
    if not producto:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró producto con código de barras '{codigo_barras}'",
        )
    return producto


@router.patch("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
):
    """Actualizar parcialmente un producto. Solo se modifican los campos enviados."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Solo actualizar los campos que se enviaron (no None)
    datos_actualizados = datos.model_dump(exclude_unset=True)

    # Si se cambia el código de barras, verificar que no exista ya
    if "codigo_barras" in datos_actualizados:
        existente = db.query(Producto).filter(
            Producto.codigo_barras == datos_actualizados["codigo_barras"],
            Producto.id != producto_id,
        ).first()
        if existente:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe otro producto con el código de barras '{datos_actualizados['codigo_barras']}'",
            )

    for campo, valor in datos_actualizados.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    """Eliminar un producto del inventario."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(producto)
    db.commit()
    return None
