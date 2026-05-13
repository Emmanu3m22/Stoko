import { useState, useEffect, useCallback } from 'react';

import { authFetch, leerRespuestaApi, mensajeErrorApi } from '../lib/api';

export default function Configuracion({ sesion, mostrarNotificacion }) {
  const [pestaña, setPestaña] = useState('perfil');
  const esAdministrador = sesion?.usuario?.rol?.toLowerCase() === 'administrador';
  
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState('2');

  const [modalEdicion, setModalEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [errorEdicion, setErrorEdicion] = useState('');

  const cargarUsuarios = useCallback(async () => {
    if (!esAdministrador) return;
    setCargandoUsuarios(true);
    try {
      const res = await authFetch('/api/v1/usuarios/', sesion);
      const data = await leerRespuestaApi(res, 'No se pudieron cargar los usuarios.');
      setUsuarios(data);
    } catch (err) {
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudieron cargar los usuarios.'), 'error');
    } finally {
      setCargandoUsuarios(false);
    }
  }, [sesion, esAdministrador, mostrarNotificacion]);

  useEffect(() => {
    if (pestaña === 'usuarios') {
      cargarUsuarios();
    }
  }, [pestaña, cargarUsuarios]);

  const agregarUsuario = async () => {
    if(!nuevoNombre || !nuevoEmail || !nuevoPassword) {
      mostrarNotificacion('Los campos nombre, email y contraseña son obligatorios.', 'error');
      return;
    }
    if(nuevoPassword.length < 6) {
      mostrarNotificacion('La contraseña debe tener mínimo 6 caracteres.', 'error');
      return;
    }
    try {
      const res = await authFetch('/api/v1/usuarios/', sesion, {
        method: 'POST',
        body: JSON.stringify({
          nombre: nuevoNombre,
          email: nuevoEmail,
          password: nuevoPassword,
          id_rol: parseInt(nuevoRol)
        })
      });
      await leerRespuestaApi(res, 'No se pudo crear el usuario.');
      setNuevoNombre(''); 
      setNuevoEmail('');
      setNuevoPassword('');
      setNuevoRol('2');
      mostrarNotificacion(`Usuario ${nuevoNombre} agregado correctamente.`);
      cargarUsuarios();
    } catch (err) {
      const mensaje = mensajeErrorApi(err, 'No se pudo crear el usuario.');
      if (mensaje.toLowerCase().includes("registrado")) {
        mostrarNotificacion("El email ya está registrado.", "error");
      } else {
        mostrarNotificacion(mensaje, "error");
      }
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
    try {
      const payload = {
        nombre: usuarioEditando.nombre,
        email: usuarioEditando.email,
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
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudo actualizar el usuario.'), 'error');
    }
  };

  const desactivarUsuario = async (u) => {
    if (!window.confirm(`¿Seguro que deseas desactivar al usuario ${u.nombre}?`)) return;
    try {
      const res = await authFetch(`/api/v1/usuarios/${u.id_usuario}`, sesion, {
        method: 'DELETE'
      });
      await leerRespuestaApi(res, 'No se pudo desactivar el usuario.');
      mostrarNotificacion('Usuario desactivado correctamente.');
      cargarUsuarios();
    } catch (err) {
      mostrarNotificacion(mensajeErrorApi(err, 'No se pudo desactivar el usuario.'), 'error');
    }
  };

  const simularGuardado = (e) => {
    e.preventDefault();
    mostrarNotificacion("¡Configuración guardada exitosamente!");
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

        </div>
      </div>

      {pestaña === 'perfil' && (
        <form onSubmit={simularGuardado} className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Identidad Legal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Legal / Razón Social</label>
              <input type="text" defaultValue="STOKO SOLUCIONES TECNOLÓGICAS S.A. DE C.V." className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4169E1]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFC / ID Fiscal</label>
                <input type="text" defaultValue="SST123456789" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4169E1]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Régimen Fiscal</label>
                <input type="text" defaultValue="General de Ley Personas Morales" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4169E1]" />
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-6 text-gray-900">Dirección para Tickets</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calle y Número</label>
                <input type="text" defaultValue="Av. Reforma 405, Piso 12" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4169E1]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                <input type="text" defaultValue="06600" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4169E1]" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold hover:bg-gray-200">Descartar</button>
            <button type="submit" className="px-6 py-2 bg-[#4169E1] text-white rounded-lg font-bold shadow hover:bg-blue-800">Guardar Cambios</button>
          </div>
        </form>
      )}

      {pestaña === 'usuarios' && (
        <div className="flex gap-6">
          <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Directorio de Personal</h2>
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
                    const rolNombre = u.rol?.nombre || (u.id_rol === 1 ? 'Administrador' : 'Cajero');
                    const colorRol = rolNombre.toLowerCase() === 'administrador' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700';
                    const estado = u.activo ? "● Activo" : "○ Inactivo";
                    const colorEstado = u.activo ? "text-green-600" : "text-red-500";
                    return (
                      <tr key={u.id_usuario} className="border-b border-gray-50">
                        <td className="py-4 font-medium">{u.nombre}</td>
                        <td className="py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="py-4"><span className={`${colorRol} px-2 py-1 rounded text-xs font-bold uppercase`}>{rolNombre}</span></td>
                        <td className={`py-4 ${colorEstado} text-sm font-semibold`}>{estado}</td>
                        <td className="py-4 text-right">
                          <button onClick={() => iniciarEdicion(u)} className="text-[#4169E1] hover:underline text-sm font-semibold mr-3">Editar</button>
                          {u.activo && (
                            <button onClick={() => desactivarUsuario(u)} className="text-red-500 hover:underline text-sm font-semibold">Desactivar</button>
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
          
          <div className="w-80 bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">Añadir Usuario</h3>
            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre completo" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="Correo electrónico" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Contraseña" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="w-full mb-6 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm">
              <option value="2">Cajero</option>
              <option value="1">Administrador</option>
            </select>
            <button onClick={agregarUsuario} className="w-full bg-[#4169E1] text-white font-bold py-2 rounded-lg shadow hover:bg-blue-800 transition-colors text-sm">
              Guardar Usuario
            </button>
          </div>
        </div>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Contraseña (opcional)</label>
                <input type="password" value={usuarioEditando.password} onChange={(e) => setUsuarioEditando({...usuarioEditando, password: e.target.value})} placeholder="Dejar en blanco para no cambiar" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm" />
                {errorEdicion && <p className="text-red-500 text-xs font-semibold mt-1">{errorEdicion}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Rol</label>
                <select value={usuarioEditando.id_rol} onChange={(e) => setUsuarioEditando({...usuarioEditando, id_rol: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 outline-none text-sm">
                  <option value="2">Cajero</option>
                  <option value="1">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalEdicion(false)} className="px-5 py-2 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 text-sm">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#4169E1] text-white rounded-xl font-bold hover:bg-[#3155c7] text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
