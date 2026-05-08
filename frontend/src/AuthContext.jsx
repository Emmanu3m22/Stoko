import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SESSION_EXPIRED_EVENT,
  cerrarSesion,
  esAdministrador,
  guardarSesion,
  obtenerSesion,
} from './auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => obtenerSesion());

  const login = useCallback((nuevaSesion) => {
    const sesionGuardada = guardarSesion(nuevaSesion);
    setSesion(sesionGuardada);
  }, []);

  const logout = useCallback(() => {
    cerrarSesion();
    setSesion(null);
  }, []);

  useEffect(() => {
    const manejarSesionExpirada = () => setSesion(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, manejarSesionExpirada);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, manejarSesionExpirada);
  }, []);

  const valor = useMemo(() => ({
    sesion,
    token: sesion?.token || null,
    usuario: sesion?.usuario || null,
    estaAutenticado: Boolean(sesion?.token),
    esAdministrador: esAdministrador(sesion?.usuario),
    login,
    logout,
  }), [login, logout, sesion]);

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}
