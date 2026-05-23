# Documentación de Pruebas - Stoko

## Convención de IDs

| Tipo de prueba | Prefijo | Ejemplo | Herramientas |
|---|---|---|---|
| Unitarias | TC-UNI | TC-UNI-001 | Python pytest |
| Componentes | TC-COMP | TC-COMP-001 | Vitest + React Testing Library |
| Integración | TC-INT | TC-INT-001 | Vitest + Mocks API |
| Funcionales | TC-FUN | TC-FUN-001 | Playwright |
| UI/UX | TC-UIUX | TC-UIUX-001 | Playwright + Visual |

---

## 9.2 Pruebas de Componentes (TC-COMP-XXX)

Validan el comportamiento de componentes individuales de la interfaz de usuario: renderizado correcto, props requeridas, estados visuales y manejo de eventos.

### TC-COMP-001: Login - Renderizado y Validación de Formulario

**Objetivo:** Verificar que el componente Login se renderice correctamente y valide los campos requeridos.

**Qué valida:**
- Renderizado de elementos del formulario (inputs, botón)
- Validación de campos vacíos
- Validación de formato de email
- Mensajes de error mostrados correctamente
- Deshabilitación del botón en estado de carga

**Props/Datos esperados:**
- Ninguno (componente sin props)

**Resultado esperado:**
- Formulario renderizado con todos los campos
- Validaciones funcionan antes de enviar
- Estados visuales cambian apropiadamente

**Herramientas:**
- Vitest (test runner)
- React Testing Library (componentes)
- @testing-library/user-event (interacción)

**Ubicación:** `src/tests/components/Login.test.jsx`

---

### TC-COMP-002: HubPrincipal - Navegación y Enlace de Componentes

**Objetivo:** Verificar que el componente HubPrincipal renderice correctamente los controles de navegación y cambie entre vistas.

**Qué valida:**
- Renderizado de botones/menús de navegación
- Cambio de vista al hacer clic
- Renderizado condicional de componentes secundarios
- Layout general funciona correctamente

**Props/Datos esperados:**
- Contexto de autenticación con usuario autenticado

**Resultado esperado:**
- Todos los botones de navegación presentes
- Clic en botones cambia la vista
- Componente activo renderiza correctamente

**Herramientas:**
- Vitest
- React Testing Library
- @testing-library/user-event

**Ubicación:** `src/tests/components/HubPrincipal.test.jsx`

---

### TC-COMP-003: ListaProductos - Renderizado y Filtrado

**Objetivo:** Validar que la lista de productos se renderice correctamente con datos y que los filtros funcionen.

**Qué valida:**
- Renderizado de lista de productos
- Aplicación correcta de filtros
- Búsqueda por nombre funciona
- Paginación (si aplica)
- Renderizado de estado vacío

**Props/Datos esperados:**
```javascript
productos: [
  { id: 1, nombre: 'Producto A', precio: 100, categoria: 'Cat1' },
  { id: 2, nombre: 'Producto B', precio: 200, categoria: 'Cat2' }
]
```

**Resultado esperado:**
- Tabla/lista con todos los productos
- Filtros funcionan correctamente
- Búsqueda reduce la lista apropiadamente

**Herramientas:**
- Vitest
- React Testing Library
- Mock de datos

**Ubicación:** `src/tests/components/ListaProductos.test.jsx`

---

### TC-COMP-004: GestionCategorias - CRUD de Categorías

**Objetivo:** Verificar que el componente GestionCategorias maneje correctamente crear, leer, actualizar y eliminar categorías.

**Qué valida:**
- Renderizado de lista de categorías
- Formulario para crear nueva categoría
- Validación de campos requeridos
- Funcionalidad de editar categoría existente
- Confirmación antes de eliminar
- Mensajes de éxito/error

**Props/Datos esperados:**
```javascript
categorias: [
  { id: 1, nombre: 'Categoría 1' },
  { id: 2, nombre: 'Categoría 2' }
]
```

**Resultado esperado:**
- Lista de categorías renderizada
- Pueden añadirse nuevas categorías
- Pueden editarse categorías
- Pueden eliminarse con confirmación

**Herramientas:**
- Vitest
- React Testing Library
- Mock de API

**Ubicación:** `src/tests/components/GestionCategorias.test.jsx`

---

### TC-COMP-005: RegistroVenta - Validación de Formulario y Cálculos

**Objetivo:** Verificar que el componente RegistroVenta valide datos, calcule totales correctamente y maneje la presentación.

**Qué valida:**
- Renderizado del formulario de venta
- Selección de productos funciona
- Cálculo de subtotal, impuesto y total
- Validación de cantidad mínima
- Validación de disponibilidad de stock
- Método de pago disponible
- Envío de datos correcto

**Props/Datos esperados:**
```javascript
productos: [
  { id: 1, nombre: 'Prod A', precio: 100, stock: 10 }
]
```

**Resultado esperado:**
- Cálculos de total son exactos
- Validaciones previenen errores
- Se pueden registrar ventas

**Herramientas:**
- Vitest
- React Testing Library
- Mock de datos y API

**Ubicación:** `src/tests/components/RegistroVenta.test.jsx`

---

### TC-COMP-006: RegistroMerma - Validación de Pérdidas de Stock

**Objetivo:** Validar que el componente RegistroMerma registre correctamente las pérdidas de mercadería.

**Qué valida:**
- Selección de producto disponible
- Validación de cantidad (no mayor que stock)
- Justificación/motivo requerida
- Cálculo de pérdida económica
- Registro se guarda correctamente

**Props/Datos esperados:**
```javascript
productos: [
  { id: 1, nombre: 'Prod A', precio: 100, stock: 50 }
]
```

**Resultado esperado:**
- No permite cantidad > stock
- Requiere justificación
- Calcula pérdida económica correctamente

**Herramientas:**
- Vitest
- React Testing Library

**Ubicación:** `src/tests/components/RegistroMerma.test.jsx`

---

### TC-COMP-007: HistorialVentas - Visualización y Filtros

**Objetivo:** Verificar que el historial de ventas muestre correctamente los registros con filtros disponibles.

**Qué valida:**
- Renderizado de tabla de ventas
- Filtro por fecha funciona
- Filtro por estado funciona
- Búsqueda por cliente/ID funciona
- Acceso a detalles de venta
- Exportación de datos disponible

**Props/Datos esperados:**
```javascript
ventas: [
  { id: 1, cliente: 'Cliente A', total: 500, fecha: '2026-01-01', estado: 'Completada' }
]
```

**Resultado esperado:**
- Todos los filtros funcionan
- Datos se muestran correctamente
- Se puede acceder a detalles

**Herramientas:**
- Vitest
- React Testing Library

**Ubicación:** `src/tests/components/HistorialVentas.test.jsx`

---

### TC-COMP-008: Configuracion - Guardado de Preferencias

**Objetivo:** Validar que el componente Configuración permita cambiar y guardar preferencias del usuario.

**Qué valida:**
- Renderizado de opciones de configuración
- Cambio de preferencias se refleja
- Guardado en persistencia funciona
- Validación de datos (ej: horarios válidos)
- Confirmación de cambios

**Props/Datos esperados:**
```javascript
config: {
  horarioApertura: '08:00',
  horarioCierre: '18:00',
  impuestoDefault: 19,
  temaOscuro: false
}
```

**Resultado esperado:**
- Cambios se guardan en localStorage/DB
- Se confirman al usuario
- Cambios persisten al recargar

**Herramientas:**
- Vitest
- React Testing Library
- Mock de localStorage/API

**Ubicación:** `src/tests/components/Configuracion.test.jsx`

---

### TC-COMP-009: ReportesAuditorias - Visualización y Generación

**Objetivo:** Verificar que el componente ReportesAuditorias genere y muestre correctamente los reportes.

**Qué valida:**
- Renderizado de opciones de reporte
- Selección de rangos de fecha funciona
- Generación de reportes dispara correctamente
- Resultados se muestran apropiadamente
- Exportación de reporte disponible
- Carga de datos durante generación

**Props/Datos esperados:**
```javascript
reportes: [
  { tipo: 'Ventas', fecha: '2026-01-01', usuario: 'admin', accion: 'Creado' }
]
```

**Resultado esperado:**
- Reportes se generan sin errores
- Datos son correctos
- Pueden exportarse

**Herramientas:**
- Vitest
- React Testing Library
- Mock de API

**Ubicación:** `src/tests/components/ReportesAuditorias.test.jsx`

---

## 9.3 Pruebas de Integración (TC-INT-XXX)

Validan la comunicación y comportamiento conjunto de distintos módulos del sistema (frontend-backend, backend-base de datos, servicios externos).

### TC-INT-001: Flujo de Autenticación - Frontend ↔ Backend

**Objetivo:** Verificar que el flujo completo de login funcione desde frontend hasta backend.

**Módulos involucrados:**
- Frontend: `Login.jsx`, `AuthContext.jsx`
- Backend: `routers/auth.py`, `core/security.py`
- Base de datos: tabla `usuarios`

**Qué valida:**
- Envío de credenciales al API
- Validación de credenciales en backend
- Generación de token JWT
- Retorno de token al frontend
- Almacenamiento de sesión en frontend
- Acceso denegado con credenciales incorrectas

**Flujo probado:**
```
Usuario escribe email/password → 
POST /api/login → 
Backend valida en DB → 
Retorna JWT → 
Frontend almacena token en localStorage/context
```

**Datos de prueba:**
```javascript
usuario: { email: "test@example.com", password: "Pass123!" }
esperado: { token: "eyJ...", usuario: { id: 1, email: "test@example.com" } }
```

**Resultado esperado:**
- Token válido retornado
- Usuario autenticado en contexto
- Redirección a dashboard

**Herramientas:**
- Vitest
- Mock de fetch API
- Datos de prueba en DB

**Ubicación:** `src/tests/integration/auth.integration.test.jsx`

---

### TC-INT-002: Registro y Persistencia de Productos - Frontend ↔ Backend ↔ BD

**Objetivo:** Verificar que los productos se registren correctamente desde el frontend, se validen en backend y se persistan en la BD.

**Módulos involucrados:**
- Frontend: `RegistroVenta.jsx`, `ListaProductos.jsx`
- Backend: `routers/productos.py`, `services/`
- Base de datos: tabla `productos`

**Qué valida:**
- Envío de datos de producto desde formulario
- Validación de campos en backend
- Almacenamiento en base de datos
- Disponibilidad inmediata en listado
- Cálculos de stock se actualizan
- Manejo de errores de validación

**Flujo probado:**
```
Frontend registra producto → 
POST /api/productos → 
Backend valida y crea en DB → 
GET /api/productos retorna producto nuevo
```

**Datos de prueba:**
```javascript
producto: {
  nombre: "Producto Test",
  precio: 100,
  stock: 50,
  categoria: 1
}
```

**Resultado esperado:**
- Producto creado en DB
- Disponible en listado inmediatamente
- Stock correcto

**Herramientas:**
- Vitest
- Mock de API
- Base de datos de prueba

**Ubicación:** `src/tests/integration/productos.integration.test.js`

---

### TC-INT-003: Ciclo de Venta Completo - Todos los Módulos

**Objetivo:** Verificar que el ciclo completo de venta (crear, aplicar descuento, calcular impuesto, registrar) funcione correctamente.

**Módulos involucrados:**
- Frontend: `RegistroVenta.jsx`, `HistorialVentas.jsx`
- Backend: `routers/ventas.py`, `services/`
- Base de datos: tablas `ventas`, `productos`, `auditoria`

**Qué valida:**
- Selección de productos actualiza stock
- Cálculos de subtotal, descuento, impuesto, total son correctos
- Registro de venta en DB
- Actualización de stock en DB
- Registro en auditoría
- Disponibilidad en historial de ventas
- Validación de disponibilidad de stock

**Flujo probado:**
```
Selecciona Prod A (qty: 2) → Calcula total → 
Aplica descuento 10% → Calcula impuesto 19% → 
POST /api/ventas → Backend valida stock → 
Crea en DB, actualiza stock, registra auditoría → 
GET /api/ventas retorna nueva venta
```

**Datos de prueba:**
```javascript
venta: {
  items: [
    { productoId: 1, cantidad: 2, precioUnitario: 100 }
  ],
  descuento: 10,
  metodoPago: "efectivo"
}
// Esperado: total = (200 - 20) * 1.19 = 214.20
```

**Resultado esperado:**
- Cálculos exactos
- Stock se decrementa
- Venta aparece en historial
- Auditoría registra operación

**Herramientas:**
- Vitest
- Mock de API
- Base de datos de prueba
- Validaciones matemáticas

**Ubicación:** `src/tests/integration/ventas.integration.test.js`

---

### TC-INT-004: Filtrado y Reporte de Datos - Backend ↔ BD

**Objetivo:** Verificar que los filtros de reportes funcionen correctamente y retornen datos válidos.

**Módulos involucrados:**
- Frontend: `HistorialVentas.jsx`, `ReportesAuditorias.jsx`
- Backend: `routers/reportes.py`, `services/`
- Base de datos: tablas `ventas`, `auditoria`

**Qué valida:**
- Filtro por rango de fechas funciona
- Filtro por usuario/vendedor funciona
- Filtro por estado de venta funciona
- Búsqueda por texto funciona
- Paginación funciona
- Totales calculados correctamente
- Exportación de datos (CSV/Excel)

**Flujo probado:**
```
Frontend: selecciona fechas: 01-01-2026 al 31-01-2026, usuario: "admin" → 
GET /api/reportes?fecha_inicio=2026-01-01&fecha_fin=2026-01-31&usuario=admin →
Backend consulta DB con filtros → 
Retorna ventas filtradas + totales
```

**Datos de prueba:**
```javascript
filtros: {
  fechaInicio: "2026-01-01",
  fechaFin: "2026-01-31",
  usuario: "admin",
  estado: "completada"
}
// Esperado: array de ventas que cumplen criterios
```

**Resultado esperado:**
- Filtros retornan datos correctos
- Totales son exactos
- Paginación funciona
- Exportación genera archivo válido

**Herramientas:**
- Vitest
- Mock de API
- Validación de datos
- Base de datos de prueba

**Ubicación:** `src/tests/integration/reportes.integration.test.js`

---

### TC-INT-005: Sincronización Offline - Frontend

**Objetivo:** Verificar que las ventas registradas offline se sincronicen correctamente cuando se recupera la conexión.

**Módulos involucrados:**
- Frontend: `RegistroVenta.jsx`, `ventasOffline.js`
- LocalStorage: almacenamiento temporal
- Backend: `routers/ventas.py`
- Base de datos: tabla `ventas`

**Qué valida:**
- Venta se guarda en localStorage cuando offline
- Indicador visual muestra estado offline
- Al reconectar, ventas offline se sincroniza
- Conflictos se manejan correctamente
- Registro en auditoría incluye timestamp de sincronización
- No hay duplicados

**Flujo probado:**
```
Modo offline: Usuario registra venta → Se guarda en localStorage → 
Usuario reconecta a internet →
Detección de conexión → 
POST /api/ventas (ventas offline) →
Backend valida, crea en DB →
Frontend limpia localStorage de ventas sincronizadas
```

**Datos de prueba:**
```javascript
ventaOffline: {
  items: [{ productoId: 1, cantidad: 1, precio: 100 }],
  total: 119,
  timestamp: 1234567890,
  estado: "pendiente_sync"
}
```

**Resultado esperado:**
- Venta se sincroniza sin errores
- Stock se actualiza correctamente
- No hay duplicados
- Auditoría registra sincronización

**Herramientas:**
- Vitest
- Mock de localStorage
- Mock de fetch/conexión
- Validación de transacciones

**Ubicación:** `src/tests/integration/offline.integration.test.js`

---

## Ejecución de Pruebas

### Pruebas de Componentes (Frontend)
```bash
cd frontend
npm test                    # Ejecutar todos los tests
npm run test:ui            # Ejecutar con interfaz Vitest
npm test -- --coverage     # Ver cobertura de código
```

### Pruebas de Integración (Backend)
```bash
cd backend
pytest tests_unitarios/    # Ejecutar tests existentes
pytest --cov               # Con cobertura
```

### Pruebas Funcionales (E2E)
```bash
cd tests
npm test                   # Ejecutar Playwright
npm run test:ui            # Con interfaz
```

---

## Criterios de Aceptación

✅ **Todos los tests pasan**
✅ **Cobertura mínima 80% en componentes críticos**
✅ **Documentación actualizada**
✅ **Sin errores en consola**
✅ **Tiempos de ejecución < 30 segundos**
