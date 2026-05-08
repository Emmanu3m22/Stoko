export const SESSION_KEY = 'stoko_sesion';
export const SESSION_EXPIRED_EVENT = 'stoko:sesion-expirada';

export const ROLES = {
  ADMINISTRADOR: 'administrador',
  CAJERO: 'cajero',
};

const normalizarBase64Url = (valor) => {
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/');
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
};

export function decodificarJwt(token) {
  if (!token || typeof token !== 'string') return null;

  const partes = token.split('.');
  if (partes.length < 2) return null;

  try {
    return JSON.parse(atob(normalizarBase64Url(partes[1])));
  } catch {
    return null;
  }
}

export function tokenExpirado(token, ahora = Date.now()) {
  const payload = decodificarJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= ahora;
}

export function normalizarRol(rol) {
  return String(rol || '').trim().toLowerCase();
}

export function esAdministrador(usuario) {
  return normalizarRol(usuario?.rol) === ROLES.ADMINISTRADOR;
}

export function crearSesion(token, usuario) {
  return {
    token,
    usuario,
  };
}

export function guardarSesion(tokenOSesion, usuario) {
  const sesion = typeof tokenOSesion === 'string'
    ? crearSesion(tokenOSesion, usuario)
    : tokenOSesion;

  if (!sesion?.token || tokenExpirado(sesion.token)) {
    cerrarSesion();
    return null;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  return sesion;
}

export function obtenerSesion() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const sesion = JSON.parse(raw);
    if (!sesion?.token || tokenExpirado(sesion.token)) {
      cerrarSesion();
      return null;
    }

    return sesion;
  } catch {
    cerrarSesion();
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}
