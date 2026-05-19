# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rf13_iniciar_sesion.spec.ts >> RF13 - Iniciar Sesión >> CP-13-03: Denegar acceso por usuario no registrado
- Location: e2e\rf13_iniciar_sesion.spec.ts:46:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/Usuario no registrado/i, text=/no encontrado/i').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=/Usuario no registrado/i, text=/no encontrado/i').first()

```

```yaml
- text: S STOKO
- heading "Control total de tu inventario." [level=1]
- paragraph: Gestión de productos, ventas y reportes en un solo lugar. Diseñado para la empresa moderna.
- paragraph: Uptime
- paragraph: 99.9%
- paragraph: Transacciones
- paragraph: < 200 ms
- paragraph: Almacenamiento
- paragraph: Local
- paragraph: Portal Operativo
- heading "Bienvenido de nuevo" [level=2]
- paragraph: Ingresa tus credenciales para acceder al sistema.
- text: Correo electrónico
- textbox "Correo electrónico":
  - /placeholder: admin@stoko.com
  - text: usuario_falso_no_existe@stoko.com
- text: Contraseña
- button "¿Olvidaste tu contraseña?"
- textbox "Contraseña":
  - /placeholder: ••••••••
  - text: CualquierClave123
- button "Mostrar contraseña":
  - img
- checkbox "Mantener sesión iniciada por 30 días"
- text: Mantener sesión iniciada por 30 días
- img
- text: Usuario no registrado
- button "Iniciar Sesión":
  - text: Iniciar Sesión
  - img
- text: o continúa con
- button "Usar credenciales de demostración":
  - img
  - text: Usar credenciales de demostración
- paragraph:
  - text: ¿No tienes cuenta?
  - button "Solicitar acceso al administrador"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('RF13 - Iniciar Sesión', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // CP-13 asume probar el inicio de sesión. 
  7  |     // Navegaremos directamente a la ruta base o de login.
  8  |     // Si la aplicación usa /login, cambiar correspondientemente.
  9  |     await page.goto('/');
  10 |   });
  11 | 
  12 |   test('CP-13-01: Acceso exitoso con credenciales válidas', async ({ page }) => {
  13 |     // Si el usuario ya está autenticado en un estado global, esto podría requerir cerrar sesión primero.
  14 |     // Asumiremos que la pantalla de inicio presenta el login si no hay sesión.
  15 |     
  16 |     // Si vemos el campo de correo, procedemos
  17 |     const inputEmail = page.locator('#email').first();
  18 |     if (await inputEmail.isVisible()) {
  19 |       await inputEmail.fill('admin@stoko.com'); // Correo válido del sistema
  20 |       const inputPass = page.locator('#password').first();
  21 |       await inputPass.fill('admin123'); // Contraseña válida
  22 |       
  23 |       const btnIngresar = page.locator('#btn-iniciar-sesion');
  24 |       await btnIngresar.click();
  25 | 
  26 |       // Validar que redirige al panel principal (Dashboard, Inventario, Hub)
  27 |       await expect(page.locator('text=/Panel Principal/i, text=/Dashboard/i, text=/Catálogo/i').first()).toBeVisible();
  28 |     }
  29 |   });
  30 | 
  31 |   test('CP-13-02: Denegar acceso por contraseña incorrecta', async ({ page }) => {
  32 |     const inputEmail = page.locator('#email').first();
  33 |     if (await inputEmail.isVisible()) {
  34 |       await inputEmail.fill('admin@stoko.com'); // Correo válido
  35 |       const inputPass = page.locator('#password').first();
  36 |       await inputPass.fill('ContraseñaIncorrecta99'); // Contraseña inválida
  37 |       
  38 |       const btnIngresar = page.locator('#btn-iniciar-sesion');
  39 |       await btnIngresar.click();
  40 | 
  41 |       // Validar mensaje de error específico
  42 |       await expect(page.locator('text=/Contraseña incorrecta/i').first()).toBeVisible();
  43 |     }
  44 |   });
  45 | 
  46 |   test('CP-13-03: Denegar acceso por usuario no registrado', async ({ page }) => {
  47 |     const inputEmail = page.locator('#email').first();
  48 |     if (await inputEmail.isVisible()) {
  49 |       await inputEmail.fill('usuario_falso_no_existe@stoko.com'); // Correo no registrado
  50 |       const inputPass = page.locator('#password').first();
  51 |       await inputPass.fill('CualquierClave123');
  52 |       
  53 |       const btnIngresar = page.locator('#btn-iniciar-sesion');
  54 |       await btnIngresar.click();
  55 | 
  56 |       // Validar mensaje de error específico
> 57 |       await expect(page.locator('text=/Usuario no registrado/i, text=/no encontrado/i').first()).toBeVisible();
     |                                                                                                  ^ Error: expect(locator).toBeVisible() failed
  58 |     }
  59 |   });
  60 | 
  61 | });
  62 | 
```