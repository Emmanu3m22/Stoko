"""
schemas.py — Contratos Pydantic para validación y serialización.

Organizado por recurso:
  Auth, Roles, Usuarios, Categorias, Productos,
  Ventas, CortesCaja, Incidencias, LogAuditorias
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr



# AUTH

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: int
    nombre: str
    rol: str



# ROLES


class RolBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=50)

class RolCreate(RolBase):
    pass

class RolResponse(RolBase):
    id_rol: int
    model_config = {"from_attributes": True}



# USUARIOS

class UsuarioCreate(BaseModel):
    nombre:   str       = Field(..., min_length=1, max_length=100)
    email:    EmailStr
    password: str       = Field(..., min_length=6)
    id_rol:   int

class UsuarioUpdate(BaseModel):
    nombre:   Optional[str]      = None
    email:    Optional[EmailStr] = None
    password: Optional[str]      = Field(None, min_length=6)
    id_rol:   Optional[int]      = None
    activo:   Optional[bool]     = None

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre:     str
    email:      str
    activo:     bool
    rol:        RolResponse
    model_config = {"from_attributes": True}


# CATEGORIAS

class CategoriaCreate(BaseModel):
    nombre:      str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    icono:       Optional[str] = None

class CategoriaUpdate(BaseModel):
    nombre:      Optional[str] = None
    descripcion: Optional[str] = None
    icono:       Optional[str] = None

class CategoriaResponse(BaseModel):
    id_categoria: int
    nombre:       str
    descripcion:  Optional[str] = None
    icono:        Optional[str] = None
    model_config  = {"from_attributes": True}


# PRODUCTOS

class ProductoBase(BaseModel):
    nombre:          str   = Field(..., min_length=1)
    codigo_barras:   str   = Field(..., min_length=1)
    precio_unitario: float = Field(..., gt=0)
    stock_actual:    int   = Field(0,  ge=0)
    stock_minimo:    int   = Field(5,  ge=0)
    imagen_url:      Optional[str] = None
    id_categoria:    Optional[int] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre:          Optional[str]   = None
    codigo_barras:   Optional[str]   = None
    precio_unitario: Optional[float] = Field(None, gt=0)
    stock_actual:    Optional[int]   = Field(None, ge=0)
    stock_minimo:    Optional[int]   = Field(None, ge=0)
    imagen_url:      Optional[str]   = None
    id_categoria:    Optional[int]   = None

class ProductoResponse(ProductoBase):
    id_producto: int
    categoria:   Optional[CategoriaResponse] = None
    model_config = {"from_attributes": True}

# Versión ligera para usar dentro de DetalleVenta
class ProductoResumen(BaseModel):
    id_producto:   int
    nombre:        str
    codigo_barras: str
    model_config   = {"from_attributes": True}



# DETALLE DE VENTA

class DetalleVentaCreate(BaseModel):
    id_producto: int
    cantidad:    int = Field(..., ge=1)

class DetalleVentaResponse(BaseModel):
    id_detalle:       int
    id_producto:      int
    cantidad:         int
    precio_historico: float
    subtotal:         float
    producto:         ProductoResumen
    model_config      = {"from_attributes": True}


# VENTAS

class VentaCreate(BaseModel):
    metodo_pago: str = Field("efectivo", pattern="^(efectivo|tarjeta|transferencia)$")
    id_corte:    Optional[int] = None
    items:       List[DetalleVentaCreate] = Field(..., min_length=1)

class VentaResponse(BaseModel):
    id_venta:   int
    fecha:      datetime
    subtotal:   float
    impuesto:   float
    total:      float
    metodo_pago: str
    anulada:    bool
    id_usuario: int
    id_corte:   Optional[int]
    detalles:   List[DetalleVentaResponse]
    model_config = {"from_attributes": True}

class VentaResumen(BaseModel):
    id_venta:   int
    fecha:      datetime
    total:      float
    metodo_pago: str
    anulada:    bool
    model_config = {"from_attributes": True}

class ProductoTopResumen(BaseModel):
    nombre: str
    cantidad: int
    ingreso: float

class VentaReporte(BaseModel):
    total_periodo: float
    num_transacciones: int
    por_metodo_pago: dict[str, float]
    productos_top: List[ProductoTopResumen]


# INCIDENCIAS

class IncidenciaCreate(BaseModel):
    id_producto: int
    cantidad:    int   = Field(..., description="Negativo = merma; Positivo = ajuste de entrada")
    causa:       str   = Field(..., min_length=5, max_length=255)
    id_corte:    Optional[int] = None

class IncidenciaResponse(BaseModel):
    id_incidencia: int
    fecha:         datetime
    cantidad:      int
    causa:         str
    id_producto:   int
    id_usuario:    int
    id_corte:      Optional[int]
    producto:      ProductoResumen
    model_config   = {"from_attributes": True}


# CORTES DE CAJA

class CorteApertura(BaseModel):
    pass  # Solo se necesita el usuario autenticado

class CorteCierre(BaseModel):
    efectivo_real: float = Field(..., ge=0)

class CorteResponse(BaseModel):
    id_corte:       int
    fecha_apertura: datetime
    fecha_cierre:   Optional[datetime]
    total_ventas:   float
    efectivo_real:  Optional[float]
    diferencia:     Optional[float]
    estado:         str
    id_usuario:     int
    ventas:         List[VentaResumen] = []
    incidencias:    List[IncidenciaResponse] = []
    model_config    = {"from_attributes": True}



# LOG AUDITORIAS

class AuditoriaResponse(BaseModel):
    id_auditoria: int
    fecha:        datetime
    operacion:    str
    detalles:     Optional[str]
    id_usuario:   Optional[int]
    model_config  = {"from_attributes": True}



# REPORTES / IA

class InsightsRequest(BaseModel):
    fecha_inicio: date
    fecha_fin:    date


class InsightsResponse(BaseModel):
    fecha_inicio: date
    fecha_fin:    date
    insights:     str


# CONFIGURACIÓN LOCAL

class ConfiguracionIAResponse(BaseModel):
    modelo: str
    api_key_configurada: bool
    api_key_preview: Optional[str] = None


class ConfiguracionIAUpdate(BaseModel):
    modelo: Optional[str] = Field(None, min_length=1, max_length=100)
    api_key: Optional[str] = Field(None, max_length=500)


class PruebaIAResponse(BaseModel):
    ok: bool
    modelo: str
    mensaje: str


# RESPUESTA GENÉRICA

class MensajeResponse(BaseModel):
    mensaje: str
