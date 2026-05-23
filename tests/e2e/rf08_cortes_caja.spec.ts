import { expect, test } from '@playwright/test';
import {
  createProduct,
  createSale,
  createTestAdmin,
  ensureOpenShift,
  goToReports,
  loginViaUI,
  unique,
} from './helpers';

test.describe('RF08 - Generar cortes de caja', () => {
  test('CP-08-01/02: Cierra el turno con desglose y registra auditoria', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Corte'),
      precio_unitario: 200,
      stock_actual: 4,
    });
    await ensureOpenShift(request, admin.token);
    const sale = await createSale(request, admin.token, product.id_producto, 1);

    await loginViaUI(page, admin);
    await goToReports(page);

    await expect(page.getByText(/Ventas Totales del Turno/i)).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /Efectivo/ }).filter({ hasText: '$232.00' }).first()).toBeVisible();
    await page.getByPlaceholder('0.00').fill(String(sale.total));
    await page.getByRole('button', { name: /Realizar Corte Ahora/i }).click();

    await expect(page.getByText(/Turno cerrado/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /No hay turno activo/i })).toBeVisible();

    await page.getByRole('button', { name: /Historial de Operaciones/i }).click();
    await expect(page.locator('tbody tr').filter({ hasText: /cerrar corte/i }).first()).toBeVisible();
  });
});
