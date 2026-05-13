import {
  SESSION_EXPIRED_EVENT,
  cerrarSesion,
  crearSesion,
  guardarSesion,
  obtenerSesion,
} from '../auth.js';

export const API_URL = 'http://localhost:8000';

export { SESSION_EXPIRED_EVENT, cerrarSesion, guardarSesion, obtenerSesion };
export const obtenerSesionGuardada = obtenerSesion;
export const limpiarSesion = cerrarSesion;

export async function iniciarSesion(email, password) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'No se pudo iniciar sesión');
  }

  const sesion = crearSesion(data.access_token, {
    id: data.usuario_id,
    nombre: data.nombre,
    rol: data.rol,
  });
  guardarSesion(sesion);
  return sesion;
}

export async function apiFetch(path, options = {}, sesion = obtenerSesion()) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (sesion?.token) {
    headers.set('Authorization', `Bearer ${sesion.token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    cerrarSesion();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  return res;
}

export async function authFetch(path, sesion, options = {}) {
  return apiFetch(path, options, sesion);
}
