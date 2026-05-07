import { useEffect, useState } from 'react';
import HubPrincipal from './components/HubPrincipal';
import Login from './components/Login';
import { limpiarSesion, obtenerSesionGuardada, SESSION_EXPIRED_EVENT } from './lib/api';

function App() {
  const [estaAutenticado, setEstaAutenticado] = useState(!!localStorage.getItem('stoko_token'));

  const logout = () => {
    localStorage.removeItem('stoko_token');
    localStorage.removeItem('stoko_user');
    setEstaAutenticado(false);
  };

  return estaAutenticado
    ? <HubPrincipal onLogout={logout} />
    : <Login onLoginExitoso={() => setEstaAutenticado(true)} />;
  const [sesion, setSesion] = useState(() => obtenerSesionGuardada());

  const cerrarSesion = () => {
    limpiarSesion();
    setSesion(null);
  };

  useEffect(() => {
    const manejarSesionExpirada = () => setSesion(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, manejarSesionExpirada);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, manejarSesionExpirada);
  }, []);

  return sesion
    ? <HubPrincipal sesion={sesion} onLogout={cerrarSesion} />
    : <Login onLoginExitoso={setSesion} />;
}

export default App;
