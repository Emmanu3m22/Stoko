# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf01_productos.spec.ts >> CP-01-02 | La cantidad disponible se actualiza en tiempo real al ajustar el stock
- Location: e2e\rf01_productos.spec.ts:155:5

# Error details

```
TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('#btn-iniciar-sesion') to be visible

```

# Page snapshot

```yaml
- generic [ref=e2]: "{\"mensaje\":\"Bienvenido a Stoko API v2.0\",\"documentacion\":\"/docs\",\"redoc\":\"/redoc\"}"
```

# Test source

```ts
  1   | // ============================================================
  2   | // CP-CU01 — Gestión de Productos
  3   | // Módulo  : Gestión del Catálogo e Inventario
  4   | // Tipo    : Funcional
  5   | // Autor   : Equipo QA — STOKO
  6   | // Fecha   : 15/03/2026
  7   | // ============================================================
  8   | // Objetivo: Validar que el administrador pueda registrar,
  9   | //           modificar y eliminar productos, asegurando la
  10  | //           sincronización de stock y la generación de alertas.
  11  | // Precondiciones:
  12  | //   1. El administrador debe haber iniciado sesión.
  13  | //   2. El sistema debe encontrarse disponible.
  14  | // ============================================================
  15  | 
  16  | import { test, expect, type Page } from '@playwright/test';
  17  | 
  18  | // ── Configuración global ──────────────────────────────────────────────────────
  19  | const BASE_URL = 'http://localhost:8000';
  20  | const ADMIN_EMAIL = 'admin@stoko.com';
  21  | const ADMIN_PASSWORD = 'admin1234';
  22  | 
  23  | // Datos del producto de prueba (código único para evitar colisiones)
  24  | const PRODUCTO_PRUEBA = {
  25  |   nombre: `Reloj Test CP01 ${Date.now()}`,
  26  |   precio: '500',
  27  |   stock: '20',
  28  |   stockMinimo: '5',
  29  |   codigo: `CP01-${Date.now()}`,
  30  | };
  31  | 
  32  | interface DatosProducto {
  33  |   nombre: string;
  34  |   precio: string;
  35  |   stock: string;
  36  |   stockMinimo: string;
  37  |   codigo: string;
  38  | }
  39  | 
  40  | // ── Helper: iniciar sesión como administrador ─────────────────────────────────
  41  | async function iniciarSesionAdmin(page: Page) {
  42  |   await page.goto(BASE_URL);
  43  | 
  44  |   // Esperar que la pantalla de login esté lista
> 45  |   await page.waitForSelector('#btn-iniciar-sesion', { timeout: 20_000 });
      |              ^ TimeoutError: page.waitForSelector: Timeout 20000ms exceeded.
  46  | 
  47  |   // Rellenar credenciales
  48  |   await page.fill('#email', ADMIN_EMAIL);
  49  |   await page.fill('#password', ADMIN_PASSWORD);
  50  |   await page.click('#btn-iniciar-sesion');
  51  | 
  52  |   // Esperar a que el hub principal cargue (sidebar visible)
  53  |   await page.waitForSelector('text=STOKO', { timeout: 10_000 });
  54  | }
  55  | 
  56  | // ── Helper: navegar al módulo Catálogo ───────────────────────────────────────
  57  | async function irAlCatalogo(page: Page) {
  58  |   // El sidebar tiene un botón con el label "Catálogo"
  59  |   await page.click('button:has-text("Catálogo")');
  60  | 
  61  |   // Verificar que la vista de Catálogo está activa
  62  |   await page.waitForSelector('#btn-nuevo-producto', { timeout: 8_000 });
  63  | }
  64  | 
  65  | // ── Helper: abrir modal de nuevo producto ────────────────────────────────────
  66  | async function abrirModalNuevoProducto(page: Page) {
  67  |   await page.click('#btn-nuevo-producto');
  68  | 
  69  |   // El modal tiene el encabezado "Añadir Producto"
  70  |   await page.waitForSelector('text=Añadir Producto', { timeout: 5_000 });
  71  | }
  72  | 
  73  | // ── Helper: rellenar el formulario del producto ───────────────────────────────
  74  | async function rellenarFormularioProducto(page: Page, datos: DatosProducto) {
  75  |   // Campo Nombre
  76  |   const inputNombre = page.locator('input[placeholder*="Nombre"]').last();
  77  |   await inputNombre.fill(datos.nombre);
  78  | 
  79  |   // Campo Precio
  80  |   const inputPrecio = page.locator('input[type="number"]').first();
  81  |   await inputPrecio.fill(datos.precio);
  82  | 
  83  |   // Campo Stock Actual (segundo input numérico)
  84  |   const inputStock = page.locator('input[type="number"]').nth(1);
  85  |   await inputStock.fill(datos.stock);
  86  | 
  87  |   // Campo Stock Mínimo (tercer input numérico)
  88  |   const inputStockMin = page.locator('input[type="number"]').nth(2);
  89  |   await inputStockMin.fill(datos.stockMinimo);
  90  | 
  91  |   // Campo Código de barras (cuarto input numérico es el código —
  92  |   // en realidad es type="text"; se toma el último input de texto)
  93  |   const inputCodigo = page.locator('input[type="text"]').last();
  94  |   await inputCodigo.fill(datos.codigo);
  95  | 
  96  |   // Seleccionar la primera categoría disponible en el <select>
  97  |   const select = page.locator('select').last();
  98  |   const primeraOpcion = select.locator('option:not([value=""])').first();
  99  |   const valorOpcion = await primeraOpcion.getAttribute('value');
  100 |   await select.selectOption(valorOpcion);
  101 | }
  102 | 
  103 | // ─────────────────────────────────────────────────────────────────────────────
  104 | //  CP-01-01
  105 | //  Registrar y modificar un producto con datos válidos
  106 | // ─────────────────────────────────────────────────────────────────────────────
  107 | test('CP-01-01 | Registrar producto con datos válidos y verificar en inventario', async ({ page }) => {
  108 |   // ── Arrange ────────────────────────────────────────────────────────────────
  109 |   await iniciarSesionAdmin(page);
  110 |   await irAlCatalogo(page);
  111 | 
  112 |   // ── Act: Crear producto ────────────────────────────────────────────────────
  113 |   await abrirModalNuevoProducto(page);
  114 |   await rellenarFormularioProducto(page, PRODUCTO_PRUEBA);
  115 | 
  116 |   // Guardar
  117 |   await page.click('button:has-text("Guardar")');
  118 | 
  119 |   // ── Assert: producto aparece en la tabla de inventario ────────────────────
  120 |   // El toast de éxito debe mostrar el nombre del producto
  121 |   await expect(
  122 |     page.locator(`text=${PRODUCTO_PRUEBA.nombre}`)
  123 |   ).toBeVisible({ timeout: 8_000 });
  124 | 
  125 |   // El producto debe aparecer en la tabla
  126 |   const fila = page.locator(`tr:has-text("${PRODUCTO_PRUEBA.nombre}")`);
  127 |   await expect(fila).toBeVisible({ timeout: 8_000 });
  128 | 
  129 |   // ── Act: Modificar producto ───────────────────────────────────────────────
  130 |   // Hacer clic en el botón de editar (ícono lápiz) de la fila del producto
  131 |   await fila.locator('button').first().click();
  132 | 
  133 |   // Esperar modal de edición
  134 |   await page.waitForSelector('text=Editar Producto', { timeout: 5_000 });
  135 | 
  136 |   // Actualizar el precio
  137 |   const inputPrecioEdicion = page.locator('input[type="number"]').first();
  138 |   await inputPrecioEdicion.fill('750');
  139 | 
  140 |   // Guardar cambios
  141 |   await page.click('button:has-text("Actualizar")');
  142 | 
  143 |   // ── Assert: el producto actualizado sigue visible en el inventario ────────
  144 |   const filaActualizada = page.locator(`tr:has-text("${PRODUCTO_PRUEBA.nombre}")`);
  145 |   await expect(filaActualizada).toBeVisible({ timeout: 8_000 });
```