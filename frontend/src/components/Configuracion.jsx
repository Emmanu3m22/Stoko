import { useState } from 'react';

export default function Configuracion({ mostrarNotificacion }) {
  const [pestaña, setPestaña] = useState('perfil');
  const [usuarios, setUsuarios] = useState([
    { nombre: "Alejandro Mendoza", rol: "ADMINISTRADOR", estado: "● Activo", colorRol: "bg-purple-100 text-purple-700", colorEstado: "text-green-600" },
    { nombre: "Beatriz Romero", rol: "GERENTE", estado: "● Activo", colorRol: "bg-blue-100 text-blue-700", colorEstado: "text-green-600" },
    { nombre: "Carlos Luna", rol: "CAJERO", estado: "○ Inactivo", colorRol: "bg-gray-100 text-gray-700", colorEstado: "text-gray-400" }
  ]);

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState('Cajero');

  const agregarUsuario = () => {
    if(!nuevoNombre) {
      mostrarNotificacion('El nombre no puede estar vacío.', 'error');
      return;
    }
    const colorRol = nuevoRol === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                     nuevoRol === 'Gerente' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
    setUsuarios([...usuarios, { nombre: nuevoNombre, rol: nuevoRol.toUpperCase(), estado: "● Activo", colorRol, colorEstado: "text-green-600" }]);
    setNuevoNombre(''); 
    setNuevoEmail('');
    mostrarNotificacion(`Usuario ${nuevoNombre} agregado correctamente.`);
  };

  const simularGuardado = (e) => {
    e.preventDefault();
    mostrarNotificacion("¡Configuración guardada exitosamente!");
  };

  return (
    <div className="p-8 w-full min-h-screen font-sans">
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
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Rol</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 font-medium">{u.nombre}</td>
                    <td className="py-4"><span className={`${u.colorRol} px-2 py-1 rounded text-xs font-bold`}>{u.rol}</span></td>
                    <td className={`py-4 ${u.colorEstado}`}>{u.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="w-80 bg-gray-50 p-6 rounded-2xl border border-gray-200 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">Añadir Usuario</h3>
            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre completo" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg" />
            <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="Correo electrónico" className="w-full mb-3 px-4 py-2 border border-gray-200 rounded-lg" />
            <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} className="w-full mb-6 px-4 py-2 border border-gray-200 rounded-lg bg-white">
              <option>Cajero</option>
              <option>Gerente</option>
              <option>Administrador</option>
            </select>
            <button onClick={agregarUsuario} className="w-full bg-[#4169E1] text-white font-bold py-2 rounded-lg shadow hover:bg-blue-800">
              Guardar Usuario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
