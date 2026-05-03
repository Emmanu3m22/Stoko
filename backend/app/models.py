"""
Modelos ORM de SQLAlchemy para Stoko.

Define las tablas de la base de datos. El modelo Producto es el corazón
del sistema de inventario y punto de venta.
"""

from sqlalchemy import Column, Integer, String, Float

from app.database import Base


class Producto(Base):
    """
    Modelo de Producto para el inventario.

    Attributes:
        id: Identificador único auto-incremental.
        codigo_barras: Código de barras único para escaneo rápido.
        nombre: Nombre del producto.
        categoria: Categoría para organización (ej: "Bebidas", "Snacks").
        precio_unitario: Precio de venta al público.
        stock_actual: Cantidad disponible en inventario.
        stock_minimo: Umbral para alertas de reabastecimiento.
    """
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_barras = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, index=True, nullable=False)
    categoria = Column(String, nullable=True)
    precio_unitario = Column(Float, nullable=False)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=5)

    def __repr__(self):
        return f"<Producto(id={self.id}, nombre='{self.nombre}', stock={self.stock_actual})>"
