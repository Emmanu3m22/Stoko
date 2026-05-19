import { test, expect } from '@playwright/test';

test.describe('RF10 - Registrar Mermas', () => {

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
    // Navegar al módulo de Mermas (Análisis de negocio / Registro de mermas)
    const menuReportes = page.locator('text=Reportes').first();
    if (await menuReportes.isVisible()) {
      await menuReportes.click();
    }
    const tabMermas = page.locator('text=Registro de Mermas').first();
    if (await tabMermas.isVisible()) {
      await tabMermas.click();
    }
  });

  test('CP-10-01: Registrar merma con datos válidos', async ({ page }) => {
    // Abrir formulario o sección de "Registrar merma"
    const btnRegistrarMerma = page.getByRole('button', { name: /Registrar/i }).first();
    if (await btnRegistrarMerma.isVisible()) {
      await btnRegistrarMerma.click();
    }

    // Llenar datos de la merma
    const inputProducto = page.getByPlaceholder(/Escanear código/i).first();
    if (await inputProducto.isVisible()) {
      await inputProducto.fill('Producto Test');
      await page.waitForTimeout(500);
      await inputProducto.press('Enter');
    }

    // Ingresar cantidad
    const inputCantidad = page.locator('input[type="number"], input[name="cantidad"]').first();
    await inputCantidad.fill('2');

    // Ingresar causa
    const inputCausa = page.locator('textarea, input[name="causa"]').first();
    await inputCausa.fill('Producto caducado / dañado');

    // Guardar merma
    const btnGuardar = page.getByRole('button', { name: /Guardar/i, exact: false }).first();
    await expect(btnGuardar).toBeEnabled();
    await btnGuardar.click();

    // Validar notificación de éxito y registro en el historial
    await expect(page.locator('text=/registrada correctamente/i, text=/éxito/i').first()).toBeVisible();
  });

  test('CP-10-02: Prevención de registro con datos inválidos', async ({ page }) => {
    const btnRegistrarMerma = page.getByRole('button', { name: /Registrar/i }).first();
    if (await btnRegistrarMerma.isVisible()) {
      await btnRegistrarMerma.click();
    }

    // Llenar campos con errores, ej. cantidad vacía o negativa
    const inputCantidad = page.locator('input[type="number"], input[name="cantidad"]').first();
    await inputCantidad.fill('-5');

    // El botón debería estar deshabilitado o mostrar error al hacer clic
    const btnGuardar = page.getByRole('button', { name: /Guardar/i, exact: false }).first();
    
    // Verificamos si el botón está deshabilitado
    const estaDeshabilitado = await btnGuardar.isDisabled();
    
    if (!estaDeshabilitado) {
      await btnGuardar.click();
      // Si permite click, debe mostrar validación debajo de los campos
      const msjError = page.locator('text=/invalido/i, text=/no puede ser negativo/i, text=/requerido/i').first();
      await expect(msjError).toBeVisible();
    } else {
      expect(estaDeshabilitado).toBeTruthy();
    }
  });

});
