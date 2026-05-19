import { test, expect } from '@playwright/test';

test.describe('RF06 - Registrar Venta', () => {

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
    const menuVentas = page.locator('text=Módulo de Ventas').first();
    if (await menuVentas.isVisible()) {
      await menuVentas.click();
    }
    // Abrir turno si es necesario (para Módulo de Ventas)
    const btnAbrirTurno = page.getByRole('button', { name: /Abrir turno/i });
    if (await btnAbrirTurno.isVisible()) {
      await btnAbrirTurno.click();
      await page.waitForTimeout(1000); // Esperar a que abra
    }
  });

  test('CP-06-01: Iniciar proceso de registro habilita la interfaz', async ({ page }) => {
    // Verificar que la interfaz de nueva venta está habilitada
    await expect(page.locator('button', { hasText: 'Nueva venta' }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Escanear código/i).first()).toBeEnabled();
  });

  test('CP-06-02 y CP-06-03: Seleccionar productos, agregar a lista y calcular subtotales', async ({ page }) => {
    // Buscar producto
    const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
    await inputBusqueda.fill('Producto Test');
    await page.waitForTimeout(600);

    // Seleccionar el primer producto de la lista desplegable o grilla
    const primerResultado = page.locator('button', { hasText: 'Producto Test' }).first().or(page.locator('.producto-resultado').first());
    if (await primerResultado.isVisible()) {
      await primerResultado.click();
    } else {
      // Simular enter en caso de escáner
      await inputBusqueda.press('Enter');
    }

    // Indicar cantidad (si hay un input para la cantidad del producto agregado)
    // Usualmente se agrega 1 al hacer clic. Validaremos que esté en la lista.
    const listaVenta = page.locator('.lista-venta, table').last();
    await expect(listaVenta).toContainText('Producto Test');

    // Verificar cálculos de subtotal
    const subtotal = page.locator('text=/Subtotal:/i, text=/Total:/i').first();
    await expect(subtotal).toBeVisible();
    const textoSubtotal = await subtotal.innerText();
    expect(textoSubtotal).toMatch(/\$\d+\.\d{2}/);
  });

  test('CP-06-04: Confirmar la operación de la venta', async ({ page }) => {
    // Asumiendo que ya hay un producto agregado o agregando uno rápido
    const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
    await inputBusqueda.fill('Producto Test');
    await page.waitForTimeout(600);
    await inputBusqueda.press('Enter');

    // Confirmar venta
    const btnCobrar = page.getByRole('button', { name: /Finalizar Venta/i });
    await btnCobrar.click();

    // Confirmar modal de pago si existe
    const btnConfirmar = page.getByRole('button', { name: /Completar Venta/i }).or(page.getByRole('button', { name: /Finalizar/i }));
    if (await btnConfirmar.isVisible()) {
      await btnConfirmar.click();
    }

    // Validar mensaje de éxito
    await expect(page.locator('text=/Venta registrada con éxito/i').first().or(page.locator('text=/completada/i').first())).toBeVisible();
  });

  test('CP-06-05: Error al agregar producto sin stock', async ({ page }) => {
    // Intentar buscar y agregar un producto que sabemos que no tiene stock
    const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
    await inputBusqueda.fill('Producto Sin Stock');
    await page.waitForTimeout(600);
    await inputBusqueda.press('Enter');

    // Validar el mensaje de error
    const msjError = page.locator('text=/no hay stock/i, text=/stock insuficiente/i').first();
    await expect(msjError).toBeVisible();
  });

});
