import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/api';

export default function ReportesAuditorias({ mostrarNotificacion, sesion }) {
  const [pestaña, setPestaña] = useState('corte');

  const esAdministrador = sesion?.usuario?.rol?.toLowerCase() === 'administrador';
  
  const [auditorias, setAuditorias] = useState([]);
  const [cargandoAuditorias, setCargandoAuditorias] = useState(false);
  const [skip, setSkip] = useState(0);
  const [operacionFiltro, setOperacionFiltro] = useState('');
  const limit = 20;

  const fetchAuditorias = useCallback(async () => {
    if (!esAdministrador) return;
    setCargandoAuditorias(true);
    try {
      let url = `/api/v1/auditorias/?skip=${skip}&limit=${limit}`;
      if (operacionFiltro) {
        url += `&operacion=${operacionFiltro}`;
      }
      const res = await authFetch(url, sesion);
      if (res.ok) {
        const data = await res.json();
        setAuditorias(data);
      } else {
        throw new Error('Error en respuesta');
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion('Error al cargar auditorías', 'error');
    } finally {
      setCargandoAuditorias(false);
    }
  }, [skip, limit, operacionFiltro, esAdministrador, sesion, mostrarNotificacion]);

  useEffect(() => {
    if (pestaña === 'auditoria') {
      fetchAuditorias();
    }
  }, [pestaña, fetchAuditorias]);

  const simularCorte = () => {
    mostrarNotificacion('Cálculo realizado. Turno cerrado con balance de $145,580.00.');
  };

  return (
    <div className="p-8 w-full min-h-screen font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Auditorías</h1>
        
        {/* Selector de Pestañas */}
        <div className="flex gap-4 mt-4 border-b border-gray-200 pb-2">
          <button 
            onClick={() => setPestaña('corte')}
            className={`font-semibold pb-2 ${pestaña === 'corte' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            Cierre de Turno
          </button>
          <button 
            onClick={() => setPestaña('insights')}
            className={`font-semibold pb-2 ${pestaña === 'insights' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
          >
            IA Insights (Gemini)
          </button>
          {esAdministrador && (
            <button 
              onClick={() => { setPestaña('auditoria'); setSkip(0); }}
              className={`font-semibold pb-2 ${pestaña === 'auditoria' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
            >
              Historial de Operaciones
            </button>
          )}
        </div>
      </div>

      {pestaña === 'corte' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium uppercase mb-2">Ventas Totales</p>
            <p className="text-4xl font-bold text-gray-900 mb-6">$142,580.00</p>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">💵 Efectivo</span>
                <span className="font-semibold">$45,200.00</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">💳 Tarjeta Crédito/Débito</span>
                <span className="font-semibold">$82,350.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🏦 Transferencia</span>
                <span className="font-semibold">$15,030.00</span>
              </div>
            </div>
            
            <div className="mt-8 bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-500 text-sm font-bold uppercase">Diferencia Detectada</p>
              <p className="text-2xl font-bold text-red-600">-$120.00</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col">
            <h3 className="text-xl font-bold text-[#4169E1] mb-6">Resumen Financiero</h3>
            <div className="space-y-4 flex-1 text-lg">
              <div className="flex justify-between"><span>Fondo Inicial:</span> <span>$5,000.00</span></div>
              <div className="flex justify-between"><span>Ventas Netas:</span> <span>$142,580.00</span></div>
              <div className="flex justify-between text-red-500"><span>Retiros de Efectivo:</span> <span>-$2,000.00</span></div>
              <div className="flex justify-between font-bold text-2xl mt-4 pt-4 border-t border-indigo-200 text-[#4169E1]">
                <span>Balance de Caja:</span> <span>$145,580.00</span>
              </div>
            </div>
            <button onClick={simularCorte} className="w-full mt-6 bg-[#4169E1] text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-800 transition-colors">
              Realizar Corte Ahora
            </button>
          </div>
        </div>
      )}

      {pestaña === 'insights' && (
        <div className="space-y-6">
          <div className="bg-[#1a237e] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-2">✨ Sugerencia de Gemini API</p>
              <h2 className="text-3xl font-bold mb-4">Incrementar stock de "Café Arabica" un 15% antes del próximo fin de semana.</h2>
              <p className="text-indigo-100 max-w-2xl mb-6">
                Nuestra IA detectó un patrón de consumo ascendente vinculado a eventos locales. Evita una pérdida estimada de $45,000 en ventas no realizadas.
              </p>
              <button onClick={() => mostrarNotificacion('Pedido generado y enviado a proveedor.')} className="bg-white text-[#1a237e] font-bold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Aprobar Pedido
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-2">
              <h3 className="font-bold text-gray-900 mb-4">Tendencias de Ventas</h3>
              <div className="h-40 bg-gray-50 rounded flex items-end justify-between p-4">
                {/* Barras simuladas de gráfica */}
                <div className="w-8 bg-blue-200 rounded-t h-1/2"></div>
                <div className="w-8 bg-[#4169E1] rounded-t h-full"></div>
                <div className="w-8 bg-blue-200 rounded-t h-3/4"></div>
                <div className="w-8 bg-blue-200 rounded-t h-1/3"></div>
                <div className="w-8 bg-blue-200 rounded-t h-2/3"></div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center flex-col">
              <h3 className="font-bold text-gray-900 mb-4 text-center">Salud del Inventario</h3>
              <div className="w-32 h-32 rounded-full border-8 border-[#4169E1] flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">85%</span>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">Excelente</p>
            </div>
          </div>
        </div>
      )}

      {pestaña === 'auditoria' && esAdministrador && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-[slideIn_0.3s_ease-out]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Historial de Auditoría</h3>
              <p className="text-sm text-gray-500 mt-1">Registro inmutable de operaciones críticas del sistema</p>
            </div>
            <select 
              value={operacionFiltro} 
              onChange={(e) => { setOperacionFiltro(e.target.value); setSkip(0); }}
              className="border border-gray-200 rounded-xl p-2.5 text-sm font-medium bg-gray-50 outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1] transition-all"
            >
              <option value="">Todas las operaciones</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="crear_producto">Crear Producto</option>
              <option value="editar_producto">Editar Producto</option>
              <option value="eliminar_producto">Eliminar Producto</option>
              <option value="registrar_venta">Registrar Venta</option>
              <option value="anular_venta">Anular Venta</option>
              <option value="abrir_corte">Abrir Corte</option>
              <option value="cerrar_corte">Cerrar Corte</option>
              <option value="registrar_incidencia">Registrar Incidencia</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 font-semibold">Fecha / Hora</th>
                  <th className="py-3 px-4 font-semibold">Operación</th>
                  <th className="py-3 px-4 font-semibold">ID Usuario</th>
                  <th className="py-3 px-4 font-semibold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {cargandoAuditorias ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-400 font-medium animate-pulse">Cargando registros...</td></tr>
                ) : auditorias.length === 0 ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-400 font-medium">No se encontraron registros de auditoría.</td></tr>
                ) : (
                  auditorias.map((a) => (
                    <tr key={a.id_auditoria || a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {new Date(a.fecha).toLocaleString('es-MX', {
                          year: 'numeric', month: 'short', day: '2-digit',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                          {a.operacion.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {a.id_usuario ? `#${a.id_usuario}` : 'Sistema'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-md truncate" title={a.detalles || 'Sin detalles'}>
                        {a.detalles || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-2">
            <button 
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0 || cargandoAuditorias}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              ← Anterior
            </button>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Página {Math.floor(skip / limit) + 1}
            </span>
            <button 
              onClick={() => setSkip(skip + limit)}
              disabled={auditorias.length < limit || cargandoAuditorias}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
