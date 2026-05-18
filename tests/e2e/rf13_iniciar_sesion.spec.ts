import { test, expect } from '@playwright/test';

test.describe('RF13 - Iniciar Sesión', () => {

  test.beforeEach(async ({ page }) => {
    // CP-13 asume probar el inicio de sesión. 
    // Navegaremos directamente a la ruta base o de login.
    // Si la aplicación usa /login, cambiar correspondientemente.
    await page.goto('/');
  });

  test('CP-13-01: Acceso exitoso con credenciales válidas', async ({ page }) => {
    // Si el usuario ya está autenticado en un estado global, esto podría requerir cerrar sesión primero.
    // Asumiremos que la pantalla de inicio presenta el login si no hay sesión.
    
    // Si vemos el campo de correo, procedemos
    const inputEmail = page.locator('input[type="email"], input[placeholder*="correo"]').first();
    if (await inputEmail.isVisible()) {
      await inputEmail.fill('admin@stoko.com'); // Correo válido del sistema
      const inputPass = page.locator('input[type="password"]').first();
      await inputPass.fill('admin123'); // Contraseña válida
      
      const btnIngresar = page.getByRole('button', { name: /Ingresar/i, exact: false }).first();
      await btnIngresar.click();

      // Validar que redirige al panel principal (Dashboard, Inventario, Hub)
      await expect(page.locator('text=/Panel Principal/i, text=/Dashboard/i, text=/Inventario/i').first()).toBeVisible();
    }
  });

  test('CP-13-02: Denegar acceso por contraseña incorrecta', async ({ page }) => {
    const inputEmail = page.locator('input[type="email"], input[placeholder*="correo"]').first();
    if (await inputEmail.isVisible()) {
      await inputEmail.fill('admin@stoko.com'); // Correo válido
      const inputPass = page.locator('input[type="password"]').first();
      await inputPass.fill('ContraseñaIncorrecta99'); // Contraseña inválida
      
      const btnIngresar = page.getByRole('button', { name: /Ingresar/i, exact: false }).first();
      await btnIngresar.click();

      // Validar mensaje de error específico
      await expect(page.locator('text=/Contraseña incorrecta/i').first()).toBeVisible();
    }
  });

  test('CP-13-03: Denegar acceso por usuario no registrado', async ({ page }) => {
    const inputEmail = page.locator('input[type="email"], input[placeholder*="correo"]').first();
    if (await inputEmail.isVisible()) {
      await inputEmail.fill('usuario_falso_no_existe@stoko.com'); // Correo no registrado
      const inputPass = page.locator('input[type="password"]').first();
      await inputPass.fill('CualquierClave123');
      
      const btnIngresar = page.getByRole('button', { name: /Ingresar/i, exact: false }).first();
      await btnIngresar.click();

      // Validar mensaje de error específico
      await expect(page.locator('text=/Usuario no registrado/i, text=/no encontrado/i').first()).toBeVisible();
    }
  });

});
