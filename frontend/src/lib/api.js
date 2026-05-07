export const API_URL = 'http://localhost:8000';

const SESSION_KEY = 'stoko_sesion';
export const SESSION_EXPIRED_EVENT = 'stoko:sesion-expirada';

export function guardarSesion(sesion) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function obtenerSesionGuardada() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function limpiarSesion() {
  localStorage.removeItem(SESSION_KEY);
}

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

  const sesion = {
    token: data.access_token,
    usuario: {
      id: data.usuario_id,
      nombre: data.nombre,
      rol: data.rol,
    },
  };
  guardarSesion(sesion);
  return sesion;
}

export async function authFetch(path, sesion, options = {}) {
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
    limpiarSesion();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  return res;
}
