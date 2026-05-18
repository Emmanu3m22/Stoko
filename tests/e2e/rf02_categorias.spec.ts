import { test, expect } from '@playwright/test';

test.describe('RF02 - Organización por categorías', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    const menuInventario = page.locator('text=Inventario').first();
    if (await menuInventario.isVisible()) {
      await menuInventario.click();
    }
  });

  test('CP-02-01: Crear y modificar categoría con nombre válido', async ({ page }) => {
    // 1. Acceder al módulo "Catálogo" y seleccionar "Categorías"
    await page.getByRole('button', { name: /Categorías/i }).click();

    // Crear categoría
    await page.getByRole('button', { name: /Nueva Categoría/i }).click();
    
    const nombreCategoria = `Cat Test ${Date.now()}`;
    await page.getByPlaceholder('Ej: Electrónica, Calzado...').fill(nombreCategoria);
    await page.getByRole('button', { name: 'Crear' }).click();

    // Validar que se guarda y organiza en el listado
    await expect(page.locator('table', { hasText: nombreCategoria })).toBeVisible();

    // Modificar categoría
    const filaCat = page.locator('tr', { hasText: nombreCategoria });
    await filaCat.locator('button').first().click(); // Asume que el primer botón es editar
    
    const nombreModificado = `${nombreCategoria} Mod`;
    await page.getByPlaceholder('Ej: Electrónica, Calzado...').fill(nombreModificado);
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Validar el cambio
    await expect(page.locator('table', { hasText: nombreModificado })).toBeVisible();
  });

  test('CP-02-02: No permite crear categoría con nombre inválido', async ({ page }) => {
    await page.getByRole('button', { name: /Categorías/i }).click();

    await page.getByRole('button', { name: /Nueva Categoría/i }).click();
    
    // Intenta enviar con nombre vacío (inválido por 'required' de HTML5)
    await page.getByPlaceholder('Ej: Electrónica, Calzado...').fill('');
    
    // Al dar clic en el botón de tipo 'submit' dentro de un form con 'required'
    // el navegador bloquea el envío, y el modal se mantiene abierto.
    await page.getByRole('button', { name: 'Crear' }).click();

    // Verificar que el modal sigue visible y muestra un error o estado de validación
    const modalVisible = await page.getByRole('heading', { name: 'Nueva Categoría' }).isVisible();
    expect(modalVisible).toBeTruthy();
  });
});
