import { useState } from 'react';
import HubPrincipal from './components/HubPrincipal';
import Login from './components/Login';
import { limpiarSesion, obtenerSesionGuardada } from './lib/api';

function App() {
  const [sesion, setSesion] = useState(() => obtenerSesionGuardada());

  const cerrarSesion = () => {
    limpiarSesion();
    setSesion(null);
  };

  return sesion
    ? <HubPrincipal sesion={sesion} onLogout={cerrarSesion} />
    : <Login onLoginExitoso={setSesion} />;
}

export default App;
