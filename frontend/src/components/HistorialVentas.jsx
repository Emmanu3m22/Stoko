import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../lib/api';

const LIMITE = 20;

const fmtMoneda = (n) =>
  Number(n || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });

const fmtFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

async function leerRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'No se pudo completar la operación.');
  }
  return data;
}

export default function HistorialVentas({ sesion, mostrarNotificacion }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(0);
  const [anulando, setAnulando] = useState(null);
  const esAdministrador = sesion?.usuario?.rol?.toLowerCase() === 'administrador';

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams({
        skip: String(pagina * LIMITE),
        limit: String(LIMITE),
        anuladas: 'true',
      });
      const res = await authFetch(`/api/v1/ventas/?${params.toString()}`, sesion);
      setVentas(await leerRespuesta(res));
    } catch (err) {
      setError(err.message || 'No se pudo cargar el historial de ventas.');
    } finally {
      setCargando(false);
    }
  }, [pagina, sesion]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const anularVenta = async (venta) => {
    const confirmado = window.confirm(`¿Anular la venta #${venta.id_venta}? Esta acción restaurará el stock.`);
    if (!confirmado) return;

    setAnulando(venta.id_venta);
    try {
      const res = await authFetch(`/api/v1/ventas/${venta.id_venta}/anular`, sesion, {
        method: 'POST',
      });
      await leerRespuesta(res);
      mostrarNotificacion(`Venta #${venta.id_venta} anulada correctamente.`);
      await cargarVentas();
    } catch (err) {
      mostrarNotificacion(err.message || 'No se pudo anular la venta.', 'error');
    } finally {
      setAnulando(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
            Historial de ventas
          </p>
          <h2 className="text-xl font-black text-gray-900">Ventas registradas</h2>
        </div>
        <button
          type="button"
          onClick={cargarVentas}
          className="text-xs font-semibold text-[#4169E1] hover:underline"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5">Folio</th>
                <th className="py-3 px-5">Fecha</th>
                <th className="py-3 px-5">Total</th>
                <th className="py-3 px-5">Método de pago</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.map((venta) => (
                <tr key={venta.id_venta} className="hover:bg-blue-50/40">
                  <td className="py-4 px-5 font-mono text-xs text-gray-500">
                    #{String(venta.id_venta).padStart(5, '0')}
                  </td>
                  <td className="py-4 px-5 text-sm text-gray-600">{fmtFecha(venta.fecha)}</td>
                  <td className="py-4 px-5 text-sm font-bold text-gray-900">{fmtMoneda(venta.total)}</td>
                  <td className="py-4 px-5">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                      {venta.metodo_pago}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${venta.anulada ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {venta.anulada ? 'Anulada' : 'Activa'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    {esAdministrador ? (
                      <button
                        type="button"
                        disabled={venta.anulada || anulando === venta.id_venta}
                        onClick={() => anularVenta(venta)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {anulando === venta.id_venta ? 'Anulando...' : 'Anular'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Solo administrador</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ventas.length === 0 && (
            <div className="py-16 text-center text-sm font-medium text-gray-400">
              No hay ventas registradas.
            </div>
          )}
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <p className="text-xs text-gray-400">Página {pagina + 1}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagina === 0}
            onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={ventas.length < LIMITE}
            onClick={() => setPagina((actual) => actual + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
