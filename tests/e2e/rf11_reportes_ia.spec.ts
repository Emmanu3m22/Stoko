import { test, expect } from '@playwright/test';

test.describe('RF11 - Reportes de ventas e Insights IA', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const menuReportes = page.locator('text=/Reportes/i, text=/Insights/i, text=/Auditoría/i').first();
    if (await menuReportes.isVisible()) {
      await menuReportes.click();
    }
  });

  test('CP-11-01: Generar reporte de ventas con Insights de IA por rango de fechas', async ({ page }) => {
    // Definir el rango de fechas
    const inputFechaInicio = page.locator('input[type="date"]').first();
    const inputFechaFin = page.locator('input[type="date"]').nth(1);

    if (await inputFechaInicio.isVisible() && await inputFechaFin.isVisible()) {
      await inputFechaInicio.fill('2026-05-01');
      await inputFechaFin.fill('2026-05-15');
    }

    // Generar reporte
    const btnGenerar = page.getByRole('button', { name: /Generar Reporte/i, exact: false }).first();
    await btnGenerar.click();

    // Validar que se muestre el apartado de recomendaciones hechas a través de la IA
    const seccionIA = page.locator('text=/Recomendaciones/i, text=/Insights/i, text=/Inteligencia Artificial/i').first();
    await expect(seccionIA).toBeVisible({ timeout: 10000 }); // La IA puede tardar unos segundos
  });

  test('CP-11-02: Registrar acción de generar reporte en el historial de auditoría', async ({ page }) => {
    // Generar el reporte para disparar el log
    const btnGenerar = page.getByRole('button', { name: /Generar Reporte/i, exact: false }).first();
    if (await btnGenerar.isVisible()) {
      await btnGenerar.click();
    }

    // Ir al historial de auditoría
    const tabAuditoria = page.locator('text=/Historial de Operaciones/i, text=/Auditorías/i, text=/Bitácora/i').first();
    if (await tabAuditoria.isVisible()) {
      await tabAuditoria.click();
    }

    // Verificar el registro
    const primerLog = page.locator('table tbody tr').first();
    await expect(primerLog).toContainText(/Reporte/i);
    const logTexto = await primerLog.innerText();
    expect(logTexto.length).toBeGreaterThan(10); // Asegura que existan datos de fecha/usuario
  });

});
