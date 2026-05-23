# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf11_reportes_ia.spec.ts >> RF11 - Reportes de ventas e insights IA >> CP-11-01: Genera reporte por rango de fechas e insights de IA
- Location: e2e\rf11_reportes_ia.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Producto Reporte IA-1779511194892-p69qb')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Producto Reporte IA-1779511194892-p69qb')

```

```yaml
- complementary:
  - text: S STOKO
  - paragraph: Sistema POS
  - navigation:
    - paragraph: Principal
    - button "Dashboard":
      - img
      - text: Dashboard
    - button "Catálogo":
      - img
      - text: Catálogo
    - button "Módulo de Ventas":
      - img
      - text: Módulo de Ventas
    - button "Reportes":
      - img
      - text: Reportes
    - button "Configuración":
      - img
      - text: Configuración
  - text: A
  - paragraph: Admin e2e-admin-1779511194039-427rr@example.com
  - paragraph: administrador
  - button "Cerrar sesión":
    - img
    - text: Cerrar sesión
- main:
  - paragraph: Reportes
  - text: API conectada · localhost:8000
  - heading "Reportes y Auditorías" [level=1]
  - button "Cierre de Turno"
  - button "IA Insights (Gemini)"
  - button "Registro de Mermas"
  - button "Exportar Reportes"
  - button "Historial de Operaciones"
  - img
  - heading "Rango de Análisis" [level=3]
  - paragraph: Selecciona el periodo para generar el reporte y los insights
  - text: Fecha inicio
  - textbox: 2026-05-23
  - text: Fecha fin
  - textbox: 2026-05-23
  - button "Generar Reporte":
    - img
    - text: Generar Reporte
  - paragraph: Total del Periodo
  - paragraph: $24,476.00
  - paragraph: Transacciones
  - paragraph: "31"
  - paragraph: Subtotal
  - paragraph: $21,100.00
  - paragraph: Impuestos
  - paragraph: $3,376.00
  - heading "🏆 Productos más vendidos" [level=4]
  - table:
    - rowgroup:
      - row "Producto Unidades Importe":
        - columnheader "Producto"
        - columnheader "Unidades"
        - columnheader "Importe"
    - rowgroup:
      - row "#1Producto Reporte IA-1779507759063-cfagm 25 $2,500.00":
        - cell "#1Producto Reporte IA-1779507759063-cfagm"
        - cell "25"
        - cell "$2,500.00"
      - row "#2Producto Reporte IA-1779507839046-hpbpx 25 $2,500.00":
        - cell "#2Producto Reporte IA-1779507839046-hpbpx"
        - cell "25"
        - cell "$2,500.00"
      - row "#3Producto Reporte IA-1779507946757-z7rmv 25 $2,500.00":
        - cell "#3Producto Reporte IA-1779507946757-z7rmv"
        - cell "25"
        - cell "$2,500.00"
      - row "#4Producto Reporte IA-1779508136360-hhouq 25 $2,500.00":
        - cell "#4Producto Reporte IA-1779508136360-hhouq"
        - cell "25"
        - cell "$2,500.00"
      - row "#5Producto Reporte IA-1779508607602-yf7vs 25 $2,500.00":
        - cell "#5Producto Reporte IA-1779508607602-yf7vs"
        - cell "25"
        - cell "$2,500.00"
  - heading "💳 Métodos de pago" [level=4]
  - text: efectivo $24,476.00 (100.0%)
  - heading "⚠️ Productos en riesgo de desabasto (10)" [level=4]
  - text: "Gansito — stock: 0 / mín: 4 Producto Sin Stock-1779507484261-52hg3 — stock: 0 / mín: 2 Producto Sin Stock-1779507689599-mevs6 — stock: 0 / mín: 2 Producto Sin Stock-1779507811080-mlcfh — stock: 0 / mín: 2 Producto Sin Stock-1779507949917-4x873 — stock: 0 / mín: 2 Producto Sin Stock-1779508140833-n7fbr — stock: 0 / mín: 2 Producto Sin Stock-1779508609333-5w7sj — stock: 0 / mín: 2 Producto Sin Stock-1779510026227-d3g73 — stock: 0 / mín: 2 Producto Sin Stock-1779511081908-t2rk1 — stock: 0 / mín: 2 Sabritas — stock: 2 / mín: 3"
  - button "✨ Generar Insights con IA":
    - img
    - text: ✨ Generar Insights con IA
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import {
  3  |   API_URL,
  4  |   createProduct,
  5  |   createSale,
  6  |   createTestAdmin,
  7  |   ensureOpenShift,
  8  |   goToReports,
  9  |   loginViaUI,
  10 |   todayIso,
  11 |   unique,
  12 | } from './helpers';
  13 | 
  14 | test.describe('RF11 - Reportes de ventas e insights IA', () => {
  15 |   test('CP-11-01: Genera reporte por rango de fechas e insights de IA', async ({ page, request }) => {
  16 |     const admin = await createTestAdmin(request);
  17 |     const product = await createProduct(request, admin.token, {
  18 |       nombre: unique('Producto Reporte IA'),
  19 |       stock_actual: 50,
  20 |     });
  21 |     await ensureOpenShift(request, admin.token);
  22 |     await createSale(request, admin.token, product.id_producto, 25);
  23 |     const today = todayIso();
  24 | 
  25 |     await page.route(`${API_URL}/api/v1/reportes/insights`, async (route) => {
  26 |       await route.fulfill({
  27 |         status: 200,
  28 |         contentType: 'application/json',
  29 |         body: JSON.stringify({
  30 |           fecha_inicio: today,
  31 |           fecha_fin: today,
  32 |           insights: 'Recomendacion E2E: reabastecer productos con alta rotacion.',
  33 |         }),
  34 |       });
  35 |     });
  36 | 
  37 |     await loginViaUI(page, admin);
  38 |     await goToReports(page);
  39 |     await page.getByRole('button', { name: /IA Insights/i }).click();
  40 |     await page.locator('#insights-fecha-inicio').fill(today);
  41 |     await page.locator('#insights-fecha-fin').fill(today);
  42 |     await page.locator('#btn-generar-reporte').click();
  43 | 
  44 |     await expect(page.getByText(/Total del Periodo/i)).toBeVisible();
> 45 |     await expect(page.getByText(product.nombre)).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  46 | 
  47 |     await page.locator('#btn-generar-insights').click();
  48 |     await expect(page.getByText(/Recomendacion E2E/i)).toBeVisible();
  49 |   });
  50 | 
  51 |   test.fixme(
  52 |     'CP-11-02: Registra auditoria al generar reporte desde la UI',
  53 |     async () => {
  54 |       // El caso existe en el PDF, pero la pantalla actual usa /api/v1/reportes/ventas,
  55 |       // y ese endpoint no crea LogAuditoria. Se deja documentado para activar cuando
  56 |       // la aplicacion registre la operacion desde este flujo.
  57 |     },
  58 |   );
  59 | });
  60 | 
```