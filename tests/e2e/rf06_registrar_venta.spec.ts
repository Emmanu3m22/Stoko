import { expect, test } from '@playwright/test';
import {
  addProductToCart,
  createProduct,
  createTestAdmin,
  ensureOpenShift,
  getProduct,
  loginViaUI,
  navigateTo,
  unique,
} from './helpers';

test.describe('RF06 - Registrar venta', () => {
  test('CP-06-01: Abrir turno habilita la interfaz de nueva venta', async ({ page, request }) => {
    const admin = await createTestAdmin(request);

    await loginViaUI(page, admin);
    await navigateTo(page, /M.dulo de Ventas/i);
    await expect(page.getByRole('heading', { name: /Sin turno abierto/i })).toBeVisible();
    await page.getByRole('button', { name: /Abrir turno/i }).click();

    await expect(page.getByRole('heading', { name: /Registro de Venta/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Escanear c.digo/i)).toBeEnabled();
  });

  test('CP-06-02/03/04: Agrega productos, calcula totales y finaliza venta', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Venta'),
      precio_unitario: 125,
      stock_actual: 6,
    });
    await ensureOpenShift(request, admin.token);

    await loginViaUI(page, admin);
    await navigateTo(page, /M.dulo de Ventas/i);
    await addProductToCart(page, product);

    await expect(page.getByText(/Subtotal/i).locator('..')).toContainText('$125.00');
    await expect(page.getByText(/Total a Pagar/i).locator('..')).toContainText('$145.00');

    await page.getByRole('button', { name: /Finalizar Venta/i }).click();
    await expect(page.getByRole('heading', { name: /Venta registrada/i })).toBeVisible();

    const updated = await getProduct(request, admin.token, product.id_producto);
    expect(updated.stock_actual).toBe(5);
  });

  test('CP-06-05: Muestra error cuando no hay stock suficiente', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Sin Stock'),
      stock_actual: 0,
    });
    await ensureOpenShift(request, admin.token);

    await loginViaUI(page, admin);
    await navigateTo(page, /M.dulo de Ventas/i);
    await addProductToCart(page, product);
    await page.getByRole('button', { name: /Finalizar Venta/i }).click();

    await expect(page.getByText(/Stock insuficiente/i)).toBeVisible();
  });
});
