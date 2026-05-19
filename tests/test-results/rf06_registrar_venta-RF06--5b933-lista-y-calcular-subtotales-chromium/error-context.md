# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf06_registrar_venta.spec.ts >> RF06 - Registrar Venta >> CP-06-02 y CP-06-03: Seleccionar productos, agregar a lista y calcular subtotales
- Location: e2e\rf06_registrar_venta.spec.ts:36:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.lista-venta, table').last()
Expected substring: "Producto Test"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.lista-venta, table').last()

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
  - paragraph: Administrador Stoko
  - paragraph: administrador
  - button "Cerrar sesión":
    - img
    - text: Cerrar sesión
- main:
  - paragraph: Módulo de Ventas
  - text: API conectada · localhost:8000
  - button "Nueva venta"
  - button "Historial de ventas"
  - paragraph: Punto de Venta
  - heading "Registro de Venta" [level=2]
  - text: Cliente General
  - img
  - textbox "[⚡] Escanear código de barras o escribir y presionar ENTER...": Producto Test
  - img
  - paragraph: Carrito vacío
  - paragraph: Busca o escanea un producto para comenzar
  - paragraph: Subtotal
  - paragraph: $0.00
  - text: Descuentos — $0.00 IVA (16%) $0.00
  - paragraph: Total a Pagar
  - paragraph: $0.00
  - button "Finalizar Venta F12" [disabled]:
    - img
    - text: Finalizar Venta F12
  - button "Pausar"
  - button "Último"
  - button "Cancelar Transacción"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF06 - Registrar Venta', () => {
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
  18 |     const menuVentas = page.locator('text=Módulo de Ventas').first();
  19 |     if (await menuVentas.isVisible()) {
  20 |       await menuVentas.click();
  21 |     }
  22 |     // Abrir turno si es necesario (para Módulo de Ventas)
  23 |     const btnAbrirTurno = page.getByRole('button', { name: /Abrir turno/i });
  24 |     if (await btnAbrirTurno.isVisible()) {
  25 |       await btnAbrirTurno.click();
  26 |       await page.waitForTimeout(1000); // Esperar a que abra
  27 |     }
  28 |   });
  29 | 
  30 |   test('CP-06-01: Iniciar proceso de registro habilita la interfaz', async ({ page }) => {
  31 |     // Verificar que la interfaz de nueva venta está habilitada
  32 |     await expect(page.locator('button', { hasText: 'Nueva venta' }).first()).toBeVisible();
  33 |     await expect(page.getByPlaceholder(/Escanear código/i).first()).toBeEnabled();
  34 |   });
  35 | 
  36 |   test('CP-06-02 y CP-06-03: Seleccionar productos, agregar a lista y calcular subtotales', async ({ page }) => {
  37 |     // Buscar producto
  38 |     const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
  39 |     await inputBusqueda.fill('Producto Test');
  40 |     await page.waitForTimeout(600);
  41 | 
  42 |     // Seleccionar el primer producto de la lista desplegable o grilla
  43 |     const primerResultado = page.locator('button', { hasText: 'Producto Test' }).first().or(page.locator('.producto-resultado').first());
  44 |     if (await primerResultado.isVisible()) {
  45 |       await primerResultado.click();
  46 |     } else {
  47 |       // Simular enter en caso de escáner
  48 |       await inputBusqueda.press('Enter');
  49 |     }
  50 | 
  51 |     // Indicar cantidad (si hay un input para la cantidad del producto agregado)
  52 |     // Usualmente se agrega 1 al hacer clic. Validaremos que esté en la lista.
  53 |     const listaVenta = page.locator('.lista-venta, table').last();
> 54 |     await expect(listaVenta).toContainText('Producto Test');
     |                              ^ Error: expect(locator).toContainText(expected) failed
  55 | 
  56 |     // Verificar cálculos de subtotal
  57 |     const subtotal = page.locator('text=/Subtotal:/i, text=/Total:/i').first();
  58 |     await expect(subtotal).toBeVisible();
  59 |     const textoSubtotal = await subtotal.innerText();
  60 |     expect(textoSubtotal).toMatch(/\$\d+\.\d{2}/);
  61 |   });
  62 | 
  63 |   test('CP-06-04: Confirmar la operación de la venta', async ({ page }) => {
  64 |     // Asumiendo que ya hay un producto agregado o agregando uno rápido
  65 |     const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
  66 |     await inputBusqueda.fill('Producto Test');
  67 |     await page.waitForTimeout(600);
  68 |     await inputBusqueda.press('Enter');
  69 | 
  70 |     // Confirmar venta
  71 |     const btnCobrar = page.getByRole('button', { name: /Finalizar Venta/i });
  72 |     await btnCobrar.click();
  73 | 
  74 |     // Confirmar modal de pago si existe
  75 |     const btnConfirmar = page.getByRole('button', { name: /Completar Venta/i }).or(page.getByRole('button', { name: /Finalizar/i }));
  76 |     if (await btnConfirmar.isVisible()) {
  77 |       await btnConfirmar.click();
  78 |     }
  79 | 
  80 |     // Validar mensaje de éxito
  81 |     await expect(page.locator('text=/Venta registrada con éxito/i').first().or(page.locator('text=/completada/i').first())).toBeVisible();
  82 |   });
  83 | 
  84 |   test('CP-06-05: Error al agregar producto sin stock', async ({ page }) => {
  85 |     // Intentar buscar y agregar un producto que sabemos que no tiene stock
  86 |     const inputBusqueda = page.getByPlaceholder(/Escanear código/i).first();
  87 |     await inputBusqueda.fill('Producto Sin Stock');
  88 |     await page.waitForTimeout(600);
  89 |     await inputBusqueda.press('Enter');
  90 | 
  91 |     // Validar el mensaje de error
  92 |     const msjError = page.locator('text=/no hay stock/i, text=/stock insuficiente/i').first();
  93 |     await expect(msjError).toBeVisible();
  94 |   });
  95 | 
  96 | });
  97 | 
```