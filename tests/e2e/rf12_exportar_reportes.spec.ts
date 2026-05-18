import { test, expect } from '@playwright/test';

test.describe('RF12 - Exportar Reportes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const menuReportes = page.locator('text=/Reportes/i').first();
    if (await menuReportes.isVisible()) {
      await menuReportes.click();
    }
  });

  test('CP-12-01: Exportar reporte a PDF y Excel', async ({ page }) => {
    // 1. Asegurar que haya un reporte generado visible
    const btnGenerar = page.getByRole('button', { name: /Generar/i }).first();
    if (await btnGenerar.isVisible()) {
      await btnGenerar.click();
      await page.waitForTimeout(1000); // Esperar que termine de cargar
    }

    // 2. Probar exportación a PDF
    // Usaremos un EventListener para interceptar la descarga en Playwright
    const [downloadPdf] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button', { hasText: /PDF/i }).first().click()
    ]);
    
    // Validar nombre del archivo o que la descarga se completó
    const fileNamePdf = downloadPdf.suggestedFilename();
    expect(fileNamePdf.toLowerCase()).toContain('pdf');

    // 3. Probar exportación a Excel
    const [downloadExcel] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button', { hasText: /Excel/i }).first().click()
    ]);
    
    const fileNameExcel = downloadExcel.suggestedFilename();
    // Acepta xlsx o csv dependiendo del frontend
    expect(fileNameExcel.toLowerCase()).toMatch(/xlsx|csv/);
  });

});
