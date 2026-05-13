import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

let eventosSesionExpirada = 0;
globalThis.window = {
  dispatchEvent: () => {
    eventosSesionExpirada += 1;
  },
};

const {
  ApiError,
  MENSAJE_ERROR_RED,
  apiFetch,
  iniciarSesion,
  leerRespuestaApi,
  mensajeErrorApi,
} = await import('../src/lib/api.js');

globalThis.fetch = async () => {
  throw new TypeError('Failed to fetch');
};

await assert.rejects(
  () => iniciarSesion('admin@stoko.com', 'admin1234'),
  (error) => {
    assert.equal(error instanceof ApiError, true);
    assert.equal(error.code, 'NETWORK_ERROR');
    assert.equal(error.message, MENSAJE_ERROR_RED);
    assert.equal(mensajeErrorApi(error), MENSAJE_ERROR_RED);
    return true;
  },
);

const respuestaValidacion = new Response(JSON.stringify({
  detail: [
    { msg: 'El email no es válido' },
    { msg: 'La contraseña es obligatoria' },
  ],
}), {
  status: 422,
  headers: { 'Content-Type': 'application/json' },
});

await assert.rejects(
  () => leerRespuestaApi(respuestaValidacion),
  /El email no es válido La contraseña es obligatoria/,
);

const respuestaServidor = new Response('Error interno', { status: 500 });
await assert.rejects(
  () => leerRespuestaApi(respuestaServidor),
  /El servidor encontró un problema/,
);

globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Token inválido' }), {
  status: 401,
  headers: { 'Content-Type': 'application/json' },
});

const respuestaAuth = await apiFetch('/api/v1/productos/');
assert.equal(respuestaAuth.status, 401);
assert.equal(eventosSesionExpirada, 1);

console.log('Pruebas de API y errores de red completadas correctamente.');
