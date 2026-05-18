import { test, expect } from '@playwright/test';

test.describe('RF08 - Generar Cortes de Caja', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ir a la sección de Reportes o Auditorías
    const menuReportes = page.locator('text=/Reportes/i, text=/Auditorías/i').first();
    if (await menuReportes.isVisible()) {
      await menuReportes.click();
    }
  });

  test('CP-08-01: Generar reporte de corte de caja con desglose', async ({ page }) => {
    // Localizar botón de generar corte
    const btnGenerarCorte = page.getByRole('button', { name: /Generar Corte/i }).or(page.locator('text=/Corte de caja/i').first());
    await btnGenerarCorte.click();

    // Validar que se muestra el reporte (modal, vista nueva, o descarga)
    // Asumimos que se genera en pantalla un resumen antes de confirmar o un PDF
    const desgloseCorte = page.locator('text=/Desglose/i, text=/Total Ventas/i, text=/Mermas/i').first();
    await expect(desgloseCorte).toBeVisible();

    // Confirmar generación si es necesario
    const btnConfirmar = page.getByRole('button', { name: /Confirmar Corte/i, exact: false }).first();
    if (await btnConfirmar.isVisible()) {
      await btnConfirmar.click();
    }
    
    // Validar mensaje de éxito
    await expect(page.locator('text=/Corte generado exitosamente/i, text=/Guardado/i').first()).toBeVisible();
  });

  test('CP-08-02: Verificar el registro del corte en el historial de auditoría', async ({ page }) => {
    // Ir a la pestaña o sección de historial/auditoría si no está activa
    const tabHistorial = page.locator('text=/Historial de Operaciones/i, text=/Bitácora/i').first();
    if (await tabHistorial.isVisible()) {
      await tabHistorial.click();
    }

    // Comprobar la primera fila del historial
    const primeraFila = page.locator('table tbody tr').first();
    await expect(primeraFila).toContainText(/Corte de caja/i);
    // Valida que contenga un usuario y fecha (comprobando que la fila tiene contenido)
    const textoFila = await primeraFila.innerText();
    expect(textoFila.length).toBeGreaterThan(10); 
  });

});
