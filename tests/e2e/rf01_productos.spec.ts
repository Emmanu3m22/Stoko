// ============================================================
// CP-CU01 — Gestión de Productos
// Módulo  : Gestión del Catálogo e Inventario
// Tipo    : Funcional
// Autor   : Equipo QA — STOKO
// Fecha   : 15/03/2026
// ============================================================
// Objetivo: Validar que el administrador pueda registrar,
//           modificar y eliminar productos, asegurando la
//           sincronización de stock y la generación de alertas.
// Precondiciones:
//   1. El administrador debe haber iniciado sesión.
//   2. El sistema debe encontrarse disponible.
// ============================================================

import { test, expect, type Page } from '@playwright/test';

// ── Configuración global ──────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8000';
const ADMIN_EMAIL = 'admin@stoko.com';
const ADMIN_PASSWORD = 'admin1234';

// Datos del producto de prueba (código único para evitar colisiones)
const PRODUCTO_PRUEBA = {
  nombre: `Reloj Test CP01 ${Date.now()}`,
  precio: '500',
  stock: '20',
  stockMinimo: '5',
  codigo: `CP01-${Date.now()}`,
};

interface DatosProducto {
  nombre: string;
  precio: string;
  stock: string;
  stockMinimo: string;
  codigo: string;
}

// ── Helper: iniciar sesión como administrador ─────────────────────────────────
async function iniciarSesionAdmin(page: Page) {
  await page.goto(BASE_URL);

  // Esperar que la pantalla de login esté lista
  await page.waitForSelector('#btn-iniciar-sesion', { timeout: 10_000 });

  // Rellenar credenciales
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('#btn-iniciar-sesion');

  // Esperar a que el hub principal cargue (sidebar visible)
  await page.waitForSelector('text=STOKO', { timeout: 10_000 });
}

// ── Helper: navegar al módulo Catálogo ───────────────────────────────────────
async function irAlCatalogo(page: Page) {
  // El sidebar tiene un botón con el label "Catálogo"
  await page.click('button:has-text("Catálogo")');

  // Verificar que la vista de Catálogo está activa
  await page.waitForSelector('#btn-nuevo-producto', { timeout: 8_000 });
}

// ── Helper: abrir modal de nuevo producto ────────────────────────────────────
async function abrirModalNuevoProducto(page: Page) {
  await page.click('#btn-nuevo-producto');

  // El modal tiene el encabezado "Añadir Producto"
  await page.waitForSelector('text=Añadir Producto', { timeout: 5_000 });
}

// ── Helper: rellenar el formulario del producto ───────────────────────────────
async function rellenarFormularioProducto(page: Page, datos: DatosProducto) {
  // Campo Nombre
  const inputNombre = page.locator('input[placeholder*="Nombre"]').last();
  await inputNombre.fill(datos.nombre);

  // Campo Precio
  const inputPrecio = page.locator('input[type="number"]').first();
  await inputPrecio.fill(datos.precio);

  // Campo Stock Actual (segundo input numérico)
  const inputStock = page.locator('input[type="number"]').nth(1);
  await inputStock.fill(datos.stock);

  // Campo Stock Mínimo (tercer input numérico)
  const inputStockMin = page.locator('input[type="number"]').nth(2);
  await inputStockMin.fill(datos.stockMinimo);

  // Campo Código de barras (cuarto input numérico es el código —
  // en realidad es type="text"; se toma el último input de texto)
  const inputCodigo = page.locator('input[type="text"]').last();
  await inputCodigo.fill(datos.codigo);

  // Seleccionar la primera categoría disponible en el <select>
  const select = page.locator('select').last();
  const primeraOpcion = select.locator('option:not([value=""])').first();
  const valorOpcion = await primeraOpcion.getAttribute('value');
  await select.selectOption(valorOpcion);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CP-01-01
//  Registrar y modificar un producto con datos válidos
// ─────────────────────────────────────────────────────────────────────────────
test('CP-01-01 | Registrar producto con datos válidos y verificar en inventario', async ({ page }) => {
  // ── Arrange ────────────────────────────────────────────────────────────────
  await iniciarSesionAdmin(page);
  await irAlCatalogo(page);

  // ── Act: Crear producto ────────────────────────────────────────────────────
  await abrirModalNuevoProducto(page);
  await rellenarFormularioProducto(page, PRODUCTO_PRUEBA);

  // Guardar
  await page.click('button:has-text("Guardar")');

  // ── Assert: producto aparece en la tabla de inventario ────────────────────
  // El toast de éxito debe mostrar el nombre del producto
  await expect(
    page.locator(`text=${PRODUCTO_PRUEBA.nombre}`)
  ).toBeVisible({ timeout: 8_000 });

  // El producto debe aparecer en la tabla
  const fila = page.locator(`tr:has-text("${PRODUCTO_PRUEBA.nombre}")`);
  await expect(fila).toBeVisible({ timeout: 8_000 });

  // ── Act: Modificar producto ───────────────────────────────────────────────
  // Hacer clic en el botón de editar (ícono lápiz) de la fila del producto
  await fila.locator('button').first().click();

  // Esperar modal de edición
  await page.waitForSelector('text=Editar Producto', { timeout: 5_000 });

  // Actualizar el precio
  const inputPrecioEdicion = page.locator('input[type="number"]').first();
  await inputPrecioEdicion.fill('750');

  // Guardar cambios
  await page.click('button:has-text("Actualizar")');

  // ── Assert: el producto actualizado sigue visible en el inventario ────────
  const filaActualizada = page.locator(`tr:has-text("${PRODUCTO_PRUEBA.nombre}")`);
  await expect(filaActualizada).toBeVisible({ timeout: 8_000 });

  // Verificar que el precio actualizado ($750.00) aparece en la fila
  await expect(filaActualizada).toContainText('750', { timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
//  CP-01-02
//  Sincronización de stock tras ajuste de inventario
// ─────────────────────────────────────────────────────────────────────────────
test('CP-01-02 | La cantidad disponible se actualiza en tiempo real al ajustar el stock', async ({ page }) => {
  // ── Arrange ────────────────────────────────────────────────────────────────
  await iniciarSesionAdmin(page);
  await irAlCatalogo(page);

  // Crear un producto base con stock conocido (30 unidades)
  const productoSync = {
    ...PRODUCTO_PRUEBA,
    nombre: `Sync Test CP01 ${Date.now()}`,
    stock: '30',
    codigo: `SYNC-${Date.now()}`,
  };

  await abrirModalNuevoProducto(page);
  await rellenarFormularioProducto(page, productoSync);
  await page.click('button:has-text("Guardar")');

  // Esperar a que el producto aparezca
  const fila = page.locator(`tr:has-text("${productoSync.nombre}")`);
  await expect(fila).toBeVisible({ timeout: 8_000 });

  // Obtener el stock actual mostrado antes de la edición
  const stockAntes = await fila.locator('td').nth(3).innerText();

  // ── Act: Ajustar el stock editando el producto ────────────────────────────
  await fila.locator('button').first().click();
  await page.waitForSelector('text=Editar Producto', { timeout: 5_000 });

  const nuevoStock = '15';
  const inputStockEdicion = page.locator('input[type="number"]').nth(1);
  await inputStockEdicion.fill(nuevoStock);
  await page.click('button:has-text("Actualizar")');

  // ── Assert: el stock se actualiza en la tabla sin recargar la página ──────
  const filaActualizada = page.locator(`tr:has-text("${productoSync.nombre}")`);
  await expect(filaActualizada).toBeVisible({ timeout: 8_000 });

  // La celda de stock debe mostrar el valor actualizado (15)
  const stockDespues = await filaActualizada.locator('td').nth(3).innerText();
  expect(stockDespues.trim()).toContain('15');

  // El valor anterior (30) ya no debe estar en esa fila
  expect(stockDespues.trim()).not.toContain('30');
});

// ─────────────────────────────────────────────────────────────────────────────
//  CP-01-03
//  Alerta de stock bajo al reducir existencias al umbral mínimo
// ─────────────────────────────────────────────────────────────────────────────
test('CP-01-03 | El sistema muestra alerta de stock bajo al administrador', async ({ page }) => {
  // ── Arrange ────────────────────────────────────────────────────────────────
  await iniciarSesionAdmin(page);
  await irAlCatalogo(page);

  // Crear un producto cuyo stock_actual esté JUSTO ENCIMA del mínimo (20 > 10)
  const productoAlerta = {
    ...PRODUCTO_PRUEBA,
    nombre: `Alerta Stock CP01 ${Date.now()}`,
    stock: '20',
    stockMinimo: '10',
    codigo: `ALERT-${Date.now()}`,
  };

  await abrirModalNuevoProducto(page);
  await rellenarFormularioProducto(page, productoAlerta);
  await page.click('button:has-text("Guardar")');

  const fila = page.locator(`tr:has-text("${productoAlerta.nombre}")`);
  await expect(fila).toBeVisible({ timeout: 8_000 });

  // ── Act: Reducir el stock por DEBAJO del mínimo (9 < 10) ─────────────────
  await fila.locator('button').first().click();
  await page.waitForSelector('text=Editar Producto', { timeout: 5_000 });

  // Stock mínimo permanece en 10; bajamos el actual a 9
  const inputStockEdicion = page.locator('input[type="number"]').nth(1);
  await inputStockEdicion.fill('9');
  await page.click('button:has-text("Actualizar")');

  // ── Assert 1: indicador visual en la tabla (punto ámbar parpadeante) ──────
  const filaActualizada = page.locator(`tr:has-text("${productoAlerta.nombre}")`);
  await expect(filaActualizada).toBeVisible({ timeout: 8_000 });

  // El indicador de stock bajo es un <span> con clase animate-pulse
  const indicadorBajo = filaActualizada.locator('span.animate-pulse');
  await expect(indicadorBajo).toBeVisible({ timeout: 5_000 });

  // ── Assert 2: la alerta aparece en el Dashboard ───────────────────────────
  // Navegar al Dashboard
  await page.click('button:has-text("Dashboard")');
  await page.waitForSelector('text=Alerta de inventario', { timeout: 8_000 });

  // El banner de alerta debe ser visible
  const bannerAlerta = page.locator('text=Alerta de inventario');
  await expect(bannerAlerta).toBeVisible();

  // El producto con stock bajo debe aparecer en la tabla del dashboard
  const filaEnDashboard = page.locator(
    `.bg-white >> tr:has-text("${productoAlerta.nombre}")`
  );
  await expect(filaEnDashboard).toBeVisible({ timeout: 5_000 });
});