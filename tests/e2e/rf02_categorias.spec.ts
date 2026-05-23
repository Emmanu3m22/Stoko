import { expect, test } from '@playwright/test';
import { createTestAdmin, goToCatalog, loginViaUI, unique } from './helpers';

test.describe('RF02 - Organizacion por categorias', () => {
  test('CP-02-01: Crea y modifica una categoria con nombre valido', async ({ page, request }) => {
    const admin = await createTestAdmin(request);
    const categoryName = unique('Categoria CP02');
    const updatedName = `${categoryName} Editada`;

    await loginViaUI(page, admin);
    await goToCatalog(page);
    await page.getByRole('button', { name: /Categor.as/i }).click();
    await page.getByRole('button', { name: /Nueva Categor.a/i }).click();

    const modal = page.locator('.fixed').filter({ hasText: /Nueva Categor.a/i }).last();
    await modal.getByPlaceholder(/Ej:/i).fill(categoryName);
    await modal.getByRole('button', { name: /Crear/i }).click();

    const row = page.locator('tbody tr').filter({ hasText: categoryName }).first();
    await expect(row).toBeVisible();

    await row.locator('button').first().click();
    const editModal = page.locator('.fixed').filter({ hasText: /Editar Categor.a/i }).last();
    await editModal.getByPlaceholder(/Ej:/i).fill(updatedName);
    await editModal.getByRole('button', { name: /Guardar/i }).click();

    await expect(page.locator('tbody tr').filter({ hasText: updatedName }).first()).toBeVisible();
  });

  test('CP-02-02: Rechaza una categoria con nombre vacio', async ({ page, request }) => {
    const admin = await createTestAdmin(request);

    await loginViaUI(page, admin);
    await goToCatalog(page);
    await page.getByRole('button', { name: /Categor.as/i }).click();
    await page.getByRole('button', { name: /Nueva Categor.a/i }).click();

    const modal = page.locator('.fixed').filter({ hasText: /Nueva Categor.a/i }).last();
    const input = modal.getByPlaceholder(/Ej:/i);
    await input.fill('');
    await modal.getByRole('button', { name: /Crear/i }).click();

    await expect(modal).toBeVisible();
    expect(await input.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  });
});
