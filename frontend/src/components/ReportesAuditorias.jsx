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

  // Estado para exportación
  const [fechaInicioExp, setFechaInicioExp] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFinExp, setFechaFinExp] = useState(new Date().toISOString().split('T')[0]);
  const [descargando, setDescargando] = useState(false);

  const [corteActivo, setCorteActivo] = useState(null);
  const [cargandoCorte, setCargandoCorte] = useState(false);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [historialCortes, setHistorialCortes] = useState([]);
  const [corteSeleccionado, setCorteSeleccionado] = useState(null);

  const fetchCorteActivo = useCallback(async () => {
    setCargandoCorte(true);
    try {
      const res = await authFetch('/api/v1/cortes/activo', sesion);
      if (res.ok) {
        const data = await res.json();
        setCorteActivo(data);
      } else if (res.status === 404) {
        setCorteActivo(null);
      } else {
        throw new Error('Error al obtener turno activo');
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion('Error al cargar turno activo', 'error');
    } finally {
      setCargandoCorte(false);
    }
  }, [sesion, mostrarNotificacion]);

  const fetchHistorialCortes = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/cortes/', sesion);
      if (res.ok) {
        const data = await res.json();
        setHistorialCortes(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [sesion]);

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
    } else if (pestaña === 'corte') {
      fetchCorteActivo();
      fetchHistorialCortes();
    }
  }, [pestaña, fetchAuditorias, fetchCorteActivo, fetchHistorialCortes]);

  const abrirTurno = async () => {
    try {
      const res = await authFetch('/api/v1/cortes/', sesion, {
        method: 'POST',
      });
      if (res.ok) {
        mostrarNotificacion('Turno abierto exitosamente', 'success');
        fetchCorteActivo();
        fetchHistorialCortes();
      } else {
        const data = await res.json();
        mostrarNotificacion(data.detail || 'Error al abrir turno', 'error');
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion('Error de conexión', 'error');
    }
  };

  const cerrarTurno = async () => {
    const efReal = parseFloat(efectivoReal);
    if (isNaN(efReal) || efReal < 0) {
      mostrarNotificacion('Ingresa un monto válido para el efectivo real', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/cortes/${corteActivo.id_corte}/cerrar`, sesion, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ efectivo_real: efReal })
      });

      if (res.ok) {
        const data = await res.json();
        const msg = data.diferencia === 0 
          ? 'Turno cerrado sin diferencias.' 
          : `Turno cerrado con ${data.diferencia > 0 ? 'sobrante' : 'faltante'} de $${Math.abs(data.diferencia).toFixed(2)}.`;
        
        mostrarNotificacion(msg, data.diferencia === 0 ? 'success' : 'warning');
        setCorteActivo(null);
        setEfectivoReal('');
        fetchHistorialCortes();
      } else {
        const data = await res.json();
        mostrarNotificacion(data.detail || 'Error al cerrar turno', 'error');
      }
    } catch (e) {
      console.error(e);
      mostrarNotificacion('Error de conexión', 'error');
    }
  };

  const descargarReporte = async (formato) => {
    if (!fechaInicioExp || !fechaFinExp) {
      mostrarNotificacion('Selecciona un rango de fechas válido', 'warning');
      return;
    }
    setDescargando(true);
    try {
      const token = sesion?.token;
      // Usamos fetch directamente para manejar el blob, o window.open si el token puede enviarse por query,
      // pero como es API segura, hacemos fetch de blob y forzamos descarga:
      const res = await fetch(`http://127.0.0.1:8000/api/v1/reportes/exportar?fecha_inicio=${fechaInicioExp}&fecha_fin=${fechaFinExp}&formato=${formato}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al generar el reporte');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_ventas_${fechaInicioExp}_al_${fechaFinExp}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      mostrarNotificacion(`Reporte en ${formato.toUpperCase()} descargado exitosamente`, 'success');
    } catch (e) {
      console.error(e);
      mostrarNotificacion(e.message || 'Error de conexión al descargar el reporte', 'error');
    } finally {
      setDescargando(false);
    }
  };

  if (!esAdministrador) {
    return (
      <div className="p-8 w-full min-h-screen font-sans">
        <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2">
            Acceso restringido
          </p>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Reportes solo para administradores</h1>
          <p className="text-sm text-amber-800">
            Tu rol actual permite operar ventas y consultar catálogo, pero no acceder a reportes ni auditorías.
          </p>
        </div>
      </div>
    );
  }

  // Cálculos de ventas para el corte activo
  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalTransferencia = 0;
  let totalVentas = 0;
  let cantidadMermas = 0;

  if (corteActivo) {
    const ventas = corteActivo.ventas || [];
    ventas.filter(v => !v.anulada).forEach(v => {
      if (v.metodo_pago === 'efectivo') totalEfectivo += v.total;
      else if (v.metodo_pago === 'tarjeta') totalTarjeta += v.total;
      else if (v.metodo_pago === 'transferencia') totalTransferencia += v.total;
    });
    totalVentas = corteActivo.total_ventas;

    const incidencias = corteActivo.incidencias || [];
    cantidadMermas = incidencias.filter(i => i.cantidad < 0).length;
  }

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
            <>
              <button 
                onClick={() => setPestaña('exportar')}
                className={`font-semibold pb-2 ${pestaña === 'exportar' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
              >
                Exportar Reportes
              </button>
              <button 
                onClick={() => { setPestaña('auditoria'); setSkip(0); }}
                className={`font-semibold pb-2 ${pestaña === 'auditoria' ? 'text-[#4169E1] border-b-2 border-[#4169E1]' : 'text-gray-500'}`}
              >
                Historial de Operaciones
              </button>
            </>
          )}
        </div>
      </div>

      {pestaña === 'corte' && (
        <div className="space-y-6">
          {cargandoCorte ? (
            <div className="p-6 text-center text-gray-500">Cargando turno activo...</div>
          ) : !corteActivo ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hay turno activo</h3>
              <p className="text-gray-500 mb-6">Abre un nuevo turno para comenzar a registrar ventas.</p>
              <button 
                onClick={abrirTurno}
                className="bg-[#4169E1] text-white font-bold py-3 px-8 rounded-xl shadow-md hover:bg-blue-800 transition-colors"
              >
                Abrir Turno
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium uppercase mb-2">Ventas Totales del Turno</p>
                <p className="text-4xl font-bold text-gray-900 mb-6">${totalVentas.toFixed(2)}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">💵 Efectivo</span>
                    <span className="font-semibold">${totalEfectivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">💳 Tarjeta Crédito/Débito</span>
                    <span className="font-semibold">${totalTarjeta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">🏦 Transferencia</span>
                    <span className="font-semibold">${totalTransferencia.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>⚠️ Mermas Registradas</span>
                    <span className="font-semibold">{cantidadMermas} productos</span>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col">
                <h3 className="text-xl font-bold text-[#4169E1] mb-6">Cerrar Turno</h3>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Efectivo Real en Caja (Contado)
                  </label>
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-3 text-gray-500 font-bold">$</span>
                    <input 
                      type="number"
                      value={efectivoReal}
                      onChange={(e) => setEfectivoReal(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-[#4169E1]"
                    />
                  </div>
                  
                  {efectivoReal !== '' && !isNaN(parseFloat(efectivoReal)) && (
                    <div className={`p-4 rounded-lg border mb-4 ${parseFloat(efectivoReal) - totalEfectivo < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                      <p className="text-sm font-bold uppercase mb-1">Diferencia Proyectada en Efectivo</p>
                      <p className="text-xl font-bold">
                        ${(parseFloat(efectivoReal) - totalEfectivo).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={cerrarTurno} 
                  disabled={!efectivoReal || isNaN(parseFloat(efectivoReal))}
                  className="w-full mt-2 bg-[#4169E1] text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Realizar Corte Ahora
                </button>
              </div>
            </div>
          )}

          {/* Historial de Cortes */}
          {historialCortes.length > 0 && (
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de Cortes de Caja</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-4 font-semibold">ID</th>
                      <th className="py-3 px-4 font-semibold">Fecha Apertura</th>
                      <th className="py-3 px-4 font-semibold">Fecha Cierre</th>
                      <th className="py-3 px-4 font-semibold text-right">Ventas Totales</th>
                      <th className="py-3 px-4 font-semibold text-right">Efectivo Real</th>
                      <th className="py-3 px-4 font-semibold text-right">Diferencia</th>
                      <th className="py-3 px-4 font-semibold text-center">Estado</th>
                      <th className="py-3 px-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {historialCortes.map(c => (
                      <tr key={c.id_corte} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-mono text-gray-500">#{c.id_corte}</td>
                        <td className="py-3 px-4">{new Date(c.fecha_apertura).toLocaleString('es-MX')}</td>
                        <td className="py-3 px-4">{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString('es-MX') : '-'}</td>
                        <td className="py-3 px-4 text-right font-medium">${c.total_ventas.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">${c.efectivo_real !== null ? c.efectivo_real.toFixed(2) : '-'}</td>
                        <td className={`py-3 px-4 text-right font-bold ${c.diferencia < 0 ? 'text-red-500' : c.diferencia > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                          {c.diferencia !== null ? `$${c.diferencia.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${c.estado === 'abierto' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button 
                            onClick={() => setCorteSeleccionado(c)}
                            className="px-3 py-1 bg-white border border-gray-200 text-[#4169E1] hover:bg-blue-50 hover:border-blue-200 rounded font-semibold transition-colors"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Detalles de Corte */}
          {corteSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Detalle de Corte #{corteSeleccionado.id_corte}</h2>
                    <p className="text-xs text-gray-500 mt-1">Apertura: {new Date(corteSeleccionado.fecha_apertura).toLocaleString('es-MX')}</p>
                  </div>
                  <button onClick={() => setCorteSeleccionado(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50 space-y-6">
                  {/* Resumen */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Ventas Totales</p>
                      <p className="text-2xl font-black text-gray-900">${corteSeleccionado.total_ventas.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 uppercase font-bold">Efectivo Reportado</p>
                      <p className="text-2xl font-black text-gray-900">{corteSeleccionado.efectivo_real !== null ? `$${corteSeleccionado.efectivo_real.toFixed(2)}` : 'Pendiente'}</p>
                    </div>
                    <div className={`p-4 rounded-xl border shadow-sm ${corteSeleccionado.diferencia < 0 ? 'bg-red-50 border-red-200' : corteSeleccionado.diferencia > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <p className={`text-xs uppercase font-bold ${corteSeleccionado.diferencia < 0 ? 'text-red-700' : corteSeleccionado.diferencia > 0 ? 'text-green-700' : 'text-gray-500'}`}>Diferencia</p>
                      <p className={`text-2xl font-black ${corteSeleccionado.diferencia < 0 ? 'text-red-600' : corteSeleccionado.diferencia > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {corteSeleccionado.diferencia !== null ? `$${corteSeleccionado.diferencia.toFixed(2)}` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Ventas */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-bold text-gray-700 text-sm">Transacciones de Venta</h3>
                    </div>
                    {corteSeleccionado.ventas && corteSeleccionado.ventas.length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 bg-gray-50">
                            <th className="py-2 px-4">Folio</th>
                            <th className="py-2 px-4">Fecha</th>
                            <th className="py-2 px-4">Método</th>
                            <th className="py-2 px-4 text-right">Total</th>
                            <th className="py-2 px-4 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {corteSeleccionado.ventas.map(v => (
                            <tr key={v.id_venta}>
                              <td className="py-2 px-4 font-mono text-gray-500">#{v.id_venta}</td>
                              <td className="py-2 px-4">{new Date(v.fecha).toLocaleTimeString('es-MX')}</td>
                              <td className="py-2 px-4 capitalize">{v.metodo_pago}</td>
                              <td className="py-2 px-4 text-right font-medium">${v.total.toFixed(2)}</td>
                              <td className="py-2 px-4 text-center">
                                {v.anulada ? <span className="text-red-500 text-xs font-bold">ANULADA</span> : <span className="text-green-500 text-xs font-bold">OK</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">No se registraron ventas.</div>
                    )}
                  </div>

                  {/* Lista de Mermas */}
                  {corteSeleccionado.incidencias && corteSeleccionado.incidencias.length > 0 && (
                    <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                      <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                        <h3 className="font-bold text-red-700 text-sm">Mermas / Ajustes Registrados</h3>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs text-red-400 bg-red-50/50">
                            <th className="py-2 px-4">Prod. ID</th>
                            <th className="py-2 px-4">Causa</th>
                            <th className="py-2 px-4 text-right">Cant.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-50">
                          {corteSeleccionado.incidencias.map(i => (
                            <tr key={i.id_incidencia}>
                              <td className="py-2 px-4 font-mono text-gray-500">#{i.id_producto}</td>
                              <td className="py-2 px-4">{i.causa}</td>
                              <td className="py-2 px-4 text-right font-bold text-red-600">{i.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

      {pestaña === 'exportar' && esAdministrador && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-[fadeIn_0.3s_ease-out] max-w-2xl mx-auto mt-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#4169E1]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Exportar Reportes (RF13)</h2>
            <p className="text-gray-500 mt-2">Genera un documento con el balance de ventas, productos más vendidos y desglose de mermas en el formato que necesites.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Inicio</label>
                <input 
                  type="date" 
                  value={fechaInicioExp}
                  onChange={(e) => setFechaInicioExp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4169E1] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha Final</label>
                <input 
                  type="date" 
                  value={fechaFinExp}
                  onChange={(e) => setFechaFinExp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4169E1] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              <button 
                onClick={() => descargarReporte('pdf')}
                disabled={descargando}
                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                {descargando ? 'Generando...' : 'Descargar PDF'}
              </button>
              
              <button 
                onClick={() => descargarReporte('excel')}
                disabled={descargando}
                className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                {descargando ? 'Generando...' : 'Descargar Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

