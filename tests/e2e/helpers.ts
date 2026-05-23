import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

export const API_URL = process.env.STOKO_API_URL ?? 'http://localhost:8000';
export const APP_URL = process.env.STOKO_BASE_URL ?? 'http://localhost:5173';
export const ADMIN = {
  email: process.env.STOKO_ADMIN_EMAIL ?? 'admin@stoko.com',
  password: process.env.STOKO_ADMIN_PASSWORD ?? 'admin1234',
};

export type Credentials = {
  email: string;
  password: string;
};

export type Session = Credentials & {
  token: string;
  userId: number;
  name: string;
  role: string;
};

export type Category = {
  id_categoria: number;
  nombre: string;
};

export type Product = {
  id_producto: number;
  nombre: string;
  codigo_barras: string;
  precio_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  id_categoria: number;
};

export const unique = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const todayIso = () => new Date().toISOString().slice(0, 10);

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function loginForToken(
  request: APIRequestContext,
  credentials: Credentials = ADMIN,
): Promise<Session> {
  const response = await request.post(`${API_URL}/api/v1/auth/login`, {
    form: {
      username: credentials.email,
      password: credentials.password,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return {
    email: credentials.email,
    password: credentials.password,
    token: body.access_token,
    userId: body.usuario_id,
    name: body.nombre,
    role: body.rol,
  };
}

export async function createTestAdmin(request: APIRequestContext): Promise<Session> {
  const seedAdmin = await loginForToken(request);
  const usersResponse = await request.get(`${API_URL}/api/v1/usuarios/`, {
    headers: authHeaders(seedAdmin.token),
  });
  expect(usersResponse.ok(), await usersResponse.text()).toBeTruthy();
  const users = await usersResponse.json();
  const adminRoleId = users.find(
    (user: { rol?: { nombre?: string; id_rol?: number } }) =>
      user.rol?.nombre?.toLowerCase() === 'administrador',
  )?.rol?.id_rol;
  expect(adminRoleId, 'No se encontro el rol administrador para crear usuarios E2E.').toBeTruthy();

  const email = `${unique('e2e-admin')}@example.com`;
  const password = 'E2eTest1234';
  const response = await request.post(`${API_URL}/api/v1/usuarios/`, {
    headers: authHeaders(seedAdmin.token),
    data: {
      nombre: `Admin ${email}`,
      email,
      password,
      id_rol: adminRoleId,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return loginForToken(request, { email, password });
}

export async function createCategory(
  request: APIRequestContext,
  token: string,
  name = unique('Categoria E2E'),
): Promise<Category> {
  const response = await request.post(`${API_URL}/api/v1/categorias/`, {
    headers: authHeaders(token),
    data: { nombre: name },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

export async function createProduct(
  request: APIRequestContext,
  token: string,
  overrides: Partial<Product> = {},
): Promise<Product> {
  const categoryId = overrides.id_categoria ?? (await createCategory(request, token)).id_categoria;
  const name = overrides.nombre ?? unique('Producto E2E');
  const code = overrides.codigo_barras ?? unique('CODE');
  const response = await request.post(`${API_URL}/api/v1/productos/`, {
    headers: authHeaders(token),
    data: {
      nombre: name,
      codigo_barras: code,
      precio_unitario: overrides.precio_unitario ?? 100,
      stock_actual: overrides.stock_actual ?? 10,
      stock_minimo: overrides.stock_minimo ?? 2,
      id_categoria: categoryId,
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

export async function getProduct(request: APIRequestContext, token: string, productId: number): Promise<Product> {
  const response = await request.get(`${API_URL}/api/v1/productos/${productId}`, {
    headers: authHeaders(token),
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

export async function ensureOpenShift(request: APIRequestContext, token: string) {
  const opened = await request.post(`${API_URL}/api/v1/cortes/`, {
    headers: authHeaders(token),
  });
  if (opened.status() === 201) return opened.json();

  const active = await request.get(`${API_URL}/api/v1/cortes/activo`, {
    headers: authHeaders(token),
  });
  expect(active.ok(), `${await opened.text()}\n${await active.text()}`).toBeTruthy();
  return active.json();
}

export async function createSale(
  request: APIRequestContext,
  token: string,
  productId: number,
  quantity = 1,
) {
  const response = await request.post(`${API_URL}/api/v1/ventas/`, {
    headers: authHeaders(token),
    data: {
      metodo_pago: 'efectivo',
      items: [{ id_producto: productId, cantidad: quantity }],
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

export async function loginViaUI(page: Page, credentials: Credentials) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(APP_URL);
  await expect(page.locator('#email')).toBeVisible();
  await page.locator('#email').fill(credentials.email);
  await page.locator('#password').fill(credentials.password);
  await page.locator('#btn-iniciar-sesion').click();
  await expect(page.getByRole('heading', { name: /Bienvenido a STOKO/i })).toBeVisible({
    timeout: 15_000,
  });
}

export async function navigateTo(page: Page, menuName: RegExp) {
  await page.locator('aside').getByRole('button', { name: menuName }).click();
}

export async function goToCatalog(page: Page) {
  await navigateTo(page, /Cat.logo/i);
  await expect(page.locator('#btn-nuevo-producto')).toBeVisible();
}

export async function goToReports(page: Page) {
  await navigateTo(page, /Reportes/i);
  await expect(page.getByRole('heading', { name: /Reportes y Auditor.as/i })).toBeVisible();
}

export function productRow(page: Page, productName: string): Locator {
  return page.locator('tbody tr').filter({ hasText: productName }).first();
}

export async function fillProductModal(
  modal: Locator,
  data: {
    name?: string;
    price?: string;
    stock?: string;
    minimumStock?: string;
    code?: string;
    categoryId?: number;
  },
) {
  const textInputs = modal.locator('input[type="text"]');
  const numberInputs = modal.locator('input[type="number"]');

  if (data.name !== undefined) await textInputs.first().fill(data.name);
  if (data.price !== undefined) await numberInputs.nth(0).fill(data.price);
  if (data.stock !== undefined) await numberInputs.nth(1).fill(data.stock);
  if (data.minimumStock !== undefined) await numberInputs.nth(2).fill(data.minimumStock);
  if (data.code !== undefined) await textInputs.last().fill(data.code);
  if (data.categoryId !== undefined) await modal.locator('select').selectOption(String(data.categoryId));
}

export async function openProductEditor(page: Page, productName: string): Promise<Locator> {
  await productRow(page, productName).locator('button').first().click();
  const modal = page.locator('.fixed').filter({ hasText: /Editar Producto/i }).last();
  await expect(modal).toBeVisible();
  return modal;
}

export async function createProductViaUI(
  page: Page,
  product: { name: string; price: string; stock: string; minimumStock: string; code: string; categoryId: number },
) {
  await page.locator('#btn-nuevo-producto').click();
  const modal = page.locator('.fixed').filter({ hasText: /Producto/i }).last();
  await expect(modal).toBeVisible();
  await fillProductModal(modal, product);
  await modal.getByRole('button', { name: /Guardar/i }).click();
  await expect(productRow(page, product.name)).toBeVisible({ timeout: 10_000 });
}

export async function addProductToCart(page: Page, product: Product) {
  const search = page.getByPlaceholder(/Escanear c.digo/i);
  await search.fill(product.nombre);
  await expect(page.getByRole('button', { name: new RegExp(product.nombre, 'i') })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(product.nombre, 'i') }).click();
  await expect(page.locator('table').filter({ hasText: product.nombre }).last()).toBeVisible();
}
