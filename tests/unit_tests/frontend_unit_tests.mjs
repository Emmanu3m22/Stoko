import assert from 'node:assert/strict';
import test from 'node:test';

const storage = new Map();

globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

let eventosSesionExpirada = 0;
globalThis.window = {
  dispatchEvent: (event) => {
    if (event.type === 'stoko:sesion-expirada') eventosSesionExpirada += 1;
  },
};

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { onLine: true },
});

delete globalThis.indexedDB;

const auth = await import('../../frontend/src/auth.js');
const api = await import('../../frontend/src/lib/api.js');
const ventasOffline = await import('../../frontend/src/lib/ventasOffline.js');

const segmento = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = (payload) => `${segmento({ alg: 'none', typ: 'JWT' })}.${segmento(payload)}.firma`;
const tokenVigente = () => token({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
const tokenVencido = () => token({ sub: '1', exp: Math.floor(Date.now() / 1000) - 1 });
const payloadVenta = () => ({
  metodo_pago: 'efectivo',
  items: [{ id_producto: 1, cantidad: 2 }],
});

test.beforeEach(() => {
  storage.clear();
  eventosSesionExpirada = 0;
  navigator.onLine = true;
  delete globalThis.fetch;
});

test('TC-UNI-011 decodificarJwt retorna el payload de un JWT valido', () => {
  assert.equal(auth.decodificarJwt(tokenVigente()).sub, '1');
});

test('TC-UNI-012 decodificarJwt retorna null con token invalido', () => {
  assert.equal(auth.decodificarJwt('no-es-un-jwt'), null);
});

test('TC-UNI-013 tokenExpirado retorna false para token vigente', () => {
  assert.equal(auth.tokenExpirado(tokenVigente()), false);
});

test('TC-UNI-014 tokenExpirado retorna true para token expirado', () => {
  assert.equal(auth.tokenExpirado(tokenVencido()), true);
});

test('TC-UNI-015 esAdministrador retorna true para Administrador', () => {
  assert.equal(auth.esAdministrador({ rol: 'Administrador' }), true);
});

test('TC-UNI-016 esAdministrador retorna false para cajero', () => {
  assert.equal(auth.esAdministrador({ rol: 'cajero' }), false);
});

test('TC-UNI-017 guardarSesion persiste y retorna una sesion vigente', () => {
  const usuario = { id: 1, nombre: 'Admin', rol: 'Administrador' };
  const sesion = auth.guardarSesion(tokenVigente(), usuario);

  assert.deepEqual(sesion.usuario, usuario);
  assert.equal(JSON.parse(localStorage.getItem(auth.SESSION_KEY)).usuario.nombre, 'Admin');
});

test('TC-UNI-018 guardarSesion elimina localStorage y retorna null con token expirado', () => {
  localStorage.setItem(auth.SESSION_KEY, JSON.stringify({ token: 'previo' }));

  const sesion = auth.guardarSesion(tokenVencido(), { id: 1, nombre: 'Admin' });

  assert.equal(sesion, null);
  assert.equal(localStorage.getItem(auth.SESSION_KEY), null);
});

test('TC-UNI-019 obtenerSesion retorna sesion guardada con token vigente', () => {
  const tokenActual = tokenVigente();
  auth.guardarSesion(tokenActual, { id: 1, nombre: 'Admin', rol: 'Administrador' });

  const sesion = auth.obtenerSesion();

  assert.equal(sesion.token, tokenActual);
  assert.equal(sesion.usuario.nombre, 'Admin');
});

test('TC-UNI-020 cerrarSesion elimina stoko_sesion', () => {
  auth.guardarSesion(tokenVigente(), { id: 1, nombre: 'Admin' });

  auth.cerrarSesion();

  assert.equal(localStorage.getItem(auth.SESSION_KEY), null);
});

test('TC-UNI-044 normalizarRol recorta espacios y convierte a minusculas', () => {
  assert.equal(auth.normalizarRol(' ADMINISTRADOR '), 'administrador');
});

test('TC-UNI-021 mensajeErrorApi retorna mensaje de red', () => {
  assert.equal(api.mensajeErrorApi({ code: 'NETWORK_ERROR' }), api.MENSAJE_ERROR_RED);
});

test('TC-UNI-022 mensajeErrorApi retorna fallback con error null', () => {
  assert.equal(api.mensajeErrorApi(null), api.MENSAJE_ERROR_GENERAL);
});

test('TC-UNI-023 leerRespuestaApi concatena mensajes de validacion 422', async () => {
  const response = new Response(JSON.stringify({
    detail: [
      { msg: 'El email no es valido' },
      { msg: 'La contrasena es obligatoria' },
    ],
  }), {
    status: 422,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(
    () => api.leerRespuestaApi(response),
    /El email no es valido La contrasena es obligatoria/,
  );
});

test('TC-UNI-024 leerRespuestaApi usa mensaje amigable en error 500 texto plano', async () => {
  const response = new Response('Error interno', { status: 500 });

  await assert.rejects(
    () => api.leerRespuestaApi(response),
    /El servidor encontr/,
  );
});

test('TC-UNI-025 iniciarSesion convierte TypeError de fetch en ApiError NETWORK_ERROR', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('sin red');
  };

  await assert.rejects(
    () => api.iniciarSesion('admin@stoko.com', 'admin1234'),
    (error) => {
      assert.equal(error instanceof api.ApiError, true);
      assert.equal(error.code, 'NETWORK_ERROR');
      assert.equal(error.message, api.MENSAJE_ERROR_RED);
      return true;
    },
  );
});

test('TC-UNI-026 apiFetch dispara evento de sesion expirada con status 401', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Token invalido' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await api.apiFetch('/api/v1/productos/');

  assert.equal(response.status, 401);
  assert.equal(eventosSesionExpirada, 1);
});

test('TC-UNI-027 guardarVentaPendiente usa localStorage sin IndexedDB', async () => {
  const venta = await ventasOffline.guardarVentaPendiente({
    payload: payloadVenta(),
    total: 120,
    items: 2,
    usuarioId: 1,
  });

  assert.equal(typeof venta.id, 'string');
  assert.equal(venta.estado, 'pendiente');
  assert.equal(typeof venta.creadaEn, 'string');
  assert.equal(await ventasOffline.contarVentasPendientes(), 1);
});

test('TC-UNI-028 listarVentasPendientes filtra por usuarioId', async () => {
  await ventasOffline.guardarVentaPendiente({ payload: payloadVenta(), total: 120, items: 2, usuarioId: 1 });
  await ventasOffline.guardarVentaPendiente({ payload: payloadVenta(), total: 80, items: 1, usuarioId: 2 });

  const ventas = await ventasOffline.listarVentasPendientes({ usuarioId: 1 });

  assert.equal(ventas.length, 1);
  assert.equal(ventas[0].usuarioId, 1);
});

test('TC-UNI-029 contarVentasPendientes retorna numero de ventas guardadas', async () => {
  await ventasOffline.guardarVentaPendiente({ payload: payloadVenta(), total: 120, items: 2, usuarioId: 1 });

  assert.equal(await ventasOffline.contarVentasPendientes(), 1);
});

test('TC-UNI-030 sincronizarVentasPendientes sincroniza y elimina venta pendiente', async () => {
  await ventasOffline.guardarVentaPendiente({ payload: payloadVenta(), total: 120, items: 2, usuarioId: 1 });
  let solicitudes = 0;
  globalThis.fetch = async () => {
    solicitudes += 1;
    return new Response(JSON.stringify({ id_venta: 10, total: 120 }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const resumen = await ventasOffline.sincronizarVentasPendientes({
    token: 'token-prueba',
    usuario: { id: 1 },
  });

  assert.equal(solicitudes, 1);
  assert.equal(resumen.sincronizadas, 1);
  assert.equal(resumen.pendientes, 0);
  assert.equal(await ventasOffline.contarVentasPendientes(), 0);
});

test('TC-UNI-031 sincronizarVentasPendientes offline no realiza HTTP', async () => {
  await ventasOffline.guardarVentaPendiente({ payload: payloadVenta(), total: 120, items: 2, usuarioId: 1 });
  navigator.onLine = false;
  let solicitudes = 0;
  globalThis.fetch = async () => {
    solicitudes += 1;
    return new Response('{}', { status: 201 });
  };

  const resumen = await ventasOffline.sincronizarVentasPendientes({
    token: 'token-prueba',
    usuario: { id: 1 },
  });

  assert.equal(solicitudes, 0);
  assert.equal(resumen.sincronizadas, 0);
  assert.equal(resumen.pendientes, 1);
});

test('TC-UNI-032 eliminarVentaPendiente borra la venta del store', async () => {
  const venta = await ventasOffline.guardarVentaPendiente({
    payload: payloadVenta(),
    total: 120,
    items: 2,
    usuarioId: 1,
  });

  await ventasOffline.eliminarVentaPendiente(venta.id);

  assert.equal(await ventasOffline.contarVentasPendientes(), 0);
});
