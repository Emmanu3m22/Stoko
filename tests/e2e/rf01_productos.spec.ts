import { expect, test } from '@playwright/test';
import {
  createCategory,
  createProduct,
  createProductViaUI,
  createTestAdmin,
  fillProductModal,
  getProduct,
  goToCatalog,
  loginViaUI,
  openProductEditor,
  productRow,
  unique,
} from './helpers';

test.describe('RF01 - Gestion de productos', () => {
  test('CP-01-01: Registra y modifica un producto con datos validos', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const category = await createCategory(request, admin.token);
    const productName = unique('Producto CP01');

    await loginViaUI(page, admin);
    await goToCatalog(page);
    await createProductViaUI(page, {
      name: productName,
      price: '500',
      stock: '20',
      minimumStock: '5',
      code: unique('CP01'),
      categoryId: category.id_categoria,
    });

    const modal = await openProductEditor(page, productName);
    await fillProductModal(modal, { price: '750', categoryId: category.id_categoria });
    await modal.getByRole('button', { name: /Actualizar/i }).click();

    await expect(productRow(page, productName)).toContainText('$750.00');
  });

  test('CP-01-02: Actualiza la cantidad disponible al ajustar el stock', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const category = await createCategory(request, admin.token);
    const product = await createProduct(request, admin.token, {
      id_categoria: category.id_categoria,
      nombre: unique('Producto Sync'),
      stock_actual: 30,
      stock_minimo: 5,
    });

    await loginViaUI(page, admin);
    await goToCatalog(page);

    const modal = await openProductEditor(page, product.nombre);
    await fillProductModal(modal, { stock: '15' });
    await modal.getByRole('button', { name: /Actualizar/i }).click();

    await expect(productRow(page, product.nombre).locator('td').nth(3)).toContainText('15');
    const updated = await getProduct(request, admin.token, product.id_producto);
    expect(updated.stock_actual).toBe(15);
  });

  test('CP-01-03: Muestra alerta cuando el stock baja del minimo', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const category = await createCategory(request, admin.token);
    const product = await createProduct(request, admin.token, {
      id_categoria: category.id_categoria,
      nombre: unique('Producto Alerta'),
      stock_actual: 20,
      stock_minimo: 10,
    });

    await loginViaUI(page, admin);
    await goToCatalog(page);

    const modal = await openProductEditor(page, product.nombre);
    await fillProductModal(modal, { stock: '9' });
    await modal.getByRole('button', { name: /Actualizar/i }).click();

    await expect(productRow(page, product.nombre).locator('span.animate-pulse')).toBeVisible();
    await page.getByRole('button', { name: /Dashboard/i }).click();
    await expect(page.getByText(/Alerta de inventario/i)).toBeVisible();
    await expect(productRow(page, product.nombre)).toBeVisible();
  });
});
