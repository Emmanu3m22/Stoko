import assert from 'node:assert/strict';

if (!globalThis.atob) {
  globalThis.atob = (valor) => Buffer.from(valor, 'base64').toString('binary');
}

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const {
  SESSION_KEY,
  cerrarSesion,
  decodificarJwt,
  esAdministrador,
  guardarSesion,
  obtenerSesion,
  tokenExpirado,
} = await import('../src/auth.js');

const segmento = (valor) => Buffer.from(JSON.stringify(valor)).toString('base64url');
const token = (payload) => `${segmento({ alg: 'none', typ: 'JWT' })}.${segmento(payload)}.firma`;

const tokenVigente = token({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
const tokenVencido = token({ sub: '1', exp: Math.floor(Date.now() / 1000) - 1 });

assert.equal(decodificarJwt(tokenVigente).sub, '1');
assert.equal(tokenExpirado(tokenVigente), false);
assert.equal(tokenExpirado(tokenVencido), true);

const sesion = guardarSesion(tokenVigente, {
  id: 1,
  nombre: 'Admin',
  rol: 'Administrador',
});

assert.equal(sesion.token, tokenVigente);
assert.equal(obtenerSesion().usuario.nombre, 'Admin');
assert.equal(esAdministrador(obtenerSesion().usuario), true);

guardarSesion(tokenVencido, {
  id: 2,
  nombre: 'Cajero',
  rol: 'Cajero',
});

assert.equal(obtenerSesion(), null);
assert.equal(localStorage.getItem(SESSION_KEY), null);

guardarSesion(tokenVigente, {
  id: 3,
  nombre: 'Cajero',
  rol: 'Cajero',
});
cerrarSesion();

assert.equal(obtenerSesion(), null);
assert.equal(storage.size, 0);

console.log('Pruebas de auth completadas correctamente.');
