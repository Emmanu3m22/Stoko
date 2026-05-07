import { useState } from 'react';

// Datos y lógica de fetch viven en HubPrincipal.
// Este componente solo recibe props y renderiza.
const STOCK_BAJO = 10;

export default function ListaProductos({ productos = [], categorias = [], cargando = false, onEliminar, onAgregar }) {
  // Estado para la ventana modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', id_categoria: '', precio: '', stock: '', stock_minimo: '5', codigo: '' });

  const manejarEnvio = async (e) => {
    e.preventDefault();
    const guardado = await onAgregar(form);
    if (!guardado) return;
    setMostrarModal(false);
    setForm({ nombre: '', id_categoria: '', precio: '', stock: '', stock_minimo: '5', codigo: '' });
  };

  // ── Renderizado (solo contenido — el layout lo gestiona HubPrincipal) ────────
  return (
    <div className="space-y-6 relative">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Gestión del Catálogo</p>
          <h2 className="text-2xl font-black text-gray-900">Lista de Productos</h2>
        </div>
        <button
          id="btn-nuevo-producto"
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3155c7] active:scale-95 text-white px-4 py-2.5 rounded-lg shadow-md shadow-blue-200 transition-all duration-150 font-semibold text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* ── Tarjetas de resumen ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total productos',   value: productos.length,
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            color: 'text-[#4169E1]', bg: 'bg-blue-50' },
          { label: 'Stock bajo (< 10)', value: productos.filter((p) => p.stock_actual < STOCK_BAJO).length,
            icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
            color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Valor inventario',
            value: `$${productos.reduce((acc, p) => acc + p.precio_unitario * p.stock_actual, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${bg} rounded-lg p-3`}>
              <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* VENTANA MODAL (FLOTANTE) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[slideIn_0.2s_ease-out]">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
            <h2 className="text-2xl font-black mb-6 text-gray-900">Añadir Producto</h2>
            <form onSubmit={manejarEnvio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nombre del producto</label>
                <input required type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none transition-all text-sm font-medium text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Precio Unitario ($)</label>
                  <input required type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none transition-all text-sm font-medium text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Stock Inicial</label>
                  <input required type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none transition-all text-sm font-medium text-gray-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Categoría</label>
                  <select value={form.id_categoria} onChange={e => setForm({...form, id_categoria: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none transition-all text-sm font-medium text-gray-900">
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Código de barras</label>
                  <input required type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none transition-all text-sm font-medium text-gray-900" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-[#4169E1] text-white rounded-xl font-bold hover:bg-[#3155c7] transition-all active:scale-95 shadow-lg shadow-blue-200 text-sm">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {cargando ? 'Cargando…' : `${productos.length} producto${productos.length !== 1 ? 's' : ''} en inventario`}
          </p>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar producto…"
              className="bg-transparent text-sm text-gray-600 outline-none placeholder-gray-400 w-40" />
          </div>
        </div>

        {cargando ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Nombre del producto</th>
                  <th className="py-3 px-5">Categoría</th>
                  <th className="py-3 px-5">Precio unitario</th>
                  <th className="py-3 px-5">Stock</th>
                  <th className="py-3 px-5">Código de barras</th>
                  <th className="py-3 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.map((producto) => {
                  const stockBajo = producto.stock_actual < STOCK_BAJO;
                  return (
                    <tr key={producto.id} className="hover:bg-blue-50/40 transition-colors duration-150 group">
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          #{String(producto.id).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900 text-sm">{producto.nombre}</td>
                      <td className="py-3.5 px-5">
                        <span className="bg-blue-100 text-[#4169E1] px-2.5 py-1 rounded-full text-xs font-semibold">
                          {producto.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-700 font-medium">${producto.precio_unitario.toFixed(2)}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${stockBajo ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {producto.stock_actual}
                          </span>
                          {stockBajo && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Reabastecer
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-gray-500">{producto.codigo_barras}</td>
                      <td className="py-3.5 px-5 text-center">
                        <button onClick={() => onEliminar(producto.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 border border-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 px-3 py-1 rounded-lg text-xs transition-all duration-150 font-semibold uppercase tracking-wide">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {productos.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <p className="font-medium">No hay productos registrados</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
