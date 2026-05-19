# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf07_anular_venta.spec.ts >> RF07 - Anular Venta >> CP-07-01: Localizar venta y solicitar confirmación de anulación
- Location: e2e\rf07_anular_venta.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('table tbody tr').first().locator('button').filter({ hasText: 'Anular' }).first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]: S
      - generic [ref=e8]:
        - text: STOKO
        - paragraph [ref=e9]: Sistema POS
    - navigation [ref=e10]:
      - paragraph [ref=e11]: Principal
      - button "Dashboard" [ref=e12]:
        - img [ref=e14]
        - text: Dashboard
      - button "Catálogo" [ref=e16]:
        - img [ref=e18]
        - text: Catálogo
      - button "Módulo de Ventas" [ref=e20]:
        - img [ref=e22]
        - text: Módulo de Ventas
      - button "Reportes" [active] [ref=e24]:
        - img [ref=e26]
        - text: Reportes
      - button "Configuración" [ref=e29]:
        - img [ref=e31]
        - text: Configuración
    - generic [ref=e33]:
      - generic [ref=e34]:
        - generic [ref=e36]: A
        - generic [ref=e37]:
          - paragraph [ref=e38]: Administrador Stoko
          - paragraph [ref=e39]: administrador
      - button "Cerrar sesión" [ref=e40]:
        - img [ref=e41]
        - text: Cerrar sesión
  - main [ref=e43]:
    - generic [ref=e44]:
      - paragraph [ref=e45]: Reportes
      - generic [ref=e47]: API conectada · localhost:8000
    - generic [ref=e50]:
      - generic [ref=e51]:
        - heading "Reportes y Auditorías" [level=1] [ref=e52]
        - generic [ref=e53]:
          - button "Cierre de Turno" [ref=e54]
          - button "IA Insights (Gemini)" [ref=e55]
          - button "Registro de Mermas" [ref=e56]
          - button "Exportar Reportes" [ref=e57]
          - button "Historial de Operaciones" [ref=e58]
      - generic [ref=e59]:
        - generic [ref=e60]:
          - generic [ref=e61]:
            - paragraph [ref=e62]: Ventas Totales del Turno
            - paragraph [ref=e63]: $1,032.40
            - generic [ref=e64]:
              - generic [ref=e65]:
                - generic [ref=e66]: 💵 Efectivo
                - generic [ref=e67]: $1,032.40
              - generic [ref=e68]:
                - generic [ref=e69]: 💳 Tarjeta Crédito/Débito
                - generic [ref=e70]: $0.00
              - generic [ref=e71]:
                - generic [ref=e72]: 🏦 Transferencia
                - generic [ref=e73]: $0.00
              - generic [ref=e74]:
                - generic [ref=e75]: ⚠️ Mermas Registradas
                - generic [ref=e76]: 1 productos
          - generic [ref=e77]:
            - heading "Cerrar Turno" [level=3] [ref=e78]
            - generic [ref=e79]:
              - generic [ref=e80]: Efectivo Real en Caja (Contado)
              - generic [ref=e81]:
                - generic [ref=e82]: $
                - spinbutton [ref=e83]
            - button "Realizar Corte Ahora" [disabled] [ref=e84]
        - generic [ref=e85]:
          - heading "Historial de Cortes de Caja" [level=3] [ref=e86]
          - table [ref=e88]:
            - rowgroup [ref=e89]:
              - row "ID Fecha Apertura Fecha Cierre Ventas Totales Efectivo Real Diferencia Estado Acciones" [ref=e90]:
                - columnheader "ID" [ref=e91]
                - columnheader "Fecha Apertura" [ref=e92]
                - columnheader "Fecha Cierre" [ref=e93]
                - columnheader "Ventas Totales" [ref=e94]
                - columnheader "Efectivo Real" [ref=e95]
                - columnheader "Diferencia" [ref=e96]
                - columnheader "Estado" [ref=e97]
                - columnheader "Acciones" [ref=e98]
            - rowgroup [ref=e99]:
              - row "#4 12/5/2026, 10:39:41 p.m. - $1,032.40 - - abierto Ver Detalle" [ref=e100]:
                - cell "#4" [ref=e101]
                - cell "12/5/2026, 10:39:41 p.m." [ref=e102]
                - cell "-" [ref=e103]
                - cell "$1,032.40" [ref=e104]
                - cell "-" [ref=e105]
                - cell "-" [ref=e106]
                - cell "abierto" [ref=e107]
                - cell "Ver Detalle" [ref=e108]:
                  - button "Ver Detalle" [ref=e109]
              - row "#3 12/5/2026, 10:37:15 p.m. 12/5/2026, 10:37:38 p.m. $87.00 $87.00 $0.00 cerrado Ver Detalle" [ref=e110]:
                - cell "#3" [ref=e111]
                - cell "12/5/2026, 10:37:15 p.m." [ref=e112]
                - cell "12/5/2026, 10:37:38 p.m." [ref=e113]
                - cell "$87.00" [ref=e114]
                - cell "$87.00" [ref=e115]
                - cell "$0.00" [ref=e116]
                - cell "cerrado" [ref=e117]
                - cell "Ver Detalle" [ref=e118]:
                  - button "Ver Detalle" [ref=e119]
              - row "#2 9/5/2026, 5:11:12 a.m. 9/5/2026, 5:13:16 a.m. $1,032.40 $5,000.00 $3,967.60 cerrado Ver Detalle" [ref=e120]:
                - cell "#2" [ref=e121]
                - cell "9/5/2026, 5:11:12 a.m." [ref=e122]
                - cell "9/5/2026, 5:13:16 a.m." [ref=e123]
                - cell "$1,032.40" [ref=e124]
                - cell "$5,000.00" [ref=e125]
                - cell "$3,967.60" [ref=e126]
                - cell "cerrado" [ref=e127]
                - cell "Ver Detalle" [ref=e128]:
                  - button "Ver Detalle" [ref=e129]
              - row "#1 9/5/2026, 5:07:23 a.m. 9/5/2026, 5:08:56 a.m. $0.00 $1,000.00 $1,000.00 cerrado Ver Detalle" [ref=e130]:
                - cell "#1" [ref=e131]
                - cell "9/5/2026, 5:07:23 a.m." [ref=e132]
                - cell "9/5/2026, 5:08:56 a.m." [ref=e133]
                - cell "$0.00" [ref=e134]
                - cell "$1,000.00" [ref=e135]
                - cell "$1,000.00" [ref=e136]
                - cell "cerrado" [ref=e137]
                - cell "Ver Detalle" [ref=e138]:
                  - button "Ver Detalle" [ref=e139]
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
> 32 |     await btnAnular.click();
     |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  61 |       await expect(logAnulacion).toContainText(/Anulación de venta/i);
  62 |     }
  63 |   });
  64 | 
  65 | });
  66 | 
```