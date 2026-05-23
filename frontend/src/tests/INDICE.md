% Índice de Pruebas - Stoko
% Documentación de pruebas de componentes e integración
% 22 de mayo de 2026

---

# 📑 Índice Completo de Pruebas

## 🎯 Tabla Rápida de Referencia

| ID | Tipo | Componente/Módulo | Estado | Archivo |
|----|------|-------------------|--------|---------|
| TC-COMP-001 | Componente | Login | ✅ Implementado | `Login.test.jsx` |
| TC-COMP-002 | Componente | HubPrincipal | ⏳ Pendiente | `HubPrincipal.test.jsx` |
| TC-COMP-003 | Componente | ListaProductos | ✅ Implementado | `ListaProductos.test.jsx` |
| TC-COMP-004 | Componente | GestionCategorias | ⏳ Pendiente | `GestionCategorias.test.jsx` |
| TC-COMP-005 | Componente | RegistroVenta | ✅ Implementado | `RegistroVenta.test.jsx` |
| TC-COMP-006 | Componente | RegistroMerma | ⏳ Pendiente | `RegistroMerma.test.jsx` |
| TC-COMP-007 | Componente | HistorialVentas | ⏳ Pendiente | `HistorialVentas.test.jsx` |
| TC-COMP-008 | Componente | Configuracion | ⏳ Pendiente | `Configuracion.test.jsx` |
| TC-COMP-009 | Componente | ReportesAuditorias | ⏳ Pendiente | `ReportesAuditorias.test.jsx` |
| TC-INT-001 | Integración | Auth (FE↔BE) | ✅ Implementado | `auth.integration.test.js` |
| TC-INT-002 | Integración | Productos (FE↔BE↔BD) | ⏳ Pendiente | `productos.integration.test.js` |
| TC-INT-003 | Integración | Ventas (FE↔BE↔BD) | ✅ Implementado | `ventas.integration.test.js` |
| TC-INT-004 | Integración | Reportes (FE↔BE↔BD) | ⏳ Pendiente | `reportes.integration.test.js` |
| TC-INT-005 | Integración | Offline (FE↔Storage↔BE) | ✅ Implementado | `offline.integration.test.js` |

---

## ✅ Pruebas Implementadas

### TC-COMP-001: Login - Renderizado y Validación
**Archivo:** `src/tests/components/Login.test.jsx`

**Objetivo:** Verificar que el componente Login se renderice correctamente y valide los campos requeridos.

**Tests incluidos:**
- ✓ Renderización de formulario completo
- ✓ Validación de email requerido
- ✓ Validación de formato de email
- ✓ Toggle de visibilidad de contraseña
- ✓ Llenado automático con credenciales demo
- ✓ Indicador de carga durante login
- ✓ Mensaje de error en autenticación fallida
- ✓ Limpieza de errores al cambiar input

**Ejecutar:** `npm test -- Login.test.jsx`

---

### TC-COMP-003: ListaProductos - Renderizado y Filtrado
**Archivo:** `src/tests/components/ListaProductos.test.jsx`

**Objetivo:** Validar que la lista de productos se renderice correctamente con datos y que los filtros funcionen.

**Tests incluidos:**
- ✓ Renderización de tabla de productos
- ✓ Mensaje vacío cuando no hay productos
- ✓ Filtrado por categoría
- ✓ Búsqueda por nombre
- ✓ Indicador visual de stock bajo
- ✓ Filtro solo stock bajo
- ✓ Botón para agregar nuevo producto
- ✓ Indicador de carga
- ✓ Edición con permisos de administrador
- ✓ Botones ocultos sin permisos

**Ejecutar:** `npm test -- ListaProductos.test.jsx`

---

### TC-COMP-005: RegistroVenta - Validación y Cálculos
**Archivo:** `src/tests/components/RegistroVenta.test.jsx`

**Objetivo:** Verificar que el componente RegistroVenta valide datos, calcule totales correctamente y maneje la presentación.

**Tests incluidos:**
- ✓ Renderización del formulario
- ✓ Agregar producto al carrito por búsqueda
- ✓ Incremento de cantidad si producto existe
- ✓ Cálculo correcto de subtotal
- ✓ Validación de cantidad vs stock
- ✓ Eliminación de productos del carrito
- ✓ Método de pago disponible
- ✓ Botón de guardar solo con productos en carrito

**Ejecutar:** `npm test -- RegistroVenta.test.jsx`

---

### TC-INT-001: Flujo de Autenticación - Frontend ↔ Backend
**Archivo:** `src/tests/integration/auth.integration.test.js`

**Objetivo:** Verificar que el flujo completo de login funcione desde frontend hasta backend.

**Tests incluidos:**
- ✓ Autenticación correcta con credenciales válidas
- ✓ Error con credenciales inválidas
- ✓ Manejo de error de conexión
- ✓ Validación de estructura JWT
- ✓ Restauración de sesión desde localStorage
- ✓ Manejo de token expirado
- ✓ Inclusión de datos del usuario

**Ejecutar:** `npm test -- auth.integration.test.js`

---

### TC-INT-003: Ciclo de Venta Completo
**Archivo:** `src/tests/integration/ventas.integration.test.js`

**Objetivo:** Verificar que el ciclo completo de venta funcione correctamente.

**Tests incluidos:**
- ✓ Ciclo de venta con cálculos correctos
- ✓ Rechazo si no hay stock suficiente
- ✓ Aplicación de descuento progresivo
- ✓ Sincronización a historial después de crear
- ✓ Consistencia si hay error en auditoría

**Validaciones de Cálculo:**
```
Ejemplo: 2 Laptops ($5000 c/u) + 5 Mouses ($200 c/u)
- Subtotal: $11,000
- Descuento 10%: -$1,100
- Subtotal con desc: $9,900
- IVA 19%: +$1,881
- Total: $11,781 ✓
```

**Ejecutar:** `npm test -- ventas.integration.test.js`

---

### TC-INT-005: Sincronización Offline
**Archivo:** `src/tests/integration/offline.integration.test.js`

**Objetivo:** Verificar que las ventas offline se sincronicen correctamente al reconectar.

**Tests incluidos:**
- ✓ Guardar venta en localStorage cuando offline
- ✓ Múltiples ventas sin duplicar
- ✓ Sincronización al reconectar
- ✓ Manejo de duplicados en sincronización
- ✓ Timestamp de sincronización en auditoría
- ✓ Persistencia entre recargues
- ✓ Limpieza después de sincronización exitosa
- ✓ Reintento en caso de fallo

**Ejecutar:** `npm test -- offline.integration.test.js`

---

## 📚 Documentación Asociada

### 1. [TEST_DOCUMENTATION.md](TEST_DOCUMENTATION.md)
Especificación detallada de todos los 14 tests (9 TC-COMP + 5 TC-INT):
- Objetivo de cada prueba
- Qué valida
- Props/Datos esperados
- Resultado esperado
- Herramientas utilizadas
- Ubicación del archivo

### 2. [README_EJECUCION.md](README_EJECUCION.md)
Guía práctica de ejecución:
- Instalación de dependencias
- Comandos de ejecución (watch, UI, CI/CD)
- Cobertura de código
- Debug de tests
- Integración con CI/CD
- Troubleshooting

### 3. [CONVENCION_PRUEBAS.md](CONVENCION_PRUEBAS.md)
Convención y restricciones:
- Tabla de prefijos (TC-UNI, TC-COMP, TC-INT, TC-FUN, TC-UIUX)
- Restricciones por tipo
- Herramientas utilizadas
- Criterios de éxito

---

## 🚀 Cómo Ejecutar

### Todos los tests
```bash
cd frontend
npm test                  # Watch mode
npm run test:run         # Una sola ejecución
```

### Tests específicos
```bash
# Por tipo
npm test -- --grep "TC-COMP"      # Solo componentes
npm test -- --grep "TC-INT"       # Solo integración

# Por ID
npm test -- --grep "TC-COMP-001"  # Solo Login

# Por archivo
npm test src/tests/components/Login.test.jsx
```

### Con cobertura
```bash
npm run test:coverage
# Abre coverage/index.html
```

### Interfaz visual
```bash
npm run test:ui
# Abre en navegador
```

---

## 📊 Estado General

### Métricas
- **Total de pruebas especificadas**: 14 (9 componentes + 5 integración)
- **Pruebas implementadas**: 6 (43%)
- **Pruebas pendientes**: 8 (57%)

### Cobertura
```
Componentes:
  Implementados: 3/9 (33%)
  - Login ✓
  - ListaProductos ✓
  - RegistroVenta ✓

Integración:
  Implementados: 3/5 (60%)
  - Auth ✓
  - Ventas ✓
  - Offline ✓
```

### Tests en Implementación
Pruebas completamente funcionales y listas para usar:
- [x] 50+ assertions en componentes
- [x] 40+ assertions en integración
- [x] Mocks de API y localStorage
- [x] Validación de cálculos matemáticos
- [x] Manejo de errores y edge cases

---

## 🔄 Próximos Pasos

### Corto Plazo (1-2 días)
1. TC-COMP-002: HubPrincipal
2. TC-COMP-004: GestionCategorias
3. TC-INT-002: Productos

### Mediano Plazo (3-5 días)
4. TC-COMP-006: RegistroMerma
5. TC-COMP-007: HistorialVentas
6. TC-INT-004: Reportes

### Largo Plazo (1 semana)
7. TC-COMP-008: Configuracion
8. TC-COMP-009: ReportesAuditorias

---

## 🛠️ Herramientas Configuradas

✅ **Vitest** - Test runner rápido
✅ **React Testing Library** - Queries y render
✅ **@testing-library/user-event** - Interacción de usuario
✅ **jsdom** - Simulador DOM
✅ **vitest.config.js** - Configuración
✅ **src/tests/setup.js** - Setup global

---

## 📞 Ayuda y Soporte

### Consultar documentación
- Detalles técnicos: [TEST_DOCUMENTATION.md](TEST_DOCUMENTATION.md)
- Ejecutar tests: [README_EJECUCION.md](README_EJECUCION.md)
- Convención: [CONVENCION_PRUEBAS.md](CONVENCION_PRUEBAS.md)

### Errores comunes
```bash
# Módulo no encontrado
npm install

# Tests colgados
npm test -- --testTimeout=10000

# Limpiar cache
npm test -- --clearCache
```

---

**Versión:** 1.0.0  
**Actualizado:** 22 de mayo de 2026  
**Rama:** tests
