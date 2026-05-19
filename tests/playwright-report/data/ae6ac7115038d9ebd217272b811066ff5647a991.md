# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf11_reportes_ia.spec.ts >> RF11 - Reportes de ventas e Insights IA >> CP-11-02: Registrar acción de generar reporte en el historial de auditoría
- Location: e2e\rf11_reportes_ia.spec.ts:47:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('table tbody tr').first()
Expected pattern: /Reporte/i
Received string:  "19 may 2026, 05:11:45 a.m.login#1Usuario admin@stoko.com inició sesión"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('table tbody tr').first()
    - locator resolved to <tr>…</tr>
    - unexpected value "Cargando registros..."
    13 × locator resolved to <tr class="hover:bg-gray-50/50 transition-colors">…</tr>
       - unexpected value "19 may 2026, 05:11:45 a.m.login#1Usuario admin@stoko.com inició sesión"

```

```yaml
- 'row "19 may 2026, 05:11:45 a.m. login #1 Usuario admin@stoko.com inició sesión"':
  - cell "19 may 2026, 05:11:45 a.m."
  - cell "login"
  - cell "#1"
  - cell "Usuario admin@stoko.com inició sesión"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF11 - Reportes de ventas e Insights IA', () => {
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
  18 |     const menuReportes = page.locator('text=Reportes').first();
  19 |     if (await menuReportes.isVisible()) {
  20 |       await menuReportes.click();
  21 |     }
  22 |     const tabInsights = page.locator('text=IA Insights (Gemini)').first();
  23 |     if (await tabInsights.isVisible()) {
  24 |       await tabInsights.click();
  25 |     }
  26 |   });
  27 | 
  28 |   test('CP-11-01: Generar reporte de ventas con Insights de IA por rango de fechas', async ({ page }) => {
  29 |     // Definir el rango de fechas
  30 |     const inputFechaInicio = page.locator('input[type="date"]').first();
  31 |     const inputFechaFin = page.locator('input[type="date"]').nth(1);
  32 | 
  33 |     if (await inputFechaInicio.isVisible() && await inputFechaFin.isVisible()) {
  34 |       await inputFechaInicio.fill('2026-05-01');
  35 |       await inputFechaFin.fill('2026-05-15');
  36 |     }
  37 | 
  38 |     // Generar reporte
  39 |     const btnGenerar = page.getByRole('button', { name: /Generar Reporte/i, exact: false }).first();
  40 |     await btnGenerar.click();
  41 | 
  42 |     // Validar que se muestre el apartado de recomendaciones hechas a través de la IA
  43 |     const seccionIA = page.locator('text=/Recomendaciones/i, text=/Insights/i, text=/Inteligencia Artificial/i').first();
  44 |     await expect(seccionIA).toBeVisible({ timeout: 10000 }); // La IA puede tardar unos segundos
  45 |   });
  46 | 
  47 |   test('CP-11-02: Registrar acción de generar reporte en el historial de auditoría', async ({ page }) => {
  48 |     // Generar el reporte para disparar el log
  49 |     const btnGenerar = page.getByRole('button', { name: /Generar Reporte/i, exact: false }).first();
  50 |     if (await btnGenerar.isVisible()) {
  51 |       await btnGenerar.click();
  52 |     }
  53 | 
  54 |     // Ir al historial de auditoría
  55 |     const tabAuditoria = page.locator('text=Historial de Operaciones').first();
  56 |     if (await tabAuditoria.isVisible()) {
  57 |       await tabAuditoria.click();
  58 |     }
  59 | 
  60 |     // Verificar el registro
  61 |     const primerLog = page.locator('table tbody tr').first();
> 62 |     await expect(primerLog).toContainText(/Reporte/i);
     |                             ^ Error: expect(locator).toContainText(expected) failed
  63 |     const logTexto = await primerLog.innerText();
  64 |     expect(logTexto.length).toBeGreaterThan(10); // Asegura que existan datos de fecha/usuario
  65 |   });
  66 | 
  67 | });
  68 | 
```