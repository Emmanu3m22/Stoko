import { expect, test } from '@playwright/test';
import {
  API_URL,
  createProduct,
  createSale,
  createTestAdmin,
  ensureOpenShift,
  goToReports,
  loginViaUI,
  todayIso,
  unique,
} from './helpers';

test.describe('RF11 - Reportes de ventas e insights IA', () => {
  test('CP-11-01: Genera reporte por rango de fechas e insights de IA', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Reporte IA'),
      stock_actual: 50,
    });
    await ensureOpenShift(request, admin.token);
    await createSale(request, admin.token, product.id_producto, 25);
    const today = todayIso();

    await page.route(`${API_URL}/api/v1/reportes/insights`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fecha_inicio: today,
          fecha_fin: today,
          insights: 'Recomendacion E2E: reabastecer productos con alta rotacion.',
        }),
      });
    });

    await loginViaUI(page, admin);
    await goToReports(page);
    await page.getByRole('button', { name: /IA Insights/i }).click();
    await page.locator('#insights-fecha-inicio').fill(today);
    await page.locator('#insights-fecha-fin').fill(today);
    await page.locator('#btn-generar-reporte').click();

    await expect(page.getByText(/Total del Periodo/i)).toBeVisible();
    await expect(page.getByText(product.nombre)).toBeVisible();

    await page.locator('#btn-generar-insights').click();
    await expect(page.getByText(/Recomendacion E2E/i)).toBeVisible();
  });

  test.fixme(
    'CP-11-02: Registra auditoria al generar reporte desde la UI',
    async () => {
      // El caso existe en el PDF, pero la pantalla actual usa /api/v1/reportes/ventas,
      // y ese endpoint no crea LogAuditoria. Se deja documentado para activar cuando
      // la aplicacion registre la operacion desde este flujo.
    },
  );
});
