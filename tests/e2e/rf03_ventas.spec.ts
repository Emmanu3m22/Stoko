import { expect, test } from '@playwright/test';
import {
  createCategory,
  createProduct,
  createTestAdmin,
  goToCatalog,
  loginViaUI,
  productRow,
  unique,
} from './helpers';

test.describe('RF03 - Busqueda de productos', () => {
  test('CP-03-01: Busca productos por nombre, codigo y categoria', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const category = await createCategory(request, admin.token, unique('Categoria Busqueda'));
    const product = await createProduct(request, admin.token, {
      id_categoria: category.id_categoria,
      nombre: unique('Producto Busqueda'),
      codigo_barras: unique('BUSQ'),
      stock_actual: 12,
    });

    await loginViaUI(page, admin);
    await goToCatalog(page);

    const search = page.getByPlaceholder(/Buscar por nombre o c.digo/i);
    await search.fill(product.nombre);
    await expect(productRow(page, product.nombre)).toBeVisible();

    await search.fill(product.codigo_barras);
    await expect(productRow(page, product.nombre)).toBeVisible();

    await search.fill('');
    await page.locator('select').first().selectOption(String(category.id_categoria));
    await expect(productRow(page, product.nombre)).toBeVisible();
  });
});
