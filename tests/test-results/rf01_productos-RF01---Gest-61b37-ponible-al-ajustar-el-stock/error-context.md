# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf01_productos.spec.ts >> RF01 - Gestion de productos >> CP-01-02: Actualiza la cantidad disponible al ajustar el stock
- Location: rf01_productos.spec.ts:40:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('tbody tr').filter({ hasText: 'Producto Sync-1779508633138-95vii' }).first().locator('td').nth(3)
Expected substring: "15"
Received string:    "30"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('tbody tr').filter({ hasText: 'Producto Sync-1779508633138-95vii' }).first().locator('td').nth(3)
    14 × locator resolved to <td class="py-4 px-6">…</td>
       - unexpected value "30"

```

```yaml
- cell "30"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import {
  3  |   createCategory,
  4  |   createProduct,
  5  |   createProductViaUI,
  6  |   createTestAdmin,
  7  |   fillProductModal,
  8  |   getProduct,
  9  |   goToCatalog,
  10 |   loginViaUI,
  11 |   openProductEditor,
  12 |   productRow,
  13 |   unique,
  14 | } from './helpers';
  15 | 
  16 | test.describe('RF01 - Gestion de productos', () => {
  17 |   test('CP-01-01: Registra y modifica un producto con datos validos', async ({ page, request }) => {
  18 |     const admin = await createTestAdmin(request);
  19 |     const category = await createCategory(request, admin.token);
  20 |     const productName = unique('Producto CP01');
  21 | 
  22 |     await loginViaUI(page, admin);
  23 |     await goToCatalog(page);
  24 |     await createProductViaUI(page, {
  25 |       name: productName,
  26 |       price: '500',
  27 |       stock: '20',
  28 |       minimumStock: '5',
  29 |       code: unique('CP01'),
  30 |       categoryId: category.id_categoria,
  31 |     });
  32 | 
  33 |     const modal = await openProductEditor(page, productName);
  34 |     await fillProductModal(modal, { price: '750', categoryId: category.id_categoria });
  35 |     await modal.getByRole('button', { name: /Actualizar/i }).click();
  36 | 
  37 |     await expect(productRow(page, productName)).toContainText('$750.00');
  38 |   });
  39 | 
  40 |   test('CP-01-02: Actualiza la cantidad disponible al ajustar el stock', async ({ page, request }) => {
  41 |     const admin = await createTestAdmin(request);
  42 |     const category = await createCategory(request, admin.token);
  43 |     const product = await createProduct(request, admin.token, {
  44 |       id_categoria: category.id_categoria,
  45 |       nombre: unique('Producto Sync'),
  46 |       stock_actual: 30,
  47 |       stock_minimo: 5,
  48 |     });
  49 | 
  50 |     await loginViaUI(page, admin);
  51 |     await goToCatalog(page);
  52 | 
  53 |     const modal = await openProductEditor(page, product.nombre);
  54 |     await fillProductModal(modal, { stock: '15' });
  55 |     await modal.getByRole('button', { name: /Actualizar/i }).click();
  56 | 
> 57 |     await expect(productRow(page, product.nombre).locator('td').nth(3)).toContainText('15');
     |                                                                         ^ Error: expect(locator).toContainText(expected) failed
  58 |     const updated = await getProduct(request, admin.token, product.id_producto);
  59 |     expect(updated.stock_actual).toBe(15);
  60 |   });
  61 | 
  62 |   test('CP-01-03: Muestra alerta cuando el stock baja del minimo', async ({ page, request }) => {
  63 |     const admin = await createTestAdmin(request);
  64 |     const category = await createCategory(request, admin.token);
  65 |     const product = await createProduct(request, admin.token, {
  66 |       id_categoria: category.id_categoria,
  67 |       nombre: unique('Producto Alerta'),
  68 |       stock_actual: 20,
  69 |       stock_minimo: 10,
  70 |     });
  71 | 
  72 |     await loginViaUI(page, admin);
  73 |     await goToCatalog(page);
  74 | 
  75 |     const modal = await openProductEditor(page, product.nombre);
  76 |     await fillProductModal(modal, { stock: '9' });
  77 |     await modal.getByRole('button', { name: /Actualizar/i }).click();
  78 | 
  79 |     await expect(productRow(page, product.nombre).locator('span.animate-pulse')).toBeVisible();
  80 |     await page.getByRole('button', { name: /Dashboard/i }).click();
  81 |     await expect(page.getByText(/Alerta de inventario/i)).toBeVisible();
  82 |     await expect(productRow(page, product.nombre)).toBeVisible();
  83 |   });
  84 | });
  85 | 
```