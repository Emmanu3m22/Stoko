import {
  SESSION_EXPIRED_EVENT,
  cerrarSesion,
  crearSesion,
  guardarSesion,
  obtenerSesion,
} from '../auth.js';

export const API_URL_DEFAULT = 'http://localhost:8000';
export const MENSAJE_ERROR_RED = 'No se pudo conectar con el servidor. Verifica tu conexión y que el backend esté encendido.';
export const MENSAJE_ERROR_GENERAL = 'No se pudo completar la operación.';

function normalizarApiBase(value) {
  const base = String(value || '').trim();
  if (!base) return API_URL_DEFAULT;
  if (base === '/') return '';
  return base.replace(/\/+$/, '');
}

export function obtenerApiBase() {
  const runtimeUrl = typeof window !== 'undefined' ? window.STOKO_API_URL : null;
  return normalizarApiBase(runtimeUrl || import.meta.env?.VITE_API_URL || API_URL_DEFAULT);
}

export const API_URL = obtenerApiBase();
export const API_HOST_LABEL = obtenerApiBase()
  ? obtenerApiBase().replace(/^https?:\/\//i, '')
  : 'mismo origen';

export class ApiError extends Error {
  constructor(message, { status = null, detail = null, code = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
}

export { SESSION_EXPIRED_EVENT, cerrarSesion, guardarSesion, obtenerSesion };
export const obtenerSesionGuardada = obtenerSesion;
export const limpiarSesion = cerrarSesion;

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${obtenerApiBase()}${path}`;
}

function normalizarDetalle(detalle) {
  if (!detalle) return '';
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle)) {
    return detalle
      .map((item) => item?.msg || item?.message || item?.detail)
      .filter(Boolean)
      .join(' ');
  }
  if (typeof detalle === 'object') {
    return detalle.message || detalle.error || detalle.detail || '';
  }
  return String(detalle);
}

function mensajeHttp(status, data, fallback = MENSAJE_ERROR_GENERAL) {
  const detalle = normalizarDetalle(data?.detail || data?.message || data?.error);
  if (detalle) return detalle;

  if (status >= 500) {
    return 'El servidor encontró un problema. Intenta de nuevo en unos minutos.';
  }
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  return fallback;
}

function normalizarErrorFetch(error) {
  if (error?.name === 'AbortError') {
    return new ApiError('La solicitud tardó demasiado y fue cancelada.', { code: 'REQUEST_ABORTED' });
  }
  if (error instanceof TypeError) {
    return new ApiError(MENSAJE_ERROR_RED, { code: 'NETWORK_ERROR' });
  }
  return error;
}

export async function leerRespuestaApi(res, fallback = MENSAJE_ERROR_GENERAL) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(mensajeHttp(res.status, data, fallback), {
      status: res.status,
      detail: data,
    });
  }
  return data;
}

export function mensajeErrorApi(error, fallback = MENSAJE_ERROR_GENERAL) {
  if (!error) return fallback;
  if (error.code === 'NETWORK_ERROR' || error instanceof TypeError) return MENSAJE_ERROR_RED;
  if (error.name === 'AbortError' || error.code === 'REQUEST_ABORTED') {
    return 'La solicitud tardó demasiado y fue cancelada.';
  }
  return error.message || fallback;
}

export async function iniciarSesion(email, password) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  let res;
  try {
    res = await fetch(apiUrl('/api/v1/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (error) {
    throw normalizarErrorFetch(error);
  }

  const data = await leerRespuestaApi(res, 'No se pudo iniciar sesión.');

  const sesion = crearSesion(data.access_token, {
    id: data.usuario_id,
    nombre: data.nombre,
    rol: data.rol,
  });
  guardarSesion(sesion);
  return sesion;
}

export async function obtenerEstadoSetupInicial() {
  let res;
  try {
    res = await fetch(apiUrl('/api/v1/auth/setup'));
  } catch (error) {
    throw normalizarErrorFetch(error);
  }

  return leerRespuestaApi(res, 'No se pudo verificar la configuración inicial.');
}

export async function crearAdminInicial({ nombre, email, password }) {
  let res;
  try {
    res = await fetch(apiUrl('/api/v1/auth/setup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password }),
    });
  } catch (error) {
    throw normalizarErrorFetch(error);
  }

  const data = await leerRespuestaApi(res, 'No se pudo crear el administrador inicial.');
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

  let res;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers,
    });
  } catch (error) {
    throw normalizarErrorFetch(error);
  }

  if (res.status === 401) {
    cerrarSesion();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  return res;
}

export async function authFetch(path, sesion, options = {}) {
  return apiFetch(path, options, sesion);
}
