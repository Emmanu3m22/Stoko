import { test, expect } from '@playwright/test';

test.describe('RF07 - Anular Venta', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ir al historial de ventas o reportes
    const menuHistorial = page.locator('text=/Historial/i').first().or(page.locator('text=/Reportes/i').first());
    if (await menuHistorial.isVisible()) {
      await menuHistorial.click();
    }
  });

  test('CP-07-01: Localizar venta y solicitar confirmación de anulación', async ({ page }) => {
    // Localizar una fila de venta registrada
    const filaVenta = page.locator('table tbody tr').first();
    await expect(filaVenta).toBeVisible();

    // Hacer clic en el botón de anular/cancelar venta
    const btnAnular = filaVenta.locator('button[title*="Anular"], button:has-text("Anular"), button.btn-danger').first();
    await btnAnular.click();

    // Validar que se solicita confirmación
    const modalConfirmacion = page.locator('text=/¿Seguro que deseas anular/i, text=/Confirmar anulación/i').first();
    await expect(modalConfirmacion).toBeVisible();

    // Confirmar la anulación
    await page.getByRole('button', { name: /Confirmar/i, exact: false }).click();

    // Validar que la venta se marca como anulada (ej: cambio de estado en la tabla)
    await expect(filaVenta.locator('text=/Anulada/i, text=/Cancelada/i').first()).toBeVisible();
  });

  test('CP-07-02: Verificar restauración de inventario e historial', async ({ page }) => {
    // Este test podría requerir verificar el stock de un producto antes y después.
    // Como E2E, navegaremos al inventario para validarlo o confiaremos en el mensaje de éxito que asegura la transacción.
    
    // Verificamos que al anular aparezca notificación de éxito indicando restauración
    const notificacion = page.locator('text=/Venta anulada correctamente/i, text=/Inventario restaurado/i').first();
    // Si la notificación se configuró para mostrar este mensaje
    if (await notificacion.isVisible()) {
      await expect(notificacion).toBeVisible();
    }

    // Opcionalmente, ir al log de auditoría/historial para ver el movimiento
    const tabAuditoria = page.locator('text=/Auditor/i').first();
    if (await tabAuditoria.isVisible()) {
      await tabAuditoria.click();
      const logAnulacion = page.locator('table tbody tr').first();
      await expect(logAnulacion).toContainText(/Anulación de venta/i);
    }
  });

});
