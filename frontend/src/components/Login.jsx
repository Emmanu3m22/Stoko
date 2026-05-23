import { useEffect, useState } from 'react';
import {
  crearAdminInicial,
  iniciarSesion,
  mensajeErrorApi,
  obtenerEstadoSetupInicial,
} from '../lib/api';

export default function Login({ onLoginExitoso }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [verificandoSetup, setVerificandoSetup] = useState(true);
  const [requiereSetup, setRequiereSetup] = useState(false);

  useEffect(() => {
    let activo = true;

    obtenerEstadoSetupInicial()
      .then((data) => {
        if (!activo) return;
        setRequiereSetup(Boolean(data.requiere_configuracion));
      })
      .catch((err) => {
        if (!activo) return;
        setError(mensajeErrorApi(err, 'No se pudo verificar la configuración inicial.'));
      })
      .finally(() => {
        if (activo) setVerificandoSetup(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      let sesion;
      if (requiereSetup) {
        if (password !== confirmarPassword) {
          setError('Las contraseñas no coinciden.');
          return;
        }
        sesion = await crearAdminInicial({
          nombre: nombreAdmin.trim(),
          email: email.trim(),
          password,
        });
      } else {
        sesion = await iniciarSesion(email.trim(), password);
      }
      onLoginExitoso?.(sesion);
    } catch (err) {
      setError(mensajeErrorApi(err, 'No se pudo iniciar sesión.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans">

      {/* ── Panel izquierdo — Branding ─────────────────────────────────────── */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#4169E1] p-16 relative overflow-hidden select-none">

        {/* Círculos decorativos de fondo */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-[#4169E1] font-black text-xl leading-none">S</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">STOKO</span>
        </div>

        {/* Mensaje central */}
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white mb-5 leading-tight tracking-tight">
            Control total<br />de tu inventario.
          </h1>
          <div className="w-12 h-1 bg-white/60 rounded-full mb-6" />
          <p className="text-white/80 text-lg font-light leading-relaxed max-w-sm">
            Gestión de productos, ventas y reportes en un solo lugar. Diseñado para la empresa moderna.
          </p>
        </div>

        {/* Métricas */}
        <div className="relative z-10 flex gap-10">
          {[
            { label: 'Uptime',          value: '99.9%'    },
            { label: 'Transacciones',   value: '< 200 ms' },
            { label: 'Almacenamiento',  value: 'Local'    },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-widest text-white/50 mb-0.5">{label}</p>
              <p className="text-white font-bold text-lg">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho — Formulario ──────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white px-8 py-12">
        <div className="w-full max-w-md">

          {/* Header del formulario */}
          <div className="mb-8">
            {/* Logo solo visible en mobile */}
            <div className="flex md:hidden items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-[#4169E1] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-base">S</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">STOKO</span>
            </div>

            <p className="text-xs font-semibold text-[#4169E1] uppercase tracking-widest mb-2">
              Portal Operativo
            </p>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
              {requiereSetup ? 'Configura el administrador' : 'Bienvenido de nuevo'}
            </h2>
            <p className="text-gray-500 text-sm">
              {requiereSetup
                ? 'Crea la primera cuenta para usar esta instalación local.'
                : 'Ingresa tus credenciales para acceder al sistema.'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {requiereSetup && (
              <div>
                <label htmlFor="nombre-admin" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nombre del administrador
                </label>
                <input
                  id="nombre-admin"
                  type="text"
                  required
                  autoComplete="name"
                  value={nombreAdmin}
                  onChange={(e) => { setNombreAdmin(e.target.value); setError(''); }}
                  placeholder="Administrador"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] transition-all duration-150"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="correo@negocio.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] transition-all duration-150"
              />
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs text-[#4169E1] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={verPass ? 'text' : 'password'}
                  required
                  minLength={requiereSetup ? 8 : undefined}
                  autoComplete={requiereSetup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {requiereSetup && (
              <div>
                <label htmlFor="confirmar-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmar-password"
                  type={verPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmarPassword}
                  onChange={(e) => { setConfirmarPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] transition-all duration-150"
                />
              </div>
            )}

            {/* Recordarme */}
            {!requiereSetup && (
              <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 accent-[#4169E1]"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 select-none">
                Mantener sesión iniciada por 30 días
              </label>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón principal */}
            <button
              id="btn-iniciar-sesion"
              type="submit"
              disabled={cargando || verificandoSetup}
              className="w-full bg-[#4169E1] hover:bg-[#3155c7] active:scale-[0.98] disabled:opacity-70
                         text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200
                         transition-all duration-150 flex justify-center items-center gap-2 text-sm"
            >
              {cargando || verificandoSetup ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {verificandoSetup ? 'Verificando instalación…' : 'Procesando…'}
                </>
              ) : requiereSetup ? (
                'Crear administrador'
              ) : (
                <>
                  Iniciar Sesión
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          {!requiereSetup && (
            <p className="mt-8 text-center text-xs text-gray-400">
            ¿No tienes cuenta?{' '}
            <button className="text-[#4169E1] font-semibold hover:underline">
              Solicitar acceso al administrador
            </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
