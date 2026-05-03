import { useState } from 'react';
import HubPrincipal from './components/HubPrincipal';
import Login from './components/Login';

function App() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  return estaAutenticado
    ? <HubPrincipal onLogout={() => setEstaAutenticado(false)} />
    : <Login onLoginExitoso={() => setEstaAutenticado(true)} />;
}

export default App;
