import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  createProduct,
  createTestAdmin,
  ensureOpenShift,
  getProduct,
  goToReports,
  loginViaUI,
  unique,
} from './helpers';

async function openMermas(page: Page) {
  await goToReports(page);
  await page.getByRole('button', { name: /Registro de Mermas/i }).click();
  await expect(page.getByRole('heading', { name: /Nueva Merma/i })).toBeVisible();
}

test.describe('RF10 - Registrar mermas', () => {
  test('CP-10-01: Registra una merma valida y descuenta stock', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Merma'),
      stock_actual: 8,
    });
    await ensureOpenShift(request, admin.token);

    await loginViaUI(page, admin);
    await openMermas(page);

    await page.getByPlaceholder(/Buscar por nombre o c.digo/i).fill(product.nombre);
    await page.getByRole('button', { name: new RegExp(product.nombre, 'i') }).click();
    await page.getByPlaceholder(/Ej. 5/i).fill('2');
    await page.getByPlaceholder(/Describa el motivo/i).fill('Producto danado en prueba E2E');
    await page.getByRole('button', { name: /Registrar Merma/i }).click();

    await expect(page.getByText(/Merma registrada/i)).toBeVisible();
    await expect(page.locator('tbody tr').filter({ hasText: product.nombre }).first()).toBeVisible();
    const updated = await getProduct(request, admin.token, product.id_producto);
    expect(updated.stock_actual).toBe(6);
  });

  test('CP-10-02: Rechaza datos invalidos al registrar merma', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const product = await createProduct(request, admin.token, {
      nombre: unique('Producto Merma Invalida'),
      stock_actual: 8,
    });
    await ensureOpenShift(request, admin.token);

    await loginViaUI(page, admin);
    await openMermas(page);

    await page.getByPlaceholder(/Buscar por nombre o c.digo/i).fill(product.nombre);
    await page.getByRole('button', { name: new RegExp(product.nombre, 'i') }).click();
    const quantity = page.getByPlaceholder(/Ej. 5/i);
    await quantity.fill('-1');
    await page.getByPlaceholder(/Describa el motivo/i).fill('Dato invalido de prueba');

    expect(await quantity.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
    await page.getByRole('button', { name: /Registrar Merma/i }).click();
    await expect(page.getByRole('heading', { name: /Nueva Merma/i })).toBeVisible();

    const unchanged = await getProduct(request, admin.token, product.id_producto);
    expect(unchanged.stock_actual).toBe(8);
  });
});
