# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf06_registrar_venta.spec.ts >> RF06 - Registrar venta >> CP-06-02/03/04: Agrega productos, calcula totales y finaliza venta
- Location: e2e\rf06_registrar_venta.spec.ts:26:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Producto Venta-1779511072430-vndaa/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /Producto Venta-1779511072430-vndaa/i })

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
  - paragraph: Admin e2e-admin-1779511071537-9bqzc@example.com
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
  - textbox "[⚡] Escanear código de barras o escribir y presionar ENTER...": Producto Venta-1779511072430-vndaa
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
  147 |     headers: authHeaders(token),
  148 |   });
  149 |   expect(active.ok(), `${await opened.text()}\n${await active.text()}`).toBeTruthy();
  150 |   return active.json();
  151 | }
  152 | 
  153 | export async function createSale(
  154 |   request: APIRequestContext,
  155 |   token: string,
  156 |   productId: number,
  157 |   quantity = 1,
  158 | ) {
  159 |   const response = await request.post(`${API_URL}/api/v1/ventas/`, {
  160 |     headers: authHeaders(token),
  161 |     data: {
  162 |       metodo_pago: 'efectivo',
  163 |       items: [{ id_producto: productId, cantidad: quantity }],
  164 |     },
  165 |   });
  166 |   expect(response.ok(), await response.text()).toBeTruthy();
  167 |   return response.json();
  168 | }
  169 | 
  170 | export async function loginViaUI(page: Page, credentials: Credentials) {
  171 |   await page.addInitScript(() => {
  172 |     localStorage.clear();
  173 |     sessionStorage.clear();
  174 |   });
  175 |   await page.goto(APP_URL);
  176 |   await expect(page.locator('#email')).toBeVisible();
  177 |   await page.locator('#email').fill(credentials.email);
  178 |   await page.locator('#password').fill(credentials.password);
  179 |   await page.locator('#btn-iniciar-sesion').click();
  180 |   await expect(page.getByRole('heading', { name: /Bienvenido a STOKO/i })).toBeVisible({
  181 |     timeout: 15_000,
  182 |   });
  183 | }
  184 | 
  185 | export async function navigateTo(page: Page, menuName: RegExp) {
  186 |   await page.locator('aside').getByRole('button', { name: menuName }).click();
  187 | }
  188 | 
  189 | export async function goToCatalog(page: Page) {
  190 |   await navigateTo(page, /Cat.logo/i);
  191 |   await expect(page.locator('#btn-nuevo-producto')).toBeVisible();
  192 | }
  193 | 
  194 | export async function goToReports(page: Page) {
  195 |   await navigateTo(page, /Reportes/i);
  196 |   await expect(page.getByRole('heading', { name: /Reportes y Auditor.as/i })).toBeVisible();
  197 | }
  198 | 
  199 | export function productRow(page: Page, productName: string): Locator {
  200 |   return page.locator('tbody tr').filter({ hasText: productName }).first();
  201 | }
  202 | 
  203 | export async function fillProductModal(
  204 |   modal: Locator,
  205 |   data: {
  206 |     name?: string;
  207 |     price?: string;
  208 |     stock?: string;
  209 |     minimumStock?: string;
  210 |     code?: string;
  211 |     categoryId?: number;
  212 |   },
  213 | ) {
  214 |   const textInputs = modal.locator('input[type="text"]');
  215 |   const numberInputs = modal.locator('input[type="number"]');
  216 | 
  217 |   if (data.name !== undefined) await textInputs.first().fill(data.name);
  218 |   if (data.price !== undefined) await numberInputs.nth(0).fill(data.price);
  219 |   if (data.stock !== undefined) await numberInputs.nth(1).fill(data.stock);
  220 |   if (data.minimumStock !== undefined) await numberInputs.nth(2).fill(data.minimumStock);
  221 |   if (data.code !== undefined) await textInputs.last().fill(data.code);
  222 |   if (data.categoryId !== undefined) await modal.locator('select').selectOption(String(data.categoryId));
  223 | }
  224 | 
  225 | export async function openProductEditor(page: Page, productName: string): Promise<Locator> {
  226 |   await productRow(page, productName).locator('button').first().click();
  227 |   const modal = page.locator('.fixed').filter({ hasText: /Editar Producto/i }).last();
  228 |   await expect(modal).toBeVisible();
  229 |   return modal;
  230 | }
  231 | 
  232 | export async function createProductViaUI(
  233 |   page: Page,
  234 |   product: { name: string; price: string; stock: string; minimumStock: string; code: string; categoryId: number },
  235 | ) {
  236 |   await page.locator('#btn-nuevo-producto').click();
  237 |   const modal = page.locator('.fixed').filter({ hasText: /Producto/i }).last();
  238 |   await expect(modal).toBeVisible();
  239 |   await fillProductModal(modal, product);
  240 |   await modal.getByRole('button', { name: /Guardar/i }).click();
  241 |   await expect(productRow(page, product.name)).toBeVisible({ timeout: 10_000 });
  242 | }
  243 | 
  244 | export async function addProductToCart(page: Page, product: Product) {
  245 |   const search = page.getByPlaceholder(/Escanear c.digo/i);
  246 |   await search.fill(product.nombre);
> 247 |   await expect(page.getByRole('button', { name: new RegExp(product.nombre, 'i') })).toBeVisible();
      |                                                                                     ^ Error: expect(locator).toBeVisible() failed
  248 |   await page.getByRole('button', { name: new RegExp(product.nombre, 'i') }).click();
  249 |   await expect(page.locator('table').filter({ hasText: product.nombre }).last()).toBeVisible();
  250 | }
  251 | 
```