"""
models.py — Modelos ORM SQLAlchemy para Stoko.

Define TODAS las tablas del sistema en 3FN:
  - Roles, Usuarios
  - Categorias, Productos
  - Ventas, DetalleVenta
  - CortesCaja, Incidencias, LogAuditorias
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
import enum

from app.database import Base



# ENUMERACIONES

class MetodoPagoEnum(str, enum.Enum):
    efectivo    = "efectivo"
    tarjeta     = "tarjeta"
    transferencia = "transferencia"

class EstadoCorteEnum(str, enum.Enum):
    abierto = "abierto"
    cerrado = "cerrado"

class TipoOperacionEnum(str, enum.Enum):
    login           = "login"
    logout          = "logout"
    crear_producto  = "crear_producto"
    editar_producto = "editar_producto"
    eliminar_producto = "eliminar_producto"
    registrar_venta = "registrar_venta"
    anular_venta    = "anular_venta"
    abrir_corte     = "abrir_corte"
    cerrar_corte    = "cerrar_corte"
    registrar_incidencia = "registrar_incidencia"



# ROLES

class Rol(Base):
    """
    Tabla de roles del sistema (RBAC).
    Roles posibles: 'administrador', 'cajero'.
    """
    __tablename__ = "roles"

    id_rol  = Column(Integer, primary_key=True, index=True)
    nombre  = Column(String(50), unique=True, nullable=False)

    # Relaciones
    usuarios = relationship("Usuario", back_populates="rol")

    def __repr__(self):
        return f"<Rol(id={self.id_rol}, nombre='{self.nombre}')>"



# USUARIOS

class Usuario(Base):
    """
    Tabla de usuarios del sistema.
    El password se almacena como hash bcrypt (NUNCA en texto plano).
    """
    __tablename__ = "usuarios"

    id_usuario  = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False)
    email       = Column(String(150), unique=True, nullable=False, index=True)
    password    = Column(String(255), nullable=False)   # Hash bcrypt
    activo      = Column(Boolean, default=True)
    id_rol      = Column(Integer, ForeignKey("roles.id_rol"), nullable=False)

    # Relaciones
    rol             = relationship("Rol", back_populates="usuarios")
    ventas          = relationship("Venta", back_populates="usuario")
    cortes          = relationship("CorteCaja", back_populates="usuario")
    incidencias     = relationship("Incidencia", back_populates="usuario")
    auditorias      = relationship("LogAuditoria", back_populates="usuario")

    def __repr__(self):
        return f"<Usuario(id={self.id_usuario}, email='{self.email}')>"



# CATEGORÍAS

class Categoria(Base):
    """Clasificación jerárquica de productos."""
    __tablename__ = "categorias"

    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String(100), unique=True, nullable=False)
    descripcion  = Column(Text, nullable=True)
    icono        = Column(String(50), nullable=True)  # Nombre del ícono o emoji

    # Relaciones
    productos = relationship("Producto", back_populates="categoria")

    def __repr__(self):
        return f"<Categoria(id={self.id_categoria}, nombre='{self.nombre}')>"



# PRODUCTOS

class Producto(Base):
    """
    Catálogo de productos del inventario.
    El campo precio_historico se copia a DetalleVenta al momento de la venta
    para conservar el precio exacto aunque luego cambie.
    """
    __tablename__ = "productos"

    id_producto     = Column(Integer, primary_key=True, index=True)
    nombre          = Column(String(200), nullable=False, index=True)
    codigo_barras   = Column(String(100), unique=True, nullable=False, index=True)
    precio_unitario = Column(Float, nullable=False)
    stock_actual    = Column(Integer, default=0, nullable=False)
    stock_minimo    = Column(Integer, default=5, nullable=False)
    imagen_url      = Column(Text, nullable=True)
    id_categoria    = Column(Integer, ForeignKey("categorias.id_categoria"), nullable=True)

    # Relaciones
    categoria       = relationship("Categoria", back_populates="productos")
    detalles_venta  = relationship("DetalleVenta", back_populates="producto")
    incidencias     = relationship("Incidencia", back_populates="producto")

    def __repr__(self):
        return f"<Producto(id={self.id_producto}, nombre='{self.nombre}', stock={self.stock_actual})>"



# CORTES DE CAJA

class CorteCaja(Base):
    """
    Turno de caja. Todas las ventas deben asociarse a un corte activo.
    Al cerrar el corte se calcula la diferencia entre el total_ventas
    calculado y el efectivo_real contado por el cajero.
    """
    __tablename__ = "cortes_caja"

    id_corte        = Column(Integer, primary_key=True, index=True)
    fecha_apertura  = Column(DateTime, default=datetime.utcnow, nullable=False)
    fecha_cierre    = Column(DateTime, nullable=True)
    total_ventas    = Column(Float, default=0.0)
    efectivo_real   = Column(Float, nullable=True)
    diferencia      = Column(Float, nullable=True)
    estado          = Column(String(20), default="abierto")   # 'abierto' | 'cerrado'
    id_usuario      = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)

    # Relaciones
    usuario     = relationship("Usuario", back_populates="cortes")
    ventas      = relationship("Venta", back_populates="corte")
    incidencias = relationship("Incidencia", back_populates="corte")

    def __repr__(self):
        return f"<CorteCaja(id={self.id_corte}, estado='{self.estado}')>"


# VENTAS

class Venta(Base):
    """
    Cabecera de cada transacción de venta.
    Los items se almacenan en DetalleVenta con precio_historico.
    """
    __tablename__ = "ventas"

    id_venta        = Column(Integer, primary_key=True, index=True)
    fecha           = Column(DateTime, default=datetime.utcnow, nullable=False)
    subtotal        = Column(Float, nullable=False, default=0.0)
    impuesto        = Column(Float, nullable=False, default=0.0)
    total           = Column(Float, nullable=False, default=0.0)
    metodo_pago     = Column(String(50), default="efectivo")
    anulada         = Column(Boolean, default=False)
    id_usuario      = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_corte        = Column(Integer, ForeignKey("cortes_caja.id_corte"), nullable=True)

    # Relaciones
    usuario     = relationship("Usuario", back_populates="ventas")
    corte       = relationship("CorteCaja", back_populates="ventas")
    detalles    = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Venta(id={self.id_venta}, total={self.total}, anulada={self.anulada})>"



# DETALLE DE VENTA
class DetalleVenta(Base):
    """
    Línea de producto dentro de una venta.
    precio_historico preserva el precio al momento de la venta,
    independientemente de cambios futuros al producto.
    """
    __tablename__ = "detalle_venta"

    id_detalle          = Column(Integer, primary_key=True, index=True)
    id_venta            = Column(Integer, ForeignKey("ventas.id_venta"), nullable=False)
    id_producto         = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    cantidad            = Column(Integer, nullable=False)
    precio_historico    = Column(Float, nullable=False)   # Precio al momento de la venta
    subtotal            = Column(Float, nullable=False)   # cantidad × precio_historico

    # Relaciones
    venta    = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_venta")

    def __repr__(self):
        return f"<DetalleVenta(id={self.id_detalle}, producto={self.id_producto}, qty={self.cantidad})>"



# INCIDENCIAS DE INVENTARIO

class Incidencia(Base):
    """
    Registro de ajustes manuales de stock (merma, daño, caducidad, etc.).
    Vinculada al usuario que la registra y al corte activo.
    """
    __tablename__ = "incidencias"

    id_incidencia   = Column(Integer, primary_key=True, index=True)
    fecha           = Column(DateTime, default=datetime.utcnow, nullable=False)
    cantidad        = Column(Integer, nullable=False)          # Negativo = merma; Positivo = ajuste
    causa           = Column(String(255), nullable=False)
    id_producto     = Column(Integer, ForeignKey("productos.id_producto"), nullable=False)
    id_usuario      = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_corte        = Column(Integer, ForeignKey("cortes_caja.id_corte"), nullable=True)

    # Relaciones
    producto = relationship("Producto", back_populates="incidencias")
    usuario  = relationship("Usuario", back_populates="incidencias")
    corte    = relationship("CorteCaja", back_populates="incidencias")

    def __repr__(self):
        return f"<Incidencia(id={self.id_incidencia}, producto={self.id_producto}, qty={self.cantidad})>"



# LOG DE AUDITORÍAS

class LogAuditoria(Base):
    """
    Registro inmutable de todas las operaciones críticas del sistema.
    Solo se puede crear (INSERT), nunca editar ni eliminar.
    """
    __tablename__ = "log_auditorias"

    id_auditoria    = Column(Integer, primary_key=True, index=True)
    fecha           = Column(DateTime, default=datetime.utcnow, nullable=False)
    operacion       = Column(String(50), nullable=False)
    detalles        = Column(Text, nullable=True)
    id_usuario      = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="auditorias")

    def __repr__(self):
        return f"<LogAuditoria(id={self.id_auditoria}, op='{self.operacion}')>"


# CONFIGURACIÓN LOCAL

class ConfiguracionSistema(Base):
    """
    Configuración local de la instalación.
    Pensada para datos de la app de escritorio, como proveedor/modelo de IA.
    """
    __tablename__ = "configuracion_sistema"

    clave = Column(String(100), primary_key=True, index=True)
    valor = Column(Text, nullable=True)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ConfiguracionSistema(clave='{self.clave}')>"
