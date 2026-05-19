import { test, expect } from '@playwright/test';

test.describe('RF01 - Gestión de Productos (Catálogo e Inventario)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Iniciar sesión
    const inputEmail = page.locator('#email');
    await inputEmail.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    if (await inputEmail.isVisible()) {
      await inputEmail.fill('admin@stoko.com');
      await page.locator('#password').fill('admin1234');
      await page.locator('#btn-iniciar-sesion').click();

      // Esperar a que la navegación de inicio de sesión termine y cargue el Hub
      await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
      // Esperar a que el texto del Dashboard esté visible
      await expect(page.locator('text=Bienvenido a STOKO').first()).toBeVisible({ timeout: 10000 });
    }

    // Acceder al módulo de Catálogo (que contiene Productos)
    const menuCatalogo = page.getByRole('button', { name: 'Catálogo' }).first();
    if (await menuCatalogo.isVisible()) {
      await menuCatalogo.click();
    }
  });

  test('CP-01-01: Registrar y modificar producto exitosamente', async ({ page }) => {
    // Asegurarse de estar en la pestaña de Productos
    await page.locator('text=Productos').first().click();

    // 1. Registrar producto
    await page.locator('#btn-nuevo-producto').click();

    // Llenar formulario
    await page.getByPlaceholder('Ej: Electrónica...').or(page.getByText('Nombre del producto').locator('..').locator('input')).fill('Producto de Prueba Playwright');
    await page.getByText('Precio ($)').locator('..').locator('input').fill('150.50');
    await page.getByText('Stock Actual').locator('..').locator('input').fill('20');
    await page.getByText('Stock Mínimo').locator('..').locator('input').fill('5');
    await page.getByText('Código de barras').locator('..').locator('input').fill('1234567890123');

    // Seleccionar categoría
    const selectCategoria = page.locator('.fixed.inset-0 select, .bg-white.rounded-3xl select').first();
    await selectCategoria.selectOption({ index: 1 }).catch(() => {});
    
    // Guardar
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Validar que se muestra en el inventario
    await expect(page.locator('text=Producto de Prueba Playwright').first()).toBeVisible();

    // 2. Modificar producto
    // Hacer clic en el botón de editar del producto recién creado
    const productoFila = page.locator('tr', { hasText: 'Producto de Prueba Playwright' });
    // Seleccionar el botón de editar basado en las clases o el SVG
    const botonEditar = productoFila.locator('button').nth(0);
    await botonEditar.click();

    // Modificar precio
    await page.getByText('Precio ($)').locator('..').locator('input').fill('180.00');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Validar el cambio
    await expect(productoFila).toContainText(/180/);
  });

  test('CP-01-02: Ajuste de stock refleja sincronización en tiempo real', async ({ page }) => {
    await page.locator('text=Productos').first().click();

    // Buscar un producto existente para editar su stock
    const fila = page.locator('tbody tr').first();
    const nombreProducto = await fila.locator('td p.font-bold').first().innerText();

    // Editar
    await fila.locator('button').first().click();

    // Cambiar stock actual a un valor diferente
    await page.getByText('Stock Actual').locator('..').locator('input').fill('500');
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Validar que se actualizó en la tabla
    const filaActualizada = page.locator('tr', { hasText: nombreProducto }).first();
    await expect(filaActualizada.locator('text=500').first()).toBeVisible();
  });

  test('CP-01-03: Reducir cantidad por debajo del límite genera alerta', async ({ page }) => {
    await page.locator('text=Productos').first().click();

    // Editar producto
    const fila = page.locator('tbody tr').first();
    const nombreProducto = await fila.locator('td p.font-bold').first().innerText();

    await fila.locator('button').first().click();

    // Ajustar stock mínimo y stock actual para forzar la alerta
    await page.getByText('Stock Mínimo').locator('..').locator('input').fill('10');
    await page.getByText('Stock Actual').locator('..').locator('input').fill('2'); // Menor al mínimo
    await page.getByRole('button', { name: 'Actualizar' }).click();

    // Validar la alerta visual en la tabla (color ambar o punto intermitente)
    const filaBaja = page.locator('tr', { hasText: nombreProducto }).first();
    const iconoAlerta = filaBaja.locator('.bg-amber-500.animate-pulse'); // Según el frontend
    await expect(iconoAlerta).toBeVisible();

    // Validar filtrado de stock bajo
    await page.getByLabel('Solo stock bajo').check();
    await expect(page.locator('tr', { hasText: nombreProducto }).first()).toBeVisible();
  });
});
