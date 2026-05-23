# Guía de Ejecución de Pruebas - Stoko

## 📋 Resumen

Este proyecto contiene tres tipos de pruebas automatizadas siguiendo la convención de IDs:

| Tipo | Prefijo | Herramienta | Ubicación |
|------|---------|-------------|-----------|
| **Componentes** | TC-COMP | Vitest + React Testing Library | `src/tests/components/` |
| **Integración** | TC-INT | Vitest + Mock API | `src/tests/integration/` |
| **Funcionales E2E** | TC-FUN | Playwright | `../tests/e2e/` |

---

## 🚀 Configuración Inicial

### 1. Instalar Dependencias de Frontend

```bash
cd frontend
npm install
```

Las dependencias de pruebas ya están incluidas:
- **Vitest**: Test runner
- **React Testing Library**: Pruebas de componentes
- **jsdom**: Simulador de navegador
- **@testing-library/user-event**: Interacción de usuario

### 2. Instalar Dependencias de Backend (Opcional)

Si necesitas correr tests del backend:

```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-cov
```

---

## 🧪 Ejecutar Pruebas

### Frontend (Componentes + Integración)

**Modo Watch (desarrollo)**
```bash
cd frontend
npm test
```
- Escucha cambios automáticamente
- Interfaz interactiva
- Ideal para desarrollo

**Modo UI (interfaz visual)**
```bash
cd frontend
npm run test:ui
```
- Abre interfaz gráfica en navegador
- Visualiza tests en árbol
- Acceso a cada test individual

**Modo Ejecución Única (CI/CD)**
```bash
cd frontend
npm run test:run
```
- Ejecuta todas las pruebas una vez
- Ideal para pipelines

**Con Cobertura de Código**
```bash
cd frontend
npm run test:coverage
```
- Genera reporte de cobertura
- HTML reporte en `coverage/`

### Backend (Tests Unitarios Existentes)

```bash
cd backend
pytest tests_unitarios/ -v                    # Tests unitarios
pytest backend/test_*.py -v                   # Tests de integración backend
pytest --cov=app --cov-report=html           # Con cobertura
```

### E2E (Pruebas Funcionales)

```bash
cd tests
npm test                                      # Ejecutar todas las pruebas
npm run test:ui                              # Interfaz de Playwright
npm run test:report                          # Ver reporte último
```

---

## 📊 Pruebas Disponibles

### Pruebas de Componentes (TC-COMP-XXX)

```
✅ TC-COMP-001: Login - Renderizado y Validación
   └─ Valida: Formulario, validaciones, estado de carga, errores

✅ TC-COMP-003: ListaProductos - Renderizado y Filtrado
   └─ Valida: Tabla, filtros, búsqueda, stock bajo, permisos

✅ TC-COMP-005: RegistroVenta - Validación y Cálculos
   └─ Valida: Carrito, cálculos, stock, métodos de pago
```

**Ejecutar solo componentes:**
```bash
cd frontend
npm test -- --grep TC-COMP
```

---

### Pruebas de Integración (TC-INT-XXX)

```
✅ TC-INT-001: Flujo de Autenticación (Frontend ↔ Backend)
   └─ Valida: Login, tokens JWT, sesiones, errores

✅ TC-INT-003: Ciclo de Venta Completo
   └─ Valida: Carrito, cálculos, stock, auditoría, persistencia

✅ TC-INT-005: Sincronización Offline
   └─ Valida: localStorage, reconexión, duplicados, timestamps
```

**Ejecutar solo integración:**
```bash
cd frontend
npm test -- --grep TC-INT
```

---

## 📝 Estructura de Archivos

```
frontend/
├── src/
│   ├── tests/
│   │   ├── setup.js                      # Configuración global
│   │   ├── TEST_DOCUMENTATION.md         # 📖 Este documento
│   │   ├── components/
│   │   │   ├── Login.test.jsx            # TC-COMP-001
│   │   │   ├── ListaProductos.test.jsx   # TC-COMP-003
│   │   │   └── RegistroVenta.test.jsx    # TC-COMP-005
│   │   └── integration/
│   │       ├── auth.integration.test.js  # TC-INT-001
│   │       ├── ventas.integration.test.js# TC-INT-003
│   │       └── offline.integration.test.js# TC-INT-005
│   └── components/
│       ├── Login.jsx
│       ├── RegistroVenta.jsx
│       ├── ListaProductos.jsx
│       └── ...
├── vitest.config.js                      # Configuración de Vitest
└── package.json                          # Scripts de test
```

---

## 🔍 Filtrar y Buscar Tests

### Por Nombre
```bash
cd frontend
npm test -- --grep "Login"
```

### Por Archivo
```bash
cd frontend
npm test src/tests/components/Login.test.jsx
```

### Por ID de Prueba
```bash
cd frontend
npm test -- --grep "TC-COMP-001"
```

### Tests Específicos
```bash
cd frontend
npm test -- --reporter=verbose
```

---

## 📈 Cobertura de Código

La cobertura se configura en `vitest.config.js`:

```javascript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['src/components/**/*.{js,jsx}', 'src/lib/**/*.{js,jsx}'],
  exclude: ['src/tests/**', 'node_modules/']
}
```

**Generar reporte:**
```bash
cd frontend
npm run test:coverage
```

**Ver reporte HTML:**
```bash
# Se genera en coverage/index.html
# Abrir en navegador
```

---

## 🐛 Debug de Tests

### Con Node Inspector

```bash
cd frontend
node --inspect-brk ./node_modules/.bin/vitest run
```

### Con VS Code Debugger

Agregar a `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## ✅ Criterios de Aceptación

- ✅ Todos los tests pasan
- ✅ Cobertura mínima 80% en componentes críticos
- ✅ Sin errores en consola
- ✅ Tiempos de ejecución < 30 segundos
- ✅ Documentación actualizada

---

## 🔗 Integración con CI/CD

### GitHub Actions (Ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Run component tests
        run: cd frontend && npm run test:run
      
      - name: Generate coverage
        run: cd frontend && npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📚 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Playground](https://testing-playground.com/)
- [Jest Matchers (compatible con Vitest)](https://vitest.dev/api/expect.html)

---

## 💡 Tips y Trucos

### 1. Ejecutar tests en paralelo
```bash
npm test -- --workers=4
```

### 2. Filtrar por nombre de test
```bash
npm test -- --grep "debe renderizar"
```

### 3. Modo watch con rerun
```bash
npm test -- --watch
```

### 4. Limpiar cache
```bash
npm test -- --clearCache
```

### 5. Ver cuál test toma más tiempo
```bash
npm test -- --reporter=verbose --inspect-brk
```

---

## 🆘 Problemas Comunes

### Error: "Cannot find module '@testing-library/react'"
```bash
cd frontend
npm install --save-dev @testing-library/react
```

### Tests colgados o timeout
```bash
npm test -- --testTimeout=10000  # 10 segundos
```

### Problemas con jsdom
```bash
npm install --save-dev jsdom@latest
```

### Limpiar node_modules y reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Soporte

Para problemas o preguntas sobre las pruebas:
1. Revisar [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)
2. Consultar logs de test: `npm test -- --reporter=verbose`
3. Ejecutar en modo UI: `npm run test:ui`

---

**Última actualización**: 22 de mayo de 2026  
**Versión**: 1.0.0
