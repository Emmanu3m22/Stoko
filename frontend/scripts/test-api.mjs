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
  apiUrl,
  apiFetch,
  crearAdminInicial,
  iniciarSesion,
  leerRespuestaApi,
  mensajeErrorApi,
  obtenerEstadoSetupInicial,
  obtenerSesion,
  solicitarAcceso,
} = await import('../src/lib/api.js');

const segmento = (valor) => Buffer.from(JSON.stringify(valor)).toString('base64url');
const token = (payload) => `${segmento({ alg: 'none', typ: 'JWT' })}.${segmento(payload)}.firma`;
const tokenSetup = token({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });

assert.equal(apiUrl('/api/v1/salud'), 'http://localhost:8000/api/v1/salud');
window.STOKO_API_URL = 'http://127.0.0.1:49152/';
assert.equal(apiUrl('/api/v1/salud'), 'http://127.0.0.1:49152/api/v1/salud');
delete window.STOKO_API_URL;

globalThis.fetch = async (url, options = {}) => {
  if (url === 'http://localhost:8000/api/v1/auth/setup' && !options.method) {
    return new Response(JSON.stringify({ requiere_configuracion: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (url === 'http://localhost:8000/api/v1/auth/setup' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    assert.equal(body.nombre, 'Admin Local');
    assert.equal(body.email, 'admin@local.test');
    assert.equal(body.password, 'password123');

    return new Response(JSON.stringify({
      access_token: tokenSetup,
      token_type: 'bearer',
      usuario_id: 1,
      nombre: 'Admin Local',
      rol: 'administrador',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (url === 'http://localhost:8000/api/v1/auth/solicitudes-acceso' && options.method === 'POST') {
    const body = JSON.parse(options.body);
    assert.equal(body.nombre, 'Cajero Local');
    assert.equal(body.email, 'cajero@local.test');
    assert.equal(body.rol_solicitado, 'cajero');

    return new Response(JSON.stringify({
      id_solicitud: 1,
      nombre: 'Cajero Local',
      email: 'cajero@local.test',
      rol_solicitado: 'cajero',
      mensaje: 'Turno vespertino',
      estado: 'pendiente',
      fecha: new Date().toISOString(),
      fecha_resolucion: null,
      id_usuario_creado: null,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  throw new Error(`URL inesperada: ${url}`);
};

assert.deepEqual(await obtenerEstadoSetupInicial(), { requiere_configuracion: true });
const sesionSetup = await crearAdminInicial({
  nombre: 'Admin Local',
  email: 'admin@local.test',
  password: 'password123',
});
assert.equal(sesionSetup.usuario.nombre, 'Admin Local');
assert.equal(obtenerSesion().token, tokenSetup);

const solicitudAcceso = await solicitarAcceso({
  nombre: 'Cajero Local',
  email: 'cajero@local.test',
  rol_solicitado: 'cajero',
  mensaje: 'Turno vespertino',
});
assert.equal(solicitudAcceso.estado, 'pendiente');

globalThis.fetch = async () => {
  throw new TypeError('Failed to fetch');
};

await assert.rejects(
  () => iniciarSesion('usuario@negocio.com', 'password123'),
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
