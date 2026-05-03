"""
Esquemas Pydantic para validación y serialización de datos.

Separa la lógica de validación de la capa ORM:
- ProductoBase: campos compartidos entre creación y respuesta.
- ProductoCreate: lo que se envía en un POST.
- ProductoUpdate: campos opcionales para PATCH parcial.
- ProductoResponse: lo que la API devuelve al cliente.
"""

from typing import Optional
from pydantic import BaseModel, Field


class ProductoBase(BaseModel):
    """Campos compartidos entre creación y respuesta."""
    codigo_barras: str = Field(..., min_length=1, description="Código de barras único del producto")
    nombre: str = Field(..., min_length=1, description="Nombre del producto")
    categoria: Optional[str] = Field(None, description="Categoría del producto")
    precio_unitario: float = Field(..., gt=0, description="Precio de venta unitario (debe ser > 0)")
    stock_actual: int = Field(0, ge=0, description="Stock disponible actualmente")
    stock_minimo: int = Field(5, ge=0, description="Stock mínimo antes de alerta de reabastecimiento")


class ProductoCreate(ProductoBase):
    """Esquema para crear un producto (POST). Hereda todos los campos de ProductoBase."""
    pass


class ProductoUpdate(BaseModel):
    """
    Esquema para actualización parcial (PATCH).
    Todos los campos son opcionales — solo se actualizan los que se envían.
    """
    codigo_barras: Optional[str] = Field(None, min_length=1)
    nombre: Optional[str] = Field(None, min_length=1)
    categoria: Optional[str] = None
    precio_unitario: Optional[float] = Field(None, gt=0)
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)


class ProductoResponse(ProductoBase):
    """
    Esquema de respuesta que incluye el ID generado por la base de datos.
    Configurado con from_attributes para funcionar con objetos ORM de SQLAlchemy.
    """
    id: int

    model_config = {"from_attributes": True}
