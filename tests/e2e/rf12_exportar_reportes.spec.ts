import { expect, test } from '@playwright/test';
import {
  createProduct,
  createSale,
  createTestAdmin,
  ensureOpenShift,
  goToReports,
  loginViaUI,
  todayIso,
  unique,
} from './helpers';

test.describe('RF12 - Exportar reportes', () => {
  test('CP-12-01: Descarga reporte en PDF y Excel', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Exportar'),
      stock_actual: 5,
    });
    await ensureOpenShift(request, admin.token);
    await createSale(request, admin.token, product.id_producto, 1);
    const today = todayIso();

    await loginViaUI(page, admin);
    await goToReports(page);
    await page.getByRole('button', { name: /Exportar Reportes/i }).click();
    await page.locator('input[type="date"]').nth(0).fill(today);
    await page.locator('input[type="date"]').nth(1).fill(today);

    const [pdf] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Descargar PDF/i }).click(),
    ]);
    expect(pdf.suggestedFilename().toLowerCase()).toContain('.pdf');

    const [excel] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Descargar Excel/i }).click(),
    ]);
    expect(excel.suggestedFilename().toLowerCase()).toMatch(/\.xlsx$/);
  });
});
