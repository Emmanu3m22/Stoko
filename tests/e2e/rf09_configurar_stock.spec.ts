import { expect, test } from '@playwright/test';
import {
  createProduct,
  createTestAdmin,
  fillProductModal,
  getProduct,
  goToCatalog,
  loginViaUI,
  openProductEditor,
  unique,
} from './helpers';

test.describe('RF09 - Configurar stock minimo', () => {
  test('CP-09-01: Guarda un nivel de stock minimo valido', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Stock Minimo'),
      stock_actual: 20,
      stock_minimo: 3,
    });

    await loginViaUI(page, admin);
    await goToCatalog(page);

    const modal = await openProductEditor(page, product.nombre);
    await fillProductModal(modal, { minimumStock: '15' });
    await modal.getByRole('button', { name: /Actualizar/i }).click();

    await expect(modal).toBeHidden();
    const updated = await getProduct(request, admin.token, product.id_producto);
    expect(updated.stock_minimo).toBe(15);
  });

  test('CP-09-02: Rechaza valores negativos o vacios en stock minimo', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Stock Invalido'),
      stock_actual: 20,
      stock_minimo: 3,
    });

    await loginViaUI(page, admin);
    await goToCatalog(page);

    const modal = await openProductEditor(page, product.nombre);
    const minimumStock = modal.locator('input[type="number"]').nth(2);

    await minimumStock.fill('-5');
    expect(await minimumStock.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
    await modal.getByRole('button', { name: /Actualizar/i }).click();
    await expect(modal).toBeVisible();

    await minimumStock.fill('');
    expect(await minimumStock.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
    await modal.getByRole('button', { name: /Actualizar/i }).click();
    await expect(modal).toBeVisible();
  });
});
