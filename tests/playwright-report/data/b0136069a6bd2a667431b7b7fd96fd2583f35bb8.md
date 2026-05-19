# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf07_anular_venta.spec.ts >> RF07 - Anular Venta >> CP-07-02: Verificar restauración de inventario e historial
- Location: e2e\rf07_anular_venta.spec.ts:45:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('table tbody tr').first()
Expected pattern: /Anulación de venta/i
Received string:  "#412/5/2026, 10:39:41 p.m.-$1,032.40--abiertoVer Detalle"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('table tbody tr').first()
    13 × locator resolved to <tr class="hover:bg-gray-50/50">…</tr>
       - unexpected value "#412/5/2026, 10:39:41 p.m.-$1,032.40--abiertoVer Detalle"

```

```yaml
- row "#4 12/5/2026, 10:39:41 p.m. - $1,032.40 - - abierto Ver Detalle":
  - cell "#4"
  - cell "12/5/2026, 10:39:41 p.m."
  - cell "-"
  - cell "$1,032.40"
  - cell "-"
  - cell "-"
  - cell "abierto"
  - cell "Ver Detalle":
    - button "Ver Detalle"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF07 - Anular Venta', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await page.goto('/');
  7  |     // Iniciar sesión si es necesario
  8  |     const inputEmail = page.locator('#email');
  9  |     await inputEmail.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  10 |     if (await inputEmail.isVisible()) {
  11 |       await inputEmail.fill('admin@stoko.com');
  12 |       await page.locator('#password').fill('admin1234');
  13 |       await page.locator('#btn-iniciar-sesion').click();
  14 |       await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
  15 |       // Esperar a que el texto del Dashboard esté visible
  16 |       await expect(page.locator('text=Bienvenido a STOKO').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
  17 |     }
  18 |     // Ir al historial de ventas o reportes
  19 |     const menuHistorial = page.locator('text=/Historial/i').first().or(page.locator('text=/Reportes/i').first());
  20 |     if (await menuHistorial.isVisible()) {
  21 |       await menuHistorial.click();
  22 |     }
  23 |   });
  24 | 
  25 |   test('CP-07-01: Localizar venta y solicitar confirmación de anulación', async ({ page }) => {
  26 |     // Localizar una fila de venta registrada
  27 |     const filaVenta = page.locator('table tbody tr').first();
  28 |     await expect(filaVenta).toBeVisible();
  29 | 
  30 |     // Hacer clic en el botón de anular/cancelar venta
  31 |     const btnAnular = filaVenta.locator('button', { hasText: 'Anular' }).first();
  32 |     await btnAnular.click();
  33 | 
  34 |     // Validar que se solicita confirmación
  35 |     const modalConfirmacion = page.locator('text=/¿Seguro que deseas anular/i, text=/Confirmar anulación/i').first();
  36 |     await expect(modalConfirmacion).toBeVisible();
  37 | 
  38 |     // Confirmar la anulación
  39 |     await page.getByRole('button', { name: /Confirmar/i, exact: false }).click();
  40 | 
  41 |     // Validar que la venta se marca como anulada (ej: cambio de estado en la tabla)
  42 |     await expect(filaVenta.locator('text=/Anulada/i, text=/Cancelada/i').first()).toBeVisible();
  43 |   });
  44 | 
  45 |   test('CP-07-02: Verificar restauración de inventario e historial', async ({ page }) => {
  46 |     // Este test podría requerir verificar el stock de un producto antes y después.
  47 |     // Como E2E, navegaremos al inventario para validarlo o confiaremos en el mensaje de éxito que asegura la transacción.
  48 |     
  49 |     // Verificamos que al anular aparezca notificación de éxito indicando restauración
  50 |     const notificacion = page.locator('text=/Venta anulada correctamente/i, text=/Inventario restaurado/i').first();
  51 |     // Si la notificación se configuró para mostrar este mensaje
  52 |     if (await notificacion.isVisible()) {
  53 |       await expect(notificacion).toBeVisible();
  54 |     }
  55 | 
  56 |     // Opcionalmente, ir al log de auditoría/historial para ver el movimiento
  57 |     const tabAuditoria = page.locator('text=/Auditor/i').first();
  58 |     if (await tabAuditoria.isVisible()) {
  59 |       await tabAuditoria.click();
  60 |       const logAnulacion = page.locator('table tbody tr').first();
> 61 |       await expect(logAnulacion).toContainText(/Anulación de venta/i);
     |                                  ^ Error: expect(locator).toContainText(expected) failed
  62 |     }
  63 |   });
  64 | 
  65 | });
  66 | 
```