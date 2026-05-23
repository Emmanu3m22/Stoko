import { useState, useEffect, useCallback, useMemo } from 'react';

import { authFetch, leerRespuestaApi, mensajeErrorApi } from '../lib/api';

const ROLES_FALLBACK = [
  { id_rol: 1, nombre: 'administrador' },
  { id_rol: 2, nombre: 'cajero' },
];

const normalizarRol = (rol) => rol?.nombre || rol || 'Sin rol';

export default function Configuracion({ sesion, mostrarNotificacion }) {
  const [pestaña, setPestaña] = useState('perfil');
  const esAdministrador = sesion?.usuario?.rol?.toLowerCase() === 'administrador';
  
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState('');
  const [perfilActual, setPerfilActual] = useState(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [usuarioEnAccion, setUsuarioEnAccion] = useState(null);
  const [configIA, setConfigIA] = useState(null);
  const [modeloIA, setModeloIA] = useState('gemini-3-flash-preview');
  const [apiKeyIA, setApiKeyIA] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [guardandoIA, setGuardandoIA] = useState(false);
  const [probandoIA, setProbandoIA] = useState(false);
  const [mensajeIA, setMensajeIA] = useState(null);

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState('2');

  const [modalEdicion, setModalEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [errorEdicion, setErrorEdicion] = useState('');

  const rolesDisponibles = useMemo(() => usuarios
    .map((usuario) => usuario.rol)
    .filter(Boolean)
    .reduce((roles, rol) => {
      if (roles.some((item) => item.id_rol === rol.id_rol)) return roles;
      return [...roles, rol];
    }, [...ROLES_FALLBACK])
    .sort((a, b) => a.id_rol - b.id_rol), [usuarios]);

  const cargarPerfil = useCallback(async () => {
    setCargandoPerfil(true);
    try {
      const res = await authFetch('/api/v1/auth/me', sesion);
      setPerfilActual(await leerRespuestaApi(res, 'No se pudo cargar el perfil actual.'));
    } catch (err) {
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudo cargar el perfil actual.'), 'error');
    } finally {
      setCargandoPerfil(false);
    }
  }, [sesion, mostrarNotificacion]);

  const cargarUsuarios = useCallback(async () => {
    if (!esAdministrador) return;
    setCargandoUsuarios(true);
    setErrorUsuarios('');
    try {
      const res = await authFetch('/api/v1/usuarios/', sesion);
      const data = await leerRespuestaApi(res, 'No se pudieron cargar los usuarios.');
      setUsuarios([...data].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudieron cargar los usuarios.');
      setErrorUsuarios(mensaje);
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setCargandoUsuarios(false);
    }
  }, [sesion, esAdministrador, mostrarNotificacion]);

  const cargarConfigIA = useCallback(async () => {
    if (!esAdministrador) return;
    setCargandoIA(true);
    setMensajeIA(null);
    try {
      const res = await authFetch('/api/v1/configuracion/ia', sesion);
      const data = await leerRespuestaApi(res, 'No se pudo cargar la configuración de IA.');
      setConfigIA(data);
      setModeloIA(data.modelo || 'gemini-3-flash-preview');
      setApiKeyIA('');
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo cargar la configuración de IA.');
      setMensajeIA({ tipo: 'error', texto: mensaje });
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setCargandoIA(false);
    }
  }, [sesion, esAdministrador, mostrarNotificacion]);

  useEffect(() => {
    if (pestaña === 'usuarios') {
      cargarUsuarios();
    } else if (pestaña === 'perfil') {
      cargarPerfil();
    } else if (pestaña === 'ia') {
      cargarConfigIA();
    }
  }, [pestaña, cargarUsuarios, cargarPerfil, cargarConfigIA]);

  const agregarUsuario = async (e) => {
    e.preventDefault();
    const nombre = nuevoNombre.trim();
    const email = nuevoEmail.trim();
    if(!nombre || !email || !nuevoPassword) {
      mostrarNotificacion('Los campos nombre, email y contraseña son obligatorios.', 'error');
      return;
    }
    if(nuevoPassword.length < 6) {
      mostrarNotificacion('La contraseña debe tener mínimo 6 caracteres.', 'error');
      return;
    }
    setGuardandoUsuario(true);
    try {
      const res = await authFetch('/api/v1/usuarios/', sesion, {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          email,
          password: nuevoPassword,
          id_rol: parseInt(nuevoRol)
        })
      });
      await leerRespuestaApi(res, 'No se pudo crear el usuario.');
      setNuevoNombre(''); 
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol('2');
      mostrarNotificacion(`Usuario ${nombre} agregado correctamente.`);
      cargarUsuarios();
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo crear el usuario.');
      if (mensaje.toLowerCase().includes("registrado")) {
        mostrarNotificacion("El email ya está registrado.", "error");
      } else {
        mostrarNotificacion(mensaje, "error");
      }
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const iniciarEdicion = (u) => {
    setUsuarioEditando({
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      email: u.email,
      id_rol: u.rol?.id_rol || 2,
      password: ''
    });
    setErrorEdicion('');
    setModalEdicion(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEdicion('');
    const nombre = usuarioEditando.nombre.trim();
    const email = usuarioEditando.email.trim();
    if (!nombre || !email) {
      setErrorEdicion('Nombre y email son obligatorios.');
      return;
    }
    setGuardandoEdicion(true);
    try {
      const payload = {
        nombre,
        email,
        id_rol: parseInt(usuarioEditando.id_rol)
      };
      if (usuarioEditando.password) {
        if (usuarioEditando.password.length < 6) {
          setErrorEdicion('La contraseña debe tener mínimo 6 caracteres.');
          return;
        }
        payload.password = usuarioEditando.password;
      }

      const res = await authFetch(`/api/v1/usuarios/${usuarioEditando.id_usuario}`, sesion, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      await leerRespuestaApi(res, 'No se pudo actualizar el usuario.');
      mostrarNotificacion('Usuario actualizado correctamente.');
      setModalEdicion(false);
      setUsuarioEditando(null);
      cargarUsuarios();
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo actualizar el usuario.');
      setErrorEdicion(mensaje);
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const desactivarUsuario = async (u) => {
    if (u.id_usuario === sesion?.usuario?.id) {
      mostrarNotificacion('No puedes desactivar tu propio usuario desde esta sesión.', 'error');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas desactivar al usuario ${u.nombre}?`)) return;
    setUsuarioEnAccion(u.id_usuario);
    try {
      const res = await authFetch(`/api/v1/usuarios/${u.id_usuario}`, sesion, {
        method: 'DELETE'
      });
      await leerRespuestaApi(res, 'No se pudo desactivar el usuario.');
      mostrarNotificacion('Usuario desactivado correctamente.');
      cargarUsuarios();
    } catch (err) {
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudo desactivar el usuario.'), 'error');
    } finally {
      setUsuarioEnAccion(null);
    }
  };

  const activarUsuario = async (u) => {
    setUsuarioEnAccion(u.id_usuario);
    try {
      const res = await authFetch(`/api/v1/usuarios/${u.id_usuario}`, sesion, {
        method: 'PATCH',
        body: JSON.stringify({ activo: true })
      });
      await leerRespuestaApi(res, 'No se pudo activar el usuario.');
      mostrarNotificacion('Usuario activado correctamente.');
      cargarUsuarios();
    } catch (err) {
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudo activar el usuario.'), 'error');
    } finally {
      setUsuarioEnAccion(null);
    }
  };

  const guardarConfigIA = async (e) => {
    e.preventDefault();
    setGuardandoIA(true);
    setMensajeIA(null);
    try {
      const payload = { modelo: modeloIA.trim() || 'gemini-3-flash-preview' };
      if (apiKeyIA.trim()) {
        payload.api_key = apiKeyIA.trim();
      }
      const res = await authFetch('/api/v1/configuracion/ia', sesion, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await leerRespuestaApi(res, 'No se pudo guardar la configuración de IA.');
      setConfigIA(data);
      setModeloIA(data.modelo || payload.modelo);
      setApiKeyIA('');
      setMensajeIA({ tipo: 'success', texto: 'Configuración de IA guardada correctamente.' });
      mostrarNotificacion('Configuración de IA guardada correctamente.');
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo guardar la configuración de IA.');
      setMensajeIA({ tipo: 'error', texto: mensaje });
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setGuardandoIA(false);
    }
  };

  const borrarApiKeyIA = async () => {
    if (!window.confirm('¿Borrar la API key guardada para Gemini?')) return;
    setGuardandoIA(true);
    setMensajeIA(null);
    try {
      const res = await authFetch('/api/v1/configuracion/ia', sesion, {
        method: 'PUT',
        body: JSON.stringify({ modelo: modeloIA.trim() || 'gemini-3-flash-preview', api_key: '' }),
      });
      const data = await leerRespuestaApi(res, 'No se pudo borrar la API key.');
      setConfigIA(data);
      setApiKeyIA('');
      setMensajeIA({ tipo: 'success', texto: 'API key borrada correctamente.' });
      mostrarNotificacion('API key borrada correctamente.');
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo borrar la API key.');
      setMensajeIA({ tipo: 'error', texto: mensaje });
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setGuardandoIA(false);
    }
  };

  const probarConfigIA = async () => {
    setProbandoIA(true);
    setMensajeIA(null);
    try {
      const res = await authFetch('/api/v1/configuracion/ia/probar', sesion, { method: 'POST' });
      const data = await leerRespuestaApi(res, 'No se pudo probar la conexión con Gemini.');
      setMensajeIA({ tipo: data.ok ? 'success' : 'error', texto: data.mensaje });
      mostrarNotificacion(data.mensaje, data.ok ? 'success' : 'error');
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo probar la conexión con Gemini.');
      setMensajeIA({ tipo: 'error', texto: mensaje });
      mostrarNotificacion(mensaje, 'error');
    } finally {
      setProbandoIA(false);
    }
  };

  if (!esAdministrador) {
    return (
      <div className="p-8 w-full min-h-screen font-sans">
        <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2">
            Acceso restringido
          </p>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Solo administradores</h1>
          <p className="text-sm text-amber-800">
            Tu rol actual no tiene permisos para gestionar configuración, auditorías o usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full min-h-screen font-sans relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <div className="flex gap-4 mt-4 border-b border-gray-200 pb-2">
          <button
            onClick={() => setPestaña('perfil')}
            className={`font-semibold pb-2 ${pestaña === 'perfil' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            Perfil del Negocio
          </button>
          <button
            onClick={() => setPestaña('usuarios')}
            className={`font-semibold pb-2 ${pestaña === 'usuarios' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setPestaña('ia')}
            className={`font-semibold pb-2 ${pestaña === 'ia' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            Inteligencia Artificial
          </button>

        </div>
      </div>

      {pestaña === 'perfil' && (
        <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Datos desde el API
              </p>
              <h2 className="text-xl font-bold text-gray-900">Perfil de la sesión</h2>
            </div>
            <button
              type="button"
              onClick={cargarPerfil}
              disabled={cargandoPerfil}
              className="px-4 py-2 text-[#4169E1] bg-blue-50 rounded-lg font-bold hover:bg-blue-100 disabled:opacity-50 text-sm"
            >
              {cargandoPerfil ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {cargandoPerfil ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : perfilActual ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold">
                  {perfilActual.nombre}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {perfilActual.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 capitalize">
                    {normalizarRol(perfilActual.rol)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className={`w-full px-4 py-3 border rounded-lg font-semibold ${perfilActual.activo ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {perfilActual.activo ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              No se pudo cargar el perfil desde el servidor.
            </div>
          )}
        </div>
      )}

      {pestaña === 'usuarios' && (
        <div className="flex gap-6">
          <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Directorio de Personal</h2>
              <button
                type="button"
                onClick={cargarUsuarios}
                disabled={cargandoUsuarios}
                className="text-xs font-bold text-[#4169E1] bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg px-3 py-2"
              >
                {cargandoUsuarios ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            {errorUsuarios && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorUsuarios}
              </div>
            )}
            {cargandoUsuarios ? (
              <p className="text-gray-500">Cargando usuarios...</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Rol</th>
                    <th className="pb-2">Estado</th>
                    <th className="pb-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => {
                    const rolNombre = normalizarRol(u.rol);
                    const colorRol = rolNombre.toLowerCase() === 'administrador' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700';
                    const estado = u.activo ? "● Activo" : "○ Inactivo";
                    const colorEstado = u.activo ? "text-green-600" : "text-red-500";
                    const enAccion = usuarioEnAccion === u.id_usuario;
                    return (
                      <tr key={u.id_usuario} className="border-b border-gray-50">
                        <td className="py-4 font-medium">{u.nombre}</td>
                        <td className="py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="py-4"><span className={`${colorRol} px-2 py-1 rounded text-xs font-bold uppercase`}>{rolNombre}</span></td>
                        <td className={`py-4 ${colorEstado} text-sm font-semibold`}>{estado}</td>
                        <td className="py-4 text-right">
                          <button type="button" onClick={() => iniciarEdicion(u)} className="text-[#4169E1] hover:underline text-sm font-semibold mr-3">Editar</button>
                          {u.activo ? (
                            <button
                              type="button"
                              disabled={enAccion || u.id_usuario === sesion?.usuario?.id}
                              onClick={() => desactivarUsuario(u)}
                              className="text-red-500 hover:underline text-sm font-semibold disabled:text-gray-300 disabled:no-underline"
                              title={u.id_usuario === sesion?.usuario?.id ? 'No puedes desactivar tu propia sesión' : undefined}
                            >
                              {enAccion ? 'Procesando...' : 'Desactivar'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={enAccion}
                              onClick={() => activarUsuario(u)}
                              className="text-green-600 hover:underline text-sm font-semibold disabled:text-gray-300 disabled:no-underline"
                            >
                              {enAccion ? 'Procesando...' : 'Activar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">No hay usuarios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          <form onSubmit={agregarUsuario} className="w-80 bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">Añadir Usuario</h3>
            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre completo" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="Correo electrónico" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Contraseña" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="w-full mb-6 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm">
              {rolesDisponibles.map((rol) => (
                <option key={rol.id_rol} value={rol.id_rol}>
                  {normalizarRol(rol)}
                </option>
              ))}
            </select>
            <button type="submit" disabled={guardandoUsuario} className="w-full bg-[#4169E1] text-white font-bold py-2 rounded-lg shadow hover:bg-blue-800 transition-colors text-sm disabled:opacity-60">
              {guardandoUsuario ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </form>
        </div>
      )}

      {pestaña === 'ia' && (
        <form onSubmit={guardarConfigIA} className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Configuración local
            </p>
            <h2 className="text-xl font-bold text-gray-900">Gemini IA</h2>
            <p className="text-sm text-gray-500 mt-2">
              La API key se guarda en esta instalación local y no se incluye en el código.
            </p>
          </div>

          {cargandoIA ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Estado</p>
                <p className={`text-sm font-bold ${configIA?.api_key_configurada ? 'text-green-700' : 'text-amber-700'}`}>
                  {configIA?.api_key_configurada
                    ? `API key configurada (${configIA.api_key_preview})`
                    : 'Sin API key configurada'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo</label>
                <input
                  type="text"
                  value={modeloIA}
                  onChange={(e) => setModeloIA(e.target.value)}
                  placeholder="gemini-3-flash-preview"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">API key de Gemini</label>
                <input
                  type="password"
                  value={apiKeyIA}
                  onChange={(e) => setApiKeyIA(e.target.value)}
                  placeholder={configIA?.api_key_configurada ? 'Dejar en blanco para conservar la clave guardada' : 'Pega tu API key de Gemini'}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Puedes obtenerla desde Google AI Studio. No se mostrará completa después de guardarla.
                </p>
              </div>

              {mensajeIA && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  mensajeIA.tipo === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-600'
                }`}>
                  {mensajeIA.texto}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
                {configIA?.api_key_configurada && (
                  <button
                    type="button"
                    onClick={borrarApiKeyIA}
                    disabled={guardandoIA}
                    className="px-5 py-2 text-red-600 bg-red-50 rounded-xl font-bold hover:bg-red-100 text-sm disabled:opacity-60"
                  >
                    Borrar API key
                  </button>
                )}
                <button
                  type="button"
                  onClick={probarConfigIA}
                  disabled={probandoIA || guardandoIA}
                  className="px-5 py-2 text-[#4169E1] bg-blue-50 rounded-xl font-bold hover:bg-blue-100 text-sm disabled:opacity-60"
                >
                  {probandoIA ? 'Probando...' : 'Probar conexión'}
                </button>
                <button
                  type="submit"
                  disabled={guardandoIA}
                  className="px-5 py-2 bg-[#4169E1] text-white rounded-xl font-bold hover:bg-[#3155c7] text-sm disabled:opacity-60"
                >
                  {guardandoIA ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}



      {/* Modal de Edición */}
      {modalEdicion && usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6">Editar Usuario</h3>
            <form onSubmit={guardarEdicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nombre</label>
                <input required type="text" value={usuarioEditando.nombre} onChange={(e) => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input required type="email" value={usuarioEditando.email} onChange={(e) => setUsuarioEditando({...usuarioEditando, email: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cambiar contraseña</label>
                <input type="password" value={usuarioEditando.password} onChange={(e) => setUsuarioEditando({...usuarioEditando, password: e.target.value})} placeholder="Dejar en blanco para no cambiar" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm" />
                {errorEdicion && <p className="text-red-500 text-xs font-semibold mt-1">{errorEdicion}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Rol</label>
                <select value={usuarioEditando.id_rol} onChange={(e) => setUsuarioEditando({...usuarioEditando, id_rol: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm">
                  {rolesDisponibles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {normalizarRol(rol)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setModalEdicion(false); setUsuarioEditando(null); }}
                  className="px-5 py-2 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 text-sm"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoEdicion} className="px-5 py-2 bg-[#4169E1] text-white rounded-xl font-bold hover:bg-[#3155c7] text-sm disabled:opacity-60">
                  {guardandoEdicion ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
