# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf08_cortes_caja.spec.ts >> RF08 - Generar Cortes de Caja >> CP-08-02: Verificar el registro del corte en el historial de auditoría
- Location: e2e\rf08_cortes_caja.spec.ts:45:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('table tbody tr').first()
Expected pattern: /corte/i
Received string:  "GansitoGeneral0uds.1256458787973424"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('table tbody tr').first()
    14 × locator resolved to <tr class="hover:bg-amber-50/30 transition-colors">…</tr>
       - unexpected value "GansitoGeneral0uds.1256458787973424"

```

```yaml
- row "Gansito General 0 uds. 1256458787973424":
  - cell "Gansito"
  - cell "General"
  - cell "0 uds."
  - cell "1256458787973424"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF08 - Generar Cortes de Caja', () => {
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
  18 |     // Ir a la sección de Reportes o Auditorías
  19 |     const menuReportes = page.locator('text=/Reportes/i, text=/Auditorías/i').first();
  20 |     if (await menuReportes.isVisible()) {
  21 |       await menuReportes.click();
  22 |     }
  23 |   });
  24 | 
  25 |   test('CP-08-01: Generar reporte de corte de caja con desglose', async ({ page }) => {
  26 |     // Localizar botón de generar corte
  27 |     const btnGenerarCorte = page.getByRole('button', { name: /Realizar Corte Ahora/i }).or(page.locator('text=Realizar Corte Ahora').first());
  28 |     await btnGenerarCorte.click();
  29 | 
  30 |     // Validar que se muestra el reporte (modal, vista nueva, o descarga)
  31 |     // Asumimos que se genera en pantalla un resumen antes de confirmar o un PDF
  32 |     const desgloseCorte = page.locator('text=/Desglose/i, text=/Total Ventas/i, text=/Mermas/i').first();
  33 |     await expect(desgloseCorte).toBeVisible();
  34 | 
  35 |     // Confirmar generación si es necesario
  36 |     const btnConfirmar = page.getByRole('button', { name: /Confirmar Corte/i, exact: false }).first();
  37 |     if (await btnConfirmar.isVisible()) {
  38 |       await btnConfirmar.click();
  39 |     }
  40 |     
  41 |     // Validar mensaje de éxito
  42 |     await expect(page.locator('text=/Corte generado exitosamente/i, text=/Guardado/i').first()).toBeVisible();
  43 |   });
  44 | 
  45 |   test('CP-08-02: Verificar el registro del corte en el historial de auditoría', async ({ page }) => {
  46 |     // Ir a la pestaña o sección de historial/auditoría si no está activa
  47 |     const tabHistorial = page.locator('text=/Historial de Operaciones/i, text=/Bitácora/i').first();
  48 |     if (await tabHistorial.isVisible()) {
  49 |       await tabHistorial.click();
  50 |     }
  51 | 
  52 |     // Comprobar la primera fila del historial
  53 |     const primeraFila = page.locator('table tbody tr').first();
> 54 |     await expect(primeraFila).toContainText(/corte/i);
     |                               ^ Error: expect(locator).toContainText(expected) failed
  55 |     // Valida que contenga un usuario y fecha (comprobando que la fila tiene contenido)
  56 |     const textoFila = await primeraFila.innerText();
  57 |     expect(textoFila.length).toBeGreaterThan(10); 
  58 |   });
  59 | 
  60 | });
  61 | 
```