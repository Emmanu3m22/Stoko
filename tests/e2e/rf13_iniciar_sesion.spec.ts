import { expect, test } from '@playwright/test';
import { ADMIN, APP_URL, loginViaUI } from './helpers';

test.describe('RF13 - Iniciar sesion', () => {
  test('CP-13-01: Acceso exitoso con credenciales validas', async ({ page }) => {
    await loginViaUI(page, ADMIN);

    await expect(page.getByRole('heading', { name: /Bienvenido a STOKO/i })).toBeVisible();
    await expect(page.getByText(/API conectada/i)).toBeVisible();
  });

  test('CP-13-02: Deniega acceso por contrasena incorrecta', async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill('PasswordIncorrecta123');
    await page.locator('#btn-iniciar-sesion').click();

    await expect(page.getByText(/Contrase.a incorrecta/i)).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test('CP-13-03: Deniega acceso por usuario no registrado', async ({ page }) => {
    await page.goto(APP_URL);
    await page.locator('#email').fill(`no-existe-${Date.now()}@stoko.test`);
    await page.locator('#password').fill('CualquierClave123');
    await page.locator('#btn-iniciar-sesion').click();

    await expect(page.getByText(/Usuario no registrado/i)).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });
});
