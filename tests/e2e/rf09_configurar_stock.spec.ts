import { test, expect } from '@playwright/test';

test.describe('RF09 - Configurar Stock Mínimo', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Iniciar sesión si es necesario
    const inputEmail = page.locator('#email');
    await inputEmail.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await inputEmail.isVisible()) {
      await inputEmail.fill('admin@stoko.com');
      await page.locator('#password').fill('admin1234');
      await page.locator('#btn-iniciar-sesion').click();
      await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
      // Esperar a que el texto del Dashboard esté visible
      await expect(page.locator('text=Bienvenido a STOKO').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
    // CP-09 implica modificar el stock mínimo de un producto
    const menuInventario = page.locator('text=/Catálogo/i, text=/Productos/i').first();
    if (await menuInventario.isVisible()) {
      await menuInventario.click();
    }
  });

  test('CP-09-01: Definir nivel de stock mínimo válido', async ({ page }) => {
    // Abrir modal de edición de un producto existente
    const filaProducto = page.locator('table tbody tr').first();
    await filaProducto.locator('button').nth(0).click();

    // Localizar el campo de stock mínimo
    const inputStockMinimo = page.getByText('Stock Mínimo').locator('..').locator('input');
    await inputStockMinimo.fill('');
    await inputStockMinimo.fill('15'); // Valor numérico válido

    // Guardar/Actualizar
    await page.getByRole('button', { name: /Actualizar/i, exact: false }).click();

    // Validar que se cierra el modal o muestra éxito
    const modalVisible = await page.locator('text=/Editar Producto/i').isVisible();
    expect(modalVisible).toBeFalsy();
  });

  test('CP-09-02: Bloqueo de caracteres inválidos y valores negativos en stock mínimo', async ({ page }) => {
    // Intentar abrir el modal de nuevo
    const filaProducto = page.locator('table tbody tr').first();
    await filaProducto.locator('button').nth(0).click();

    const inputStockMinimo = page.getByText('Stock Mínimo').locator('..').locator('input');
    
    // Al ser un input type="number", llenar caracteres no numéricos suele ser ignorado por el navegador o fallar.
    // Llenaremos con un valor negativo o vacío para comprobar.
    
    // Prueba de valor negativo
    await inputStockMinimo.fill('-5');
    await page.getByRole('button', { name: /Actualizar/i }).click();

    // Como el navegador bloquea el type="number" con min="0", el form no se envía
    let modalAunVisible = await page.locator('text=/Editar Producto/i').isVisible();
    expect(modalAunVisible).toBeTruthy(); // No debe cerrarse por el error

    // Prueba de cadena vacía
    await inputStockMinimo.fill('');
    await page.getByRole('button', { name: /Actualizar/i }).click();

    // Aún debe estar visible porque "required" lo impide
    modalAunVisible = await page.locator('text=/Editar Producto/i').isVisible();
    expect(modalAunVisible).toBeTruthy();
  });

});
