# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf10_mermas.spec.ts >> RF10 - Registrar Mermas >> CP-10-02: Prevención de registro con datos inválidos
- Location: e2e\rf10_mermas.spec.ts:61:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Registrar/i }).first()
    - locator resolved to <button disabled type="submit" class="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">Registrar Merma</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    51 × waiting for element to be visible, enabled and stable
       - element is not enabled
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
      - button "Módulo de Ventas" [ref=e20]:
        - img [ref=e22]
        - text: Módulo de Ventas
      - button "Reportes" [ref=e24]:
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
          - button "Registro de Mermas" [active] [ref=e56]
          - button "Exportar Reportes" [ref=e57]
          - button "Historial de Operaciones" [ref=e58]
      - generic [ref=e59]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - img [ref=e64]
            - heading "Nueva Merma" [level=3] [ref=e66]
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e69]: Producto
              - textbox "Buscar por nombre o código..." [ref=e70]
            - generic [ref=e71]:
              - generic [ref=e72]: Cantidad a descontar
              - spinbutton [ref=e73]
            - generic [ref=e74]:
              - generic [ref=e75]: Causa del daño/pérdida
              - textbox "Describa el motivo..." [ref=e76]
            - button "Registrar Merma" [disabled] [ref=e77]
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Historial Reciente de Mermas" [level=3] [ref=e81]
            - button "Actualizar" [ref=e82]
          - table [ref=e84]:
            - rowgroup [ref=e85]:
              - row "Fecha Producto Cant. Motivo" [ref=e86]:
                - columnheader "Fecha" [ref=e87]
                - columnheader "Producto" [ref=e88]
                - columnheader "Cant." [ref=e89]
                - columnheader "Motivo" [ref=e90]
            - rowgroup [ref=e91]:
              - row "5/12/2026 Gafas Polarizadas Onyx 1 Un cliente tiró las gafas y las rompió." [ref=e92]:
                - cell "5/12/2026" [ref=e93]
                - cell "Gafas Polarizadas Onyx" [ref=e94]
                - cell "1" [ref=e95]
                - cell "Un cliente tiró las gafas y las rompió." [ref=e96]
              - row "5/12/2026 Gansito 2 Gansitos caducados" [ref=e97]:
                - cell "5/12/2026" [ref=e98]
                - cell "Gansito" [ref=e99]
                - cell "2" [ref=e100]
                - cell "Gansitos caducados" [ref=e101]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF10 - Registrar Mermas', () => {
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
  18 |     // Navegar al módulo de Mermas (Análisis de negocio / Registro de mermas)
  19 |     const menuReportes = page.locator('text=Reportes').first();
  20 |     if (await menuReportes.isVisible()) {
  21 |       await menuReportes.click();
  22 |     }
  23 |     const tabMermas = page.locator('text=Registro de Mermas').first();
  24 |     if (await tabMermas.isVisible()) {
  25 |       await tabMermas.click();
  26 |     }
  27 |   });
  28 | 
  29 |   test('CP-10-01: Registrar merma con datos válidos', async ({ page }) => {
  30 |     // Abrir formulario o sección de "Registrar merma"
  31 |     const btnRegistrarMerma = page.getByRole('button', { name: /Registrar/i }).first();
  32 |     if (await btnRegistrarMerma.isVisible()) {
  33 |       await btnRegistrarMerma.click();
  34 |     }
  35 | 
  36 |     // Llenar datos de la merma
  37 |     const inputProducto = page.getByPlaceholder(/Escanear código/i).first();
  38 |     if (await inputProducto.isVisible()) {
  39 |       await inputProducto.fill('Producto Test');
  40 |       await page.waitForTimeout(500);
  41 |       await inputProducto.press('Enter');
  42 |     }
  43 | 
  44 |     // Ingresar cantidad
  45 |     const inputCantidad = page.locator('input[type="number"], input[name="cantidad"]').first();
  46 |     await inputCantidad.fill('2');
  47 | 
  48 |     // Ingresar causa
  49 |     const inputCausa = page.locator('textarea, input[name="causa"]').first();
  50 |     await inputCausa.fill('Producto caducado / dañado');
  51 | 
  52 |     // Guardar merma
  53 |     const btnGuardar = page.getByRole('button', { name: /Guardar/i, exact: false }).first();
  54 |     await expect(btnGuardar).toBeEnabled();
  55 |     await btnGuardar.click();
  56 | 
  57 |     // Validar notificación de éxito y registro en el historial
  58 |     await expect(page.locator('text=/registrada correctamente/i, text=/éxito/i').first()).toBeVisible();
  59 |   });
  60 | 
  61 |   test('CP-10-02: Prevención de registro con datos inválidos', async ({ page }) => {
  62 |     const btnRegistrarMerma = page.getByRole('button', { name: /Registrar/i }).first();
  63 |     if (await btnRegistrarMerma.isVisible()) {
> 64 |       await btnRegistrarMerma.click();
     |                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  65 |     }
  66 | 
  67 |     // Llenar campos con errores, ej. cantidad vacía o negativa
  68 |     const inputCantidad = page.locator('input[type="number"], input[name="cantidad"]').first();
  69 |     await inputCantidad.fill('-5');
  70 | 
  71 |     // El botón debería estar deshabilitado o mostrar error al hacer clic
  72 |     const btnGuardar = page.getByRole('button', { name: /Guardar/i, exact: false }).first();
  73 |     
  74 |     // Verificamos si el botón está deshabilitado
  75 |     const estaDeshabilitado = await btnGuardar.isDisabled();
  76 |     
  77 |     if (!estaDeshabilitado) {
  78 |       await btnGuardar.click();
  79 |       // Si permite click, debe mostrar validación debajo de los campos
  80 |       const msjError = page.locator('text=/invalido/i, text=/no puede ser negativo/i, text=/requerido/i').first();
  81 |       await expect(msjError).toBeVisible();
  82 |     } else {
  83 |       expect(estaDeshabilitado).toBeTruthy();
  84 |     }
  85 |   });
  86 | 
  87 | });
  88 | 
```