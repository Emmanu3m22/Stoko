import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

globalThis.window = {
  dispatchEvent: () => {},
};

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: {
    onLine: true,
  },
});

const {
  contarVentasPendientes,
  guardarVentaPendiente,
  listarVentasPendientes,
  sincronizarVentasPendientes,
} = await import('../src/lib/ventasOffline.js');

const payload = {
  metodo_pago: 'efectivo',
  items: [
    { id_producto: 1, cantidad: 2 },
  ],
};

const venta = await guardarVentaPendiente({
  payload,
  total: 120,
  items: 2,
  usuarioId: 1,
});

assert.equal(await contarVentasPendientes(), 1);
assert.equal((await listarVentasPendientes())[0].id, venta.id);

let solicitudes = 0;
globalThis.fetch = async (url, options) => {
  solicitudes += 1;
  assert.equal(url, 'http://localhost:8000/api/v1/ventas/');
  assert.equal(options.method, 'POST');
  assert.equal(options.headers.get('Authorization'), 'Bearer token-prueba');
  assert.deepEqual(JSON.parse(options.body), payload);

  return new Response(JSON.stringify({ id_venta: 10, total: 120 }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

const resumen = await sincronizarVentasPendientes({
  token: 'token-prueba',
  usuario: { id: 1, nombre: 'Admin', rol: 'Administrador' },
});

assert.equal(solicitudes, 1);
assert.equal(resumen.sincronizadas, 1);
assert.equal(resumen.pendientes, 0);
assert.equal(await contarVentasPendientes(), 0);

await guardarVentaPendiente({
  payload,
  total: 120,
  items: 2,
  usuarioId: 1,
});

await guardarVentaPendiente({
  payload: {
    metodo_pago: 'efectivo',
    items: [
      { id_producto: 2, cantidad: 1 },
    ],
  },
  total: 50,
  items: 1,
  usuarioId: 2,
});

navigator.onLine = false;
globalThis.fetch = async () => {
  throw new Error('No debe intentar sincronizar offline');
};

const resumenOffline = await sincronizarVentasPendientes({
  token: 'token-prueba',
  usuario: { id: 1, nombre: 'Admin', rol: 'Administrador' },
});

assert.equal(resumenOffline.sincronizadas, 0);
assert.equal(resumenOffline.pendientes, 1);
assert.equal(await contarVentasPendientes({ usuarioId: 1 }), 1);
assert.equal(await contarVentasPendientes({ usuarioId: 2 }), 1);

navigator.onLine = true;
solicitudes = 0;
globalThis.fetch = async () => {
  solicitudes += 1;
  return new Response(JSON.stringify({ id_venta: 11, total: 120 }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

const resumenUsuario = await sincronizarVentasPendientes({
  token: 'token-prueba',
  usuario: { id: 1, nombre: 'Admin', rol: 'Administrador' },
});

assert.equal(solicitudes, 1);
assert.equal(resumenUsuario.sincronizadas, 1);
assert.equal(await contarVentasPendientes({ usuarioId: 1 }), 0);
assert.equal(await contarVentasPendientes({ usuarioId: 2 }), 1);

console.log('Pruebas de ventas offline completadas correctamente.');
