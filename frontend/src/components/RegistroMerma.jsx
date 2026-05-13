import { useState, useEffect, useCallback } from 'react';
import { authFetch, leerRespuestaApi, mensajeErrorApi } from '../lib/api';

export default function RegistroMerma({ mostrarNotificacion, sesion, idCorteActivo }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('');
  const [causa, setCausa] = useState('');
  const [cargando, setCargando] = useState(false);
  const [incidencias, setIncidencias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const fetchProductos = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/productos/', sesion);
      setProductos(await leerRespuestaApi(res, 'No se pudieron cargar los productos.'));
    } catch (e) {
      console.error(e);
      mostrarNotificacion(mensajeErrorApi(e, 'No se pudieron cargar los productos.'), 'error');
    }
  }, [sesion, mostrarNotificacion]);

  const fetchIncidencias = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const res = await authFetch('/api/v1/incidencias/', sesion);
      setIncidencias(await leerRespuestaApi(res, 'No se pudo cargar el historial de mermas.'));
    } catch (e) {
      console.error(e);
      mostrarNotificacion(mensajeErrorApi(e, 'No se pudo cargar el historial de mermas.'), 'error');
    } finally {
      setCargandoHistorial(false);
    }
  }, [sesion, mostrarNotificacion]);

  useEffect(() => {
    fetchProductos();
    fetchIncidencias();
  }, [fetchProductos, fetchIncidencias]);

  const productosFiltrados = busqueda.trim() === '' 
    ? [] 
    : productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        p.codigo_barras.includes(busqueda) ||
        p.id_producto.toString() === busqueda
      ).slice(0, 5);

  const registrarMerma = async (e) => {
    e.preventDefault();
    
    if (!productoSeleccionado) {
      mostrarNotificacion('Selecciona un producto', 'warning');
      return;
    }

    const cant = parseInt(cantidad);
    if (isNaN(cant) || cant <= 0) {
      mostrarNotificacion('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    if (cant > productoSeleccionado.stock_actual) {
      mostrarNotificacion('La cantidad supera el stock disponible', 'error');
      return;
    }

    if (causa.trim().length < 5) {
      mostrarNotificacion('La causa debe tener al menos 5 caracteres', 'warning');
      return;
    }

    setCargando(true);
    try {
      // Enviamos cantidad negativa para merma según RF10
      const res = await authFetch('/api/v1/incidencias/', sesion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_producto: productoSeleccionado.id_producto,
          cantidad: -cant,
          causa: causa.trim(),
          id_corte: idCorteActivo
        })
      });

      await leerRespuestaApi(res, 'No se pudo registrar la merma.');
      mostrarNotificacion('Merma registrada exitosamente', 'success');
      setProductoSeleccionado(null);
      setBusqueda('');
      setCantidad('');
      setCausa('');
      fetchProductos(); // Refrescar stock
      fetchIncidencias(); // Refrescar historial
    } catch (e) {
      console.error(e);
      mostrarNotificacion(mensajeErrorApi(e, 'No se pudo registrar la merma.'), 'error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Formulario de Registro */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Nueva Merma</h3>
          </div>

          <form onSubmit={registrarMerma} className="space-y-4">
            {/* Buscador de Producto */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
              {productoSeleccionado ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div>
                    <p className="font-bold text-blue-900">{productoSeleccionado.nombre}</p>
                    <p className="text-xs text-blue-700">Stock: {productoSeleccionado.stock_actual} uds.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setProductoSeleccionado(null)}
                    className="text-blue-500 hover:text-blue-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  <input 
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o código..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                  />
                  {productosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                      {productosFiltrados.map(p => (
                        <button
                          key={p.id_producto}
                          type="button"
                          onClick={() => {
                            setProductoSeleccionado(p);
                            setBusqueda('');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-0"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-500">{p.codigo_barras}</p>
                          </div>
                          <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Stock: {p.stock_actual}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad a descontar</label>
              <input 
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                placeholder="Ej. 5"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
              />
            </div>

            {/* Causa */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Causa del daño/pérdida</label>
              <textarea 
                value={causa}
                onChange={(e) => setCausa(e.target.value)}
                placeholder="Describa el motivo..."
                rows="3"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={cargando || !productoSeleccionado || !cantidad || !causa}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {cargando ? 'Registrando...' : 'Registrar Merma'}
            </button>
          </form>
        </div>
      </div>

      {/* Historial de Mermas */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Historial Reciente de Mermas</h3>
            <button onClick={fetchIncidencias} className="text-[#4169E1] text-sm font-bold hover:underline">Actualizar</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold text-center">Cant.</th>
                  <th className="py-3 px-4 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cargandoHistorial ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-400">Cargando historial...</td></tr>
                ) : incidencias.filter(i => i.cantidad < 0).length === 0 ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-400">No hay mermas registradas.</td></tr>
                ) : (
                  incidencias.filter(i => i.cantidad < 0).map(i => (
                    <tr key={i.id_incidencia} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(i.fecha).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {i.producto?.nombre || 'Producto eliminado'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-600">
                        {Math.abs(i.cantidad)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate" title={i.causa}>
                        {i.causa}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
