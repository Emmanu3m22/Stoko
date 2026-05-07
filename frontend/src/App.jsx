import { useState } from 'react';
import HubPrincipal from './components/HubPrincipal';
import Login from './components/Login';

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
}

export default App;
