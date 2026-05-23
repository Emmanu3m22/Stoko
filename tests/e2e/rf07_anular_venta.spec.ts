import { expect, test } from '@playwright/test';
import {
  createProduct,
  createSale,
  createTestAdmin,
  ensureOpenShift,
  getProduct,
  goToReports,
  loginViaUI,
  navigateTo,
  unique,
} from './helpers';

test.describe('RF07 - Anular venta', () => {
  test('CP-07-01/02: Anula una venta y restaura el inventario', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Anulacion'),
      stock_actual: 10,
    });
    await ensureOpenShift(request, admin.token);
    const sale = await createSale(request, admin.token, product.id_producto, 2);

    await loginViaUI(page, admin);
    await navigateTo(page, /M.dulo de Ventas/i);
    await page.getByRole('button', { name: /Historial de ventas/i }).click();

    const row = page.locator('tbody tr').filter({ hasText: `#${String(sale.id_venta).padStart(5, '0')}` }).first();
    await expect(row).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: /Anular/i }).click();
    await expect(row).toContainText(/Anulada/i);

    const restored = await getProduct(request, admin.token, product.id_producto);
    expect(restored.stock_actual).toBe(10);

    await goToReports(page);
    await page.getByRole('button', { name: /Historial de Operaciones/i }).click();
    await expect(page.locator('tbody tr').filter({ hasText: /anular venta/i }).first()).toBeVisible();
  });
});
