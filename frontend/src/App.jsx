import { AuthProvider } from './AuthContext';
import HubPrincipal from './components/HubPrincipal';
import Login from './components/Login';
import { useAuth } from './useAuth';

function AppContent() {
  const { sesion, login, logout } = useAuth();

  return sesion
    ? <HubPrincipal sesion={sesion} onLogout={logout} />
    : <Login onLoginExitoso={login} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
