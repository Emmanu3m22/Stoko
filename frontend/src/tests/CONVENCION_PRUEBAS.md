# Convención de Pruebas y Restricciones - Stoko

## 📋 Convención de IDs de Pruebas

```
┌─────────────────┬──────────────┬──────────────┬────────────────────┐
│  Tipo de Prueba │    Prefijo   │   Ejemplo    │   Herramientas     │
├─────────────────┼──────────────┼──────────────┼────────────────────┤
│  Unitarias      │   TC-UNI     │ TC-UNI-001   │ Python pytest      │
│  Componentes    │   TC-COMP    │ TC-COMP-001  │ Vitest + RTL       │
│  Integración    │   TC-INT     │ TC-INT-001   │ Vitest + Mock API  │
│  Funcionales    │   TC-FUN     │ TC-FUN-001   │ Playwright         │
│  UI/UX          │   TC-UIUX    │ TC-UIUX-001  │ Playwright + Visual│
└─────────────────┴──────────────┴──────────────┴────────────────────┘
```

---

## 🎯 Restricciones por Tipo de Prueba

### TC-COMP (Pruebas de Componentes)

**Objetivo:** Validan el comportamiento de componentes individuales de la interfaz de usuario.

**Qué Valida:**
- ✅ Renderizado correcto de elementos
- ✅ Props requeridas y opcionales
- ✅ Estados visuales (normal, cargando, error, etc.)
- ✅ Manejo de eventos (click, input, submit)
- ✅ Validación de formularios
- ✅ Accesibilidad (labels, roles ARIA)
- ✅ Mensajes de error y confirmación

**Restricciones:**
- Solo prueban componentes en aislamiento
- No prueban la comunicación con API real
- Usan mocks para dependencias externas
- Máximo 50 assertions por test
- Tiempo de ejecución < 2 segundos por test

**Herramientas:**
- **Vitest**: Test runner
- **React Testing Library**: Renderizado y queries
- **@testing-library/user-event**: Interacción de usuario
- **jsdom**: Simulador DOM

**Formato de Archivo:**
```
src/tests/components/[NombreComponente].test.jsx
```

**Ejemplo de Nombre:**
- `TC-COMP-001: Login - Renderizado y Validación de Formulario`

---

### TC-INT (Pruebas de Integración)

**Objetivo:** Validan la comunicación y comportamiento conjunto de módulos del sistema.

**Qué Valida:**
- ✅ Frontend ↔ Backend: Flujos API
- ✅ Backend ↔ Base de datos: Persistencia
- ✅ Transacciones y consistencia de datos
- ✅ Manejo de errores en cascada
- ✅ Auditoría y logs de operaciones
- ✅ Sincronización offline
- ✅ Cálculos y transformaciones de datos

**Módulos Involucrados:**
- Frontend: Componentes + Contexto
- Backend: Routers + Services
- Base de datos: Tablas y relaciones
- Servicios externos: IA, exportación

**Restricciones:**
- Pueden usar BD de prueba
- Deben limpiar estado entre tests
- Mock de APIs externas
- Máximo 100 assertions por test
- Tiempo de ejecución < 5 segundos por test

**Herramientas:**
- **Vitest**: Test runner
- **Mock de fetch**: Simular API
- **Mock de localStorage**: Simulador storage
- **Datos de prueba**: Fixtures predefinidas

**Formato de Archivo:**
```
src/tests/integration/[modulo].integration.test.js
```

**Ejemplo de Nombre:**
- `TC-INT-001: Flujo de Autenticación - Frontend ↔ Backend`
- `TC-INT-003: Ciclo de Venta Completo - Todos los Módulos`

---

## 📊 Matriz de Pruebas

### TC-COMP-XXX (Componentes)

| ID | Componente | Objetivo | Validaciones | Herramientas |
|----|-|-|-|-|
| TC-COMP-001 | Login | Validar form de autenticación | Renderizado, validaciones, errores, carga | Vitest + RTL |
| TC-COMP-002 | HubPrincipal | Validar navegación | Botones, cambio de vista, layout | Vitest + RTL |
| TC-COMP-003 | ListaProductos | Validar tabla y filtros | Renderizado, filtros, búsqueda, stock | Vitest + RTL |
| TC-COMP-004 | GestionCategorias | Validar CRUD | Create, Read, Update, Delete | Vitest + RTL |
| TC-COMP-005 | RegistroVenta | Validar cálculos | Carrito, subtotal, impuesto, total | Vitest + RTL |
| TC-COMP-006 | RegistroMerma | Validar pérdidas | Cantidad, justificación, cálculo | Vitest + RTL |
| TC-COMP-007 | HistorialVentas | Validar visualización | Tabla, filtros, exportación | Vitest + RTL |
| TC-COMP-008 | Configuracion | Validar preferencias | Cambio, guardado, validaciones | Vitest + RTL |
| TC-COMP-009 | ReportesAuditorias | Validar reportes | Generación, filtros, exportación | Vitest + RTL |

### TC-INT-XXX (Integración)

| ID | Módulos | Objetivo | Validaciones | Herramientas |
|----|-|-|-|-|
| TC-INT-001 | Auth (FE ↔ BE) | Autenticación completa | Credenciales, JWT, sesión | Vitest + Mock |
| TC-INT-002 | Productos (FE ↔ BE ↔ BD) | Persistencia de productos | CRUD, stock, disponibilidad | Vitest + Mock |
| TC-INT-003 | Ventas (FE ↔ BE ↔ BD) | Ciclo de venta | Cálculos, stock, auditoría | Vitest + Mock |
| TC-INT-004 | Reportes (FE ↔ BE ↔ BD) | Filtrado de datos | Filtros, totales, exportación | Vitest + Mock |
| TC-INT-005 | Offline (FE ↔ Storage ↔ BE) | Sincronización offline | localStorage, reconexión, duplicados | Vitest + Mock |

---

## 🛠️ Herramientas Utilizadas

### Frontend (Componentes + Integración)

```json
{
  "devDependencies": {
    "vitest": "^1.x",                    // Test runner
    "@vitest/ui": "^1.x",                // UI interactiva
    "jsdom": "^23.x",                    // Simulador DOM
    "@testing-library/react": "^14.x",   // Queries y render
    "@testing-library/jest-dom": "^6.x", // Matchers adicionales
    "@testing-library/user-event": "^14.x" // Interacción usuario
  }
}
```

### Backend (Tests Unitarios Existentes)

```bash
pytest                  # Test runner
pytest-cov             # Cobertura de código
pytest-mock            # Mocking
```

### E2E (Funcionales)

```bash
playwright             # Navegador automatizado
```

---

## ✅ Checklist de Implementación

### Configuración
- [x] Instalar dependencias (Vitest, React Testing Library)
- [x] Crear `vitest.config.js`
- [x] Crear `src/tests/setup.js`
- [x] Actualizar `package.json` con scripts de test

### Pruebas de Componentes (TC-COMP-XXX)
- [x] TC-COMP-001: Login
- [x] TC-COMP-003: ListaProductos
- [x] TC-COMP-005: RegistroVenta
- [ ] TC-COMP-002: HubPrincipal
- [ ] TC-COMP-004: GestionCategorias
- [ ] TC-COMP-006: RegistroMerma
- [ ] TC-COMP-007: HistorialVentas
- [ ] TC-COMP-008: Configuracion
- [ ] TC-COMP-009: ReportesAuditorias

### Pruebas de Integración (TC-INT-XXX)
- [x] TC-INT-001: Autenticación
- [x] TC-INT-003: Ciclo de Venta
- [x] TC-INT-005: Sincronización Offline
- [ ] TC-INT-002: Productos
- [ ] TC-INT-004: Reportes

### Documentación
- [x] TEST_DOCUMENTATION.md (Especificaciones detalladas)
- [x] README_EJECUCION.md (Guía de uso)
- [x] CONVENCION_PRUEBAS.md (Este documento)

---

## 🚀 Scripts de Ejecución

```bash
# Frontend
cd frontend

npm test                    # Watch mode
npm run test:ui            # Interfaz visual
npm run test:run           # Ejecución única (CI/CD)
npm run test:coverage      # Con cobertura

# Backend
cd backend
pytest tests_unitarios/ -v

# E2E
cd tests
npm test
```

---

## 📈 Criterios de Éxito

✅ **Todos los tests pasan**
```bash
npm run test:run
# Exit code: 0
```

✅ **Cobertura mínima 80% en componentes críticos**
```bash
npm run test:coverage
# Statements: 80%
# Branches: 75%
# Functions: 80%
# Lines: 80%
```

✅ **Tiempo de ejecución < 30 segundos**
```bash
npm run test:run
# Total: ~20-25 segundos
```

✅ **Sin errores en consola**
```bash
npm run test:run
# Console: 0 warnings, 0 errors
```

✅ **Documentación actualizada**
- TEST_DOCUMENTATION.md ✓
- README_EJECUCION.md ✓
- CONVENCION_PRUEBAS.md ✓

---

## 🔗 Referencias

- [Documentación Detallada](./TEST_DOCUMENTATION.md)
- [Guía de Ejecución](./README_EJECUCION.md)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

**Versión**: 1.0.0  
**Fecha**: 22 de mayo de 2026  
**Responsable**: Equipo QA
