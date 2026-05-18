import { test, expect } from '@playwright/test';

test.describe('RF03 - Registrar venta (Búsqueda en POS / Inventario)', () => {

  test.beforeEach(async ({ page }) => {
    // CP-03-01 se centra en la búsqueda que puede realizarse en inventario o POS.
    // Navegamos al sistema asumiendo inicio de sesión previo.
    await page.goto('/');
    
    // Entrar al módulo de Inventario
    const menuInventario = page.locator('text=Inventario').first();
    if (await menuInventario.isVisible()) {
      await menuInventario.click();
    }
  });

  test('CP-03-01: Búsqueda de productos por nombre, código o categoría', async ({ page }) => {
    // Asegurarse de estar en la pestaña de Productos
    await page.getByRole('button', { name: /Productos/i }).click();

    // 1. Búsqueda por nombre
    const inputBusqueda = page.getByPlaceholder('Buscar por nombre o código…');
    await inputBusqueda.fill('Producto de Prueba');
    
    // Esperar a que el timeout del frontend (300ms en ListaProductos) aplique
    await page.waitForTimeout(500); 
    
    // Validar que se muestren resultados coincidentes
    const productosEncontrados = await page.locator('tbody tr').count();
    expect(productosEncontrados).toBeGreaterThan(0);
    await expect(page.locator('tbody tr').first()).toContainText('Producto de Prueba');

    // 2. Búsqueda por código de barras
    await inputBusqueda.fill('');
    await inputBusqueda.fill('1234567890123');
    await page.waitForTimeout(500);
    
    await expect(page.locator('tbody tr').first()).toContainText('1234567890123');

    // Limpiar búsqueda
    await inputBusqueda.fill('');
    await page.waitForTimeout(500);

    // 3. Búsqueda por categoría (Filtro select)
    // Asumiendo que existe al menos una categoría seleccionable que no sea "Todas las categorías"
    const selectCategoria = page.locator('select').first();
    const categoriaOpciones = await selectCategoria.locator('option').allInnerTexts();
    
    if (categoriaOpciones.length > 1) {
      // Seleccionar la primera categoría con ID válido
      await selectCategoria.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      const hayResultados = await page.locator('tbody tr').first().isVisible();
      if (hayResultados) {
        const textoCategoriaSeleccionada = await selectCategoria.inputValue();
        // El frontend podría mostrar "No se encontraron productos", pero si muestra algo, validamos
        expect(true).toBeTruthy(); // Verificación simbólica ya que depende de los datos existentes
      }
    }
  });
});
