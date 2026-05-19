# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf09_configurar_stock.spec.ts >> RF09 - Configurar Stock Mínimo >> CP-09-01: Definir nivel de stock mínimo válido
- Location: e2e\rf09_configurar_stock.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('table tbody tr').first().locator('button').first()

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
      - button "Catálogo" [ref=e17]:
        - img [ref=e19]
        - text: Catálogo
      - button "Módulo de Ventas" [ref=e21]:
        - img [ref=e23]
        - text: Módulo de Ventas
      - button "Reportes" [ref=e25]:
        - img [ref=e27]
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
      - paragraph [ref=e45]: Dashboard
      - generic [ref=e47]: API conectada · localhost:8000
    - generic [ref=e50]:
      - generic [ref=e54]:
        - paragraph [ref=e55]: Panel operativo · lunes, 18 de mayo
        - heading "Bienvenido a STOKO" [level=1] [ref=e56]
        - paragraph [ref=e57]: Todo bajo control. Gestiona el catálogo, procesa ventas y revisa métricas desde un solo lugar.
        - generic [ref=e58]:
          - button "Nueva Venta" [ref=e59]
          - button "Ver Catálogo" [ref=e60]
      - generic [ref=e61]:
        - generic [ref=e62]:
          - img [ref=e64]
          - generic [ref=e66]:
            - paragraph [ref=e67]: Alerta de inventario
            - paragraph [ref=e68]: 3 productos con stock por debajo del mínimo configurado
          - button "Ver catálogo →" [ref=e69]
        - table [ref=e70]:
          - rowgroup [ref=e71]:
            - row "Producto Categoría Stock actual Código" [ref=e72]:
              - columnheader "Producto" [ref=e73]
              - columnheader "Categoría" [ref=e74]
              - columnheader "Stock actual" [ref=e75]
              - columnheader "Código" [ref=e76]
          - rowgroup [ref=e77]:
            - row "Gansito General 0 uds. 1256458787973424" [ref=e78]:
              - cell "Gansito" [ref=e79]
              - cell "General" [ref=e80]
              - cell "0 uds." [ref=e81]:
                - generic [ref=e82]:
                  - text: "0"
                  - generic [ref=e83]: uds.
              - cell "1256458787973424" [ref=e84]
            - row "Sabritas General 2 uds. 65483472948556754948093" [ref=e85]:
              - cell "Sabritas" [ref=e86]
              - cell "General" [ref=e87]
              - cell "2 uds." [ref=e88]:
                - generic [ref=e89]:
                  - text: "2"
                  - generic [ref=e90]: uds.
              - cell "65483472948556754948093" [ref=e91]
            - row "Zapatillas Running Pro Calzado Deportivo 4 uds. ZAP-RUN-001" [ref=e92]:
              - cell "Zapatillas Running Pro" [ref=e93]
              - cell "Calzado Deportivo" [ref=e94]
              - cell "4 uds." [ref=e95]:
                - generic [ref=e96]:
                  - text: "4"
                  - generic [ref=e97]: uds.
              - cell "ZAP-RUN-001" [ref=e98]
        - paragraph [ref=e100]: "Valor total en riesgo: $3,452.00"
      - generic [ref=e101]:
        - button "7 Total productos · En catálogo" [ref=e102]:
          - img [ref=e104]
          - paragraph [ref=e106]: "7"
          - paragraph [ref=e107]: Total productos · En catálogo
        - button "$510,502.00 Valor inventario · Stock × precio" [ref=e108]:
          - img [ref=e110]
          - paragraph [ref=e112]: $510,502.00
          - paragraph [ref=e113]: Valor inventario · Stock × precio
        - button "Módulo POS Registrar venta · Ir al POS →" [ref=e114]:
          - img [ref=e116]
          - paragraph [ref=e118]: Módulo POS
          - paragraph [ref=e119]: Registrar venta · Ir al POS →
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF09 - Configurar Stock Mínimo', () => {
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
  18 |     // CP-09 implica modificar el stock mínimo de un producto
  19 |     const menuInventario = page.locator('text=/Catálogo/i, text=/Productos/i').first();
  20 |     if (await menuInventario.isVisible()) {
  21 |       await menuInventario.click();
  22 |     }
  23 |   });
  24 | 
  25 |   test('CP-09-01: Definir nivel de stock mínimo válido', async ({ page }) => {
  26 |     // Abrir modal de edición de un producto existente
  27 |     const filaProducto = page.locator('table tbody tr').first();
> 28 |     await filaProducto.locator('button').nth(0).click();
     |                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  29 | 
  30 |     // Localizar el campo de stock mínimo
  31 |     const inputStockMinimo = page.getByText('Stock Mínimo').locator('..').locator('input');
  32 |     await inputStockMinimo.fill('');
  33 |     await inputStockMinimo.fill('15'); // Valor numérico válido
  34 | 
  35 |     // Guardar/Actualizar
  36 |     await page.getByRole('button', { name: /Actualizar/i, exact: false }).click();
  37 | 
  38 |     // Validar que se cierra el modal o muestra éxito
  39 |     const modalVisible = await page.locator('text=/Editar Producto/i').isVisible();
  40 |     expect(modalVisible).toBeFalsy();
  41 |   });
  42 | 
  43 |   test('CP-09-02: Bloqueo de caracteres inválidos y valores negativos en stock mínimo', async ({ page }) => {
  44 |     // Intentar abrir el modal de nuevo
  45 |     const filaProducto = page.locator('table tbody tr').first();
  46 |     await filaProducto.locator('button').nth(0).click();
  47 | 
  48 |     const inputStockMinimo = page.getByText('Stock Mínimo').locator('..').locator('input');
  49 |     
  50 |     // Al ser un input type="number", llenar caracteres no numéricos suele ser ignorado por el navegador o fallar.
  51 |     // Llenaremos con un valor negativo o vacío para comprobar.
  52 |     
  53 |     // Prueba de valor negativo
  54 |     await inputStockMinimo.fill('-5');
  55 |     await page.getByRole('button', { name: /Actualizar/i }).click();
  56 | 
  57 |     // Como el navegador bloquea el type="number" con min="0", el form no se envía
  58 |     let modalAunVisible = await page.locator('text=/Editar Producto/i').isVisible();
  59 |     expect(modalAunVisible).toBeTruthy(); // No debe cerrarse por el error
  60 | 
  61 |     // Prueba de cadena vacía
  62 |     await inputStockMinimo.fill('');
  63 |     await page.getByRole('button', { name: /Actualizar/i }).click();
  64 | 
  65 |     // Aún debe estar visible porque "required" lo impide
  66 |     modalAunVisible = await page.locator('text=/Editar Producto/i').isVisible();
  67 |     expect(modalAunVisible).toBeTruthy();
  68 |   });
  69 | 
  70 | });
  71 | 
```