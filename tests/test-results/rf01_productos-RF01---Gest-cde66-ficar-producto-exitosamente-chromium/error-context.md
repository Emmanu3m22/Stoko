# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf01_productos.spec.ts >> RF01 - Gestión de Productos (Catálogo e Inventario) >> CP-01-01: Registrar y modificar producto exitosamente
- Location: e2e\rf01_productos.spec.ts:30:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('tr').filter({ hasText: 'Producto de Prueba Playwright' }).locator('button').first()
    - locator resolved to <button class="p-2 text-gray-400 hover:text-[#4169E1] hover:bg-blue-50 rounded-lg transition-all">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    45 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

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
      - paragraph [ref=e45]: Catálogo
      - generic [ref=e47]: API conectada · localhost:8000
    - generic [ref=e50]:
      - generic [ref=e51]:
        - generic [ref=e52]:
          - paragraph [ref=e53]: Catálogos de Sistema
          - generic [ref=e54]:
            - button "Productos" [ref=e55]
            - generic [ref=e56]: /
            - button "Categorías" [ref=e57]
        - button "Nuevo Producto" [ref=e59]:
          - img [ref=e60]
          - text: Nuevo Producto
      - generic [ref=e62]:
        - generic [ref=e63]:
          - img [ref=e65]
          - generic [ref=e67]:
            - paragraph [ref=e68]: Total productos
            - paragraph [ref=e69]: "7"
        - generic [ref=e70]:
          - img [ref=e72]
          - generic [ref=e74]:
            - paragraph [ref=e75]: Stock bajo
            - paragraph [ref=e76]: "4"
        - generic [ref=e77]:
          - img [ref=e79]
          - generic [ref=e81]:
            - paragraph [ref=e82]: Valor inventario
            - paragraph [ref=e83]: $67,282.00
      - generic [ref=e84]:
        - generic [ref=e85]:
          - paragraph [ref=e86]: 7 registros encontrados
          - generic [ref=e87]:
            - generic [ref=e88] [cursor=pointer]:
              - checkbox "Solo stock bajo" [ref=e89]
              - generic [ref=e90]: Solo stock bajo
            - combobox [ref=e91]:
              - option "Todas las categorías" [selected]
              - option "Accesorios"
              - option "Calzado Deportivo"
              - option "Calzado Running"
              - option "Cat Test 1779123158495 Mod"
              - option "Cat Test 1779167175207 Mod"
              - option "Cat Test 1779167366167 Mod"
              - option "General"
              - option "Relojería"
              - option "Óptica"
            - generic [ref=e92]:
              - img [ref=e93]
              - textbox "Buscar por nombre o código…" [ref=e95]
        - table [ref=e97]:
          - rowgroup [ref=e98]:
            - row "Producto Categoría Precio Stock Código Acciones" [ref=e99]:
              - columnheader "Producto" [ref=e100]
              - columnheader "Categoría" [ref=e101]
              - columnheader "Precio" [ref=e102]
              - columnheader "Stock" [ref=e103]
              - columnheader "Código" [ref=e104]
              - columnheader "Acciones" [ref=e105]
          - rowgroup [ref=e106]:
            - 'row "Gafas Polarizadas Onyx ID: 0003 Óptica $890.00 2 Stock bajo STK-0051-C" [ref=e107]':
              - 'cell "Gafas Polarizadas Onyx ID: 0003" [ref=e108]':
                - paragraph [ref=e109]: Gafas Polarizadas Onyx
                - paragraph [ref=e110]: "ID: 0003"
              - cell "Óptica" [ref=e111]
              - cell "$890.00" [ref=e112]
              - cell "2 Stock bajo" [ref=e113]:
                - generic [ref=e114]:
                  - generic [ref=e115]: "2"
                  - generic "Stock bajo" [ref=e116]
              - cell "STK-0051-C" [ref=e117]
              - cell [ref=e118]:
                - generic [ref=e119]:
                  - button [ref=e120]:
                    - img [ref=e121]
                  - button [ref=e123]:
                    - img [ref=e124]
            - 'row "Gansito ID: 0006 General $18.00 0 Stock bajo 1256458787973424" [ref=e126]':
              - 'cell "Gansito ID: 0006" [ref=e127]':
                - paragraph [ref=e128]: Gansito
                - paragraph [ref=e129]: "ID: 0006"
              - cell "General" [ref=e130]
              - cell "$18.00" [ref=e131]
              - cell "0 Stock bajo" [ref=e132]:
                - generic [ref=e133]:
                  - generic [ref=e134]: "0"
                  - generic "Stock bajo" [ref=e135]
              - cell "1256458787973424" [ref=e136]
              - cell [ref=e137]:
                - generic [ref=e138]:
                  - button [ref=e139]:
                    - img [ref=e140]
                  - button [ref=e142]:
                    - img [ref=e143]
            - 'row "Producto de Prueba Playwright ID: 0007 General $150.50 20 1234567890123" [ref=e145]':
              - 'cell "Producto de Prueba Playwright ID: 0007" [ref=e146]':
                - paragraph [ref=e147]: Producto de Prueba Playwright
                - paragraph [ref=e148]: "ID: 0007"
              - cell "General" [ref=e149]
              - cell "$150.50" [ref=e150]
              - cell "20" [ref=e151]:
                - generic [ref=e153]: "20"
              - cell "1234567890123" [ref=e154]
              - cell [ref=e155]:
                - generic [ref=e156]:
                  - button [ref=e157]:
                    - img [ref=e158]
                  - button [ref=e160]:
                    - img [ref=e161]
            - 'row "Pulsera Titanium Edge ID: 0002 Accesorios $580.00 12 STK-0037-B" [ref=e163]':
              - 'cell "Pulsera Titanium Edge ID: 0002" [ref=e164]':
                - paragraph [ref=e165]: Pulsera Titanium Edge
                - paragraph [ref=e166]: "ID: 0002"
              - cell "Accesorios" [ref=e167]
              - cell "$580.00" [ref=e168]
              - cell "12" [ref=e169]:
                - generic [ref=e171]: "12"
              - cell "STK-0037-B" [ref=e172]
              - cell [ref=e173]:
                - generic [ref=e174]:
                  - button [ref=e175]:
                    - img [ref=e176]
                  - button [ref=e178]:
                    - img [ref=e179]
            - 'row "Reloj Cronógrafo Sovereign A ID: 0001 Relojería $1240.00 42 STK-0024-X" [ref=e181]':
              - 'cell "Reloj Cronógrafo Sovereign A ID: 0001" [ref=e182]':
                - paragraph [ref=e183]: Reloj Cronógrafo Sovereign A
                - paragraph [ref=e184]: "ID: 0001"
              - cell "Relojería" [ref=e185]
              - cell "$1240.00" [ref=e186]
              - cell "42" [ref=e187]:
                - generic [ref=e189]: "42"
              - cell "STK-0024-X" [ref=e190]
              - cell [ref=e191]:
                - generic [ref=e192]:
                  - button [ref=e193]:
                    - img [ref=e194]
                  - button [ref=e196]:
                    - img [ref=e197]
            - 'row "Sabritas ID: 0005 General $25.00 2 Stock bajo 65483472948556754948093" [ref=e199]':
              - 'cell "Sabritas ID: 0005" [ref=e200]':
                - paragraph [ref=e201]: Sabritas
                - paragraph [ref=e202]: "ID: 0005"
              - cell "General" [ref=e203]
              - cell "$25.00" [ref=e204]
              - cell "2 Stock bajo" [ref=e205]:
                - generic [ref=e206]:
                  - generic [ref=e207]: "2"
                  - generic "Stock bajo" [ref=e208]
              - cell "65483472948556754948093" [ref=e209]
              - cell [ref=e210]:
                - generic [ref=e211]:
                  - button [ref=e212]:
                    - img [ref=e213]
                  - button [ref=e215]:
                    - img [ref=e216]
            - 'row "Zapatillas Running Pro ID: 0004 Calzado Deportivo $850.50 4 Stock bajo ZAP-RUN-001" [ref=e218]':
              - 'cell "Zapatillas Running Pro ID: 0004" [ref=e219]':
                - paragraph [ref=e220]: Zapatillas Running Pro
                - paragraph [ref=e221]: "ID: 0004"
              - cell "Calzado Deportivo" [ref=e222]
              - cell "$850.50" [ref=e223]
              - cell "4 Stock bajo" [ref=e224]:
                - generic [ref=e225]:
                  - generic [ref=e226]: "4"
                  - generic "Stock bajo" [ref=e227]
              - cell "ZAP-RUN-001" [ref=e228]
              - cell [ref=e229]:
                - generic [ref=e230]:
                  - button [ref=e231]:
                    - img [ref=e232]
                  - button [ref=e234]:
                    - img [ref=e235]
      - generic [ref=e238]:
        - generic [ref=e239]:
          - heading "Añadir Producto" [level=2] [ref=e240]
          - paragraph [ref=e241]: Completa la ficha técnica del artículo
        - generic [ref=e242]:
          - generic [ref=e243]:
            - generic [ref=e244]: Nombre del producto
            - textbox [ref=e245]: Producto de Prueba Playwright
          - generic [ref=e246]:
            - generic [ref=e247]:
              - generic [ref=e248]: Precio ($)
              - spinbutton [ref=e249]: "150.50"
            - generic [ref=e250]:
              - generic [ref=e251]: Stock Actual
              - spinbutton [ref=e252]: "20"
          - generic [ref=e253]:
            - generic [ref=e254]:
              - generic [ref=e255]: Stock Mínimo
              - spinbutton [ref=e256]: "5"
            - generic [ref=e257]:
              - generic [ref=e258]: Código de barras
              - textbox [ref=e259]: "1234567890123"
          - generic [ref=e260]:
            - generic [ref=e261]: Categoría
            - combobox [ref=e262]:
              - option "Seleccionar..."
              - option "Accesorios" [selected]
              - option "Calzado Deportivo"
              - option "Calzado Running"
              - option "Cat Test 1779123158495 Mod"
              - option "Cat Test 1779167175207 Mod"
              - option "Cat Test 1779167366167 Mod"
              - option "General"
              - option "Relojería"
              - option "Óptica"
          - generic [ref=e263]:
            - button "Cancelar" [ref=e264]
            - button "Guardar" [active] [ref=e265]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('RF01 - Gestión de Productos (Catálogo e Inventario)', () => {
  4   | 
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/');
  7   | 
  8   |     // Iniciar sesión
  9   |     const inputEmail = page.locator('#email');
  10  |     await inputEmail.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  11  |     
  12  |     if (await inputEmail.isVisible()) {
  13  |       await inputEmail.fill('admin@stoko.com');
  14  |       await page.locator('#password').fill('admin1234');
  15  |       await page.locator('#btn-iniciar-sesion').click();
  16  | 
  17  |       // Esperar a que la navegación de inicio de sesión termine y cargue el Hub
  18  |       await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
  19  |       // Esperar a que el texto del Dashboard esté visible
  20  |       await expect(page.locator('text=Bienvenido a STOKO').first()).toBeVisible({ timeout: 10000 });
  21  |     }
  22  | 
  23  |     // Acceder al módulo de Catálogo (que contiene Productos)
  24  |     const menuCatalogo = page.getByRole('button', { name: 'Catálogo' }).first();
  25  |     if (await menuCatalogo.isVisible()) {
  26  |       await menuCatalogo.click();
  27  |     }
  28  |   });
  29  | 
  30  |   test('CP-01-01: Registrar y modificar producto exitosamente', async ({ page }) => {
  31  |     // Asegurarse de estar en la pestaña de Productos
  32  |     await page.locator('text=Productos').first().click();
  33  | 
  34  |     // 1. Registrar producto
  35  |     await page.locator('#btn-nuevo-producto').click();
  36  | 
  37  |     // Llenar formulario
  38  |     await page.getByPlaceholder('Ej: Electrónica...').or(page.getByText('Nombre del producto').locator('..').locator('input')).fill('Producto de Prueba Playwright');
  39  |     await page.getByText('Precio ($)').locator('..').locator('input').fill('150.50');
  40  |     await page.getByText('Stock Actual').locator('..').locator('input').fill('20');
  41  |     await page.getByText('Stock Mínimo').locator('..').locator('input').fill('5');
  42  |     await page.getByText('Código de barras').locator('..').locator('input').fill('1234567890123');
  43  | 
  44  |     // Seleccionar categoría
  45  |     const selectCategoria = page.locator('.fixed.inset-0 select, .bg-white.rounded-3xl select').first();
  46  |     await selectCategoria.selectOption({ index: 1 }).catch(() => {});
  47  |     
  48  |     // Guardar
  49  |     await page.getByRole('button', { name: 'Guardar' }).click();
  50  | 
  51  |     // Validar que se muestra en el inventario
  52  |     await expect(page.locator('text=Producto de Prueba Playwright').first()).toBeVisible();
  53  | 
  54  |     // 2. Modificar producto
  55  |     // Hacer clic en el botón de editar del producto recién creado
  56  |     const productoFila = page.locator('tr', { hasText: 'Producto de Prueba Playwright' });
  57  |     // Seleccionar el botón de editar basado en las clases o el SVG
  58  |     const botonEditar = productoFila.locator('button').nth(0);
> 59  |     await botonEditar.click();
      |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  60  | 
  61  |     // Modificar precio
  62  |     await page.getByText('Precio ($)').locator('..').locator('input').fill('180.00');
  63  |     await page.getByRole('button', { name: 'Actualizar' }).click();
  64  | 
  65  |     // Validar el cambio
  66  |     await expect(productoFila).toContainText(/180/);
  67  |   });
  68  | 
  69  |   test('CP-01-02: Ajuste de stock refleja sincronización en tiempo real', async ({ page }) => {
  70  |     await page.locator('text=Productos').first().click();
  71  | 
  72  |     // Buscar un producto existente para editar su stock
  73  |     const fila = page.locator('tbody tr').first();
  74  |     const nombreProducto = await fila.locator('td p.font-bold').first().innerText();
  75  | 
  76  |     // Editar
  77  |     await fila.locator('button').first().click();
  78  | 
  79  |     // Cambiar stock actual a un valor diferente
  80  |     await page.getByText('Stock Actual').locator('..').locator('input').fill('500');
  81  |     await page.getByRole('button', { name: 'Actualizar' }).click();
  82  | 
  83  |     // Validar que se actualizó en la tabla
  84  |     const filaActualizada = page.locator('tr', { hasText: nombreProducto }).first();
  85  |     await expect(filaActualizada.locator('text=500').first()).toBeVisible();
  86  |   });
  87  | 
  88  |   test('CP-01-03: Reducir cantidad por debajo del límite genera alerta', async ({ page }) => {
  89  |     await page.locator('text=Productos').first().click();
  90  | 
  91  |     // Editar producto
  92  |     const fila = page.locator('tbody tr').first();
  93  |     const nombreProducto = await fila.locator('td p.font-bold').first().innerText();
  94  | 
  95  |     await fila.locator('button').first().click();
  96  | 
  97  |     // Ajustar stock mínimo y stock actual para forzar la alerta
  98  |     await page.getByText('Stock Mínimo').locator('..').locator('input').fill('10');
  99  |     await page.getByText('Stock Actual').locator('..').locator('input').fill('2'); // Menor al mínimo
  100 |     await page.getByRole('button', { name: 'Actualizar' }).click();
  101 | 
  102 |     // Validar la alerta visual en la tabla (color ambar o punto intermitente)
  103 |     const filaBaja = page.locator('tr', { hasText: nombreProducto }).first();
  104 |     const iconoAlerta = filaBaja.locator('.bg-amber-500.animate-pulse'); // Según el frontend
  105 |     await expect(iconoAlerta).toBeVisible();
  106 | 
  107 |     // Validar filtrado de stock bajo
  108 |     await page.getByLabel('Solo stock bajo').check();
  109 |     await expect(page.locator('tr', { hasText: nombreProducto }).first()).toBeVisible();
  110 |   });
  111 | });
  112 | 
```