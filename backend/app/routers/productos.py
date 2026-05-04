"""
routers/productos.py — CRUD completo del catálogo de productos.

Endpoints:
  POST   /api/v1/productos/                      — Crear producto (admin)
  GET    /api/v1/productos/                      — Listar productos (paginación + búsqueda)
  GET    /api/v1/productos/{id}                  — Obtener por ID
  GET    /api/v1/productos/codigo/{codigo}       — Buscar por código de barras
  PATCH  /api/v1/productos/{id}                  — Actualizar parcialmente (admin)
  DELETE /api/v1/productos/{id}                  — Eliminar (admin)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.core.deps import get_current_user, require_admin
from app.services import auditoria_service

router = APIRouter(prefix="/api/v1/productos", tags=["Productos"])


@router.post("/", response_model=schemas.ProductoResponse, status_code=201)
def crear_producto(
    datos: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin),
):
    """Crear un nuevo producto. Solo administradores."""
    if db.query(models.Producto).filter(
        models.Producto.codigo_barras == datos.codigo_barras
    ).first():
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un producto con el código '{datos.codigo_barras}'",
        )

    producto = models.Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)

    auditoria_service.registrar(
        db,
        operacion="crear_producto",
        detalles=f"Producto creado: {producto.nombre} (ID {producto.id_producto})",
        id_usuario=current_user.id_usuario,
    )
    return producto


@router.get("/", response_model=list[schemas.ProductoResponse])
def listar_productos(
    skip:      int = Query(0,   ge=0),
    limit:     int = Query(100, ge=1, le=1000),
    busqueda:  str = Query("",  description="Filtrar por nombre o código de barras"),
    categoria: int = Query(None, description="Filtrar por id_categoria"),
    stock_bajo: bool = Query(False, description="Solo productos con stock <= stock_minimo"),
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Listar productos con filtros opcionales y paginación."""
    q = db.query(models.Producto)

    if busqueda:
        like = f"%{busqueda}%"
        q = q.filter(
            (models.Producto.nombre.ilike(like)) |
            (models.Producto.codigo_barras.ilike(like))
        )
    if categoria:
        q = q.filter(models.Producto.id_categoria == categoria)
    if stock_bajo:
        q = q.filter(models.Producto.stock_actual <= models.Producto.stock_minimo)

    return q.order_by(models.Producto.nombre).offset(skip).limit(limit).all()


@router.get("/codigo/{codigo_barras}", response_model=schemas.ProductoResponse)
def buscar_por_codigo(
    codigo_barras: str,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Buscar producto por código de barras (útil para escaneo en POS)."""
    producto = db.query(models.Producto).filter(
        models.Producto.codigo_barras == codigo_barras
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/{producto_id}", response_model=schemas.ProductoResponse)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(get_current_user),
):
    """Obtener un producto por su ID."""
    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == producto_id
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.patch("/{producto_id}", response_model=schemas.ProductoResponse)
def actualizar_producto(
    producto_id: int,
    datos: schemas.ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin),
):
    """Actualizar parcialmente un producto. Solo administradores."""
    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == producto_id
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    updates = datos.model_dump(exclude_unset=True)

    # Si se cambia el código de barras, verificar unicidad
    if "codigo_barras" in updates:
        dup = db.query(models.Producto).filter(
            models.Producto.codigo_barras == updates["codigo_barras"],
            models.Producto.id_producto  != producto_id,
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Ese código de barras ya pertenece a otro producto")

    for campo, valor in updates.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)

    auditoria_service.registrar(
        db,
        operacion="editar_producto",
        detalles=f"Producto actualizado: {producto.nombre} (ID {producto_id}) — campos: {list(updates.keys())}",
        id_usuario=current_user.id_usuario,
    )
    return producto


@router.delete("/{producto_id}", response_model=schemas.MensajeResponse)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(require_admin),
):
    """Eliminar un producto. Solo administradores."""
    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == producto_id
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    nombre = producto.nombre
    db.delete(producto)
    db.commit()

    auditoria_service.registrar(
        db,
        operacion="eliminar_producto",
        detalles=f"Producto eliminado: {nombre} (ID {producto_id})",
        id_usuario=current_user.id_usuario,
    )
    return {"mensaje": f"Producto '{nombre}' eliminado"}
