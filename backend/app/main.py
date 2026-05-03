"""
Stoko API — Rutas simuladas (Mock) con datos en memoria.

Esta versión usa una lista de Python como "base de datos" temporal.
El frontend React consume los mismos endpoints y JSON que usaría
con SQLite, así que cuando se conecte la BD real, React no cambia nada.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional


# --- Inicializamos la API ---
app = FastAPI(
    title="Stoko API",
    description="API para el sistema de inventarios y ventas Stoko",
    version="1.0.0",
)

# --- CORS Middleware ---
# Permite que el frontend React (Vite) consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# 1. CONTRATO DE DATOS (Pydantic)
# =====================================================
class Producto(BaseModel):
    id: int
    codigo_barras: str
    nombre: str
    categoria: str
    precio_unitario: float
    stock_actual: int


class ProductoCreate(BaseModel):
    """Para crear producto sin enviar ID (se auto-genera)."""
    codigo_barras: str
    nombre: str
    categoria: str
    precio_unitario: float
    stock_actual: int


class ProductoUpdate(BaseModel):
    """Para actualización parcial — todos los campos opcionales."""
    codigo_barras: Optional[str] = None
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    precio_unitario: Optional[float] = None
    stock_actual: Optional[int] = None


# =====================================================
# 2. "BASE DE DATOS" EN MEMORIA
# =====================================================
db_productos: List[Producto] = [
    Producto(
        id=1,
        codigo_barras="STK-0024-X",
        nombre="Reloj Cronógrafo Sovereign A",
        categoria="Relojería",
        precio_unitario=1240.0,
        stock_actual=42,
    ),
    Producto(
        id=2,
        codigo_barras="STK-0037-B",
        nombre="Pulsera Titanium Edge",
        categoria="Accesorios",
        precio_unitario=580.0,
        stock_actual=15,
    ),
    Producto(
        id=3,
        codigo_barras="STK-0051-C",
        nombre="Gafas Polarizadas Onyx",
        categoria="Óptica",
        precio_unitario=890.0,
        stock_actual=8,
    ),
]

# Contador para auto-generar IDs
_next_id = max(p.id for p in db_productos) + 1


# =====================================================
# 3. ENDPOINTS
# =====================================================

@app.get("/", tags=["Root"])
def read_root():
    """Endpoint raíz de bienvenida."""
    return {"message": "Bienvenido a Stoko API", "docs": "/docs"}


@app.get("/productos/", response_model=List[Producto], tags=["Productos"])
def obtener_productos():
    """Obtener todos los productos del inventario."""
    return db_productos


@app.get("/productos/{producto_id}", response_model=Producto, tags=["Productos"])
def obtener_producto(producto_id: int):
    """Obtener un producto por su ID."""
    for producto in db_productos:
        if producto.id == producto_id:
            return producto
    raise HTTPException(status_code=404, detail="Producto no encontrado")


@app.post("/productos/", response_model=Producto, status_code=201, tags=["Productos"])
def crear_producto(datos: ProductoCreate):
    """Crear un nuevo producto (el ID se auto-genera)."""
    global _next_id
    nuevo = Producto(id=_next_id, **datos.model_dump())
    _next_id += 1
    db_productos.append(nuevo)
    return nuevo


@app.patch("/productos/{producto_id}", response_model=Producto, tags=["Productos"])
def actualizar_producto(producto_id: int, datos: ProductoUpdate):
    """Actualizar parcialmente un producto."""
    for i, producto in enumerate(db_productos):
        if producto.id == producto_id:
            datos_actualizados = datos.model_dump(exclude_unset=True)
            producto_dict = producto.model_dump()
            producto_dict.update(datos_actualizados)
            db_productos[i] = Producto(**producto_dict)
            return db_productos[i]
    raise HTTPException(status_code=404, detail="Producto no encontrado")


@app.delete("/productos/{producto_id}", status_code=204, tags=["Productos"])
def eliminar_producto(producto_id: int):
    """Eliminar un producto del inventario."""
    for i, producto in enumerate(db_productos):
        if producto.id == producto_id:
            db_productos.pop(i)
            return
    raise HTTPException(status_code=404, detail="Producto no encontrado")
