import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';

// Datos y lógica de fetch viven en HubPrincipal.
// Este componente solo recibe props y renderiza.

export default function ListaProductos({ 
  productos = [], 
  categorias = [], 
  cargando = false, 
  onEliminar, 
  onAgregar, 
  onActualizar,
  onAgregarCat, 
  onEliminarCat,
  onActualizarCat,
  puedeAdministrar = false,
  mostrarNotificacion,
  sesion
}) {
  // Estado para la pestaña activa: 'productos' o 'categorias'
  const [tabActiva, setTabActiva] = useState('productos');
  const [filtroCat, setFiltroCat] = useState('');
  
  // Estados RF03
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [productosLocales, setProductosLocales] = useState(productos);
  const [cargandoLocales, setCargandoLocales] = useState(cargando);

  useEffect(() => {
    if (!busqueda && !categoriaSeleccionada && !soloStockBajo) {
      setProductosLocales(productos);
      setCargandoLocales(cargando);
    }
  }, [productos, cargando, busqueda, categoriaSeleccionada, soloStockBajo]);

  useEffect(() => {
    const fetchFiltrados = async () => {
      setCargandoLocales(true);
      try {
        const params = new URLSearchParams();
        if (busqueda) params.append('busqueda', busqueda);
        if (categoriaSeleccionada) params.append('categoria', categoriaSeleccionada);
        if (soloStockBajo) params.append('stock_bajo', 'true');

        const res = await authFetch(`/api/v1/productos/?${params.toString()}`, sesion);
        if (res.ok) {
          const data = await res.json();
          setProductosLocales(data.map(p => ({
            ...p,
            id: p.id ?? p.id_producto,
            categoria: typeof p.categoria === 'string' ? p.categoria : p.categoria?.nombre || 'Sin categoría'
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCargandoLocales(false);
      }
    };

    const timer = setTimeout(() => {
      fetchFiltrados();
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, categoriaSeleccionada, soloStockBajo, sesion]);
  
  // Estado para las ventanas modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCat, setMostrarModalCat] = useState(false);
  const [editando, setEditando] = useState(null); // id del producto/categoría en edición
  
  const [form, setForm] = useState({ nombre: '', categoria: '', precio: '', stock: '', codigo: '' });
  const [nombreCat, setNombreCat] = useState('');

  // ── Acciones de Productos ──────────────────────────────────────────────────
  const abrirModalNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', categoria: '', precio: '', stock: '', codigo: '', stock_minimo: '5' });
    setMostrarModal(true);
  };

  const abrirModalEditar = (p) => {
    setEditando(p.id_producto || p.id);
    setForm({
      nombre: p.nombre,
      categoria: typeof p.categoria === 'object' ? p.categoria?.id_categoria : p.id_categoria,
      precio: String(p.precio_unitario),
      stock: String(p.stock_actual),
      codigo: p.codigo_barras,
      stock_minimo: String(p.stock_minimo || '5')
    });
    setMostrarModal(true);
  };
  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!form.categoria) {
      mostrarNotificacion('Por favor selecciona una categoría', 'error');
      return;
    }
    
    // Validación numérica estricta
    if (parseFloat(form.precio) < 0 || parseInt(form.stock, 10) < 0) {
      mostrarNotificacion('El precio y el stock no pueden ser negativos', 'error');
      return;
    }

    const guardado = editando
      ? await onActualizar(editando, form)
      : await onAgregar(form);
    
    if (guardado !== false) {
      setMostrarModal(false);
      setForm({ nombre: '', categoria: '', precio: '', stock: '', codigo: '' });
    }
  };

  // ── Acciones de Categorías ─────────────────────────────────────────────────
  const abrirModalCatNuevo = () => {
    setEditando(null);
    setNombreCat('');
    setMostrarModalCat(true);
  };

  const abrirModalCatEditar = (cat) => {
    setEditando(cat.id_categoria);
    setNombreCat(cat.nombre);
    setMostrarModalCat(true);
  };

  const manejarEnvioCat = (e) => {
    e.preventDefault();
    if (editando) {
      onActualizarCat(editando, nombreCat);
    } else {
      onAgregarCat(nombreCat);
    }
    setMostrarModalCat(false);
    setNombreCat('');
  };

  // ── Renderizado ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">

      {/* ── Encabezado y Pestañas ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Catálogos de Sistema</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setTabActiva('productos'); setBusqueda(''); setCategoriaSeleccionada(''); setSoloStockBajo(false); }}
              className={`text-2xl font-black transition-all ${tabActiva === 'productos' ? 'text-gray-900 scale-100' : 'text-gray-300 hover:text-gray-400 scale-95'}`}
            >
              Productos
            </button>
            <span className="text-2xl font-thin text-gray-200">/</span>
            <button 
              onClick={() => { setTabActiva('categorias'); setFiltroCat(''); }}
              className={`text-2xl font-black transition-all ${tabActiva === 'categorias' ? 'text-gray-900 scale-100' : 'text-gray-300 hover:text-gray-400 scale-95'}`}
            >
              Categorías
            </button>
          </div>
        </div>
        
        {puedeAdministrar && (
          <div className="flex gap-3">
            {tabActiva === 'productos' ? (
            <button
              id="btn-nuevo-producto"
              onClick={abrirModalNuevo}
              className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3155c7] active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all duration-150 font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Producto
            </button>
            ) : (
            <button
              onClick={abrirModalCatNuevo}
              className="flex items-center gap-2 bg-gray-900 hover:bg-black active:scale-95 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-gray-200 transition-all duration-150 font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Categoría
            </button>
            )}
          </div>
        )}
      </div>

      {tabActiva === 'productos' ? (
        <>
          {/* ── Resumen Productos ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total productos',   value: productos.length,
                icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                color: 'text-[#4169E1]', bg: 'bg-blue-50' },
              { label: 'Stock bajo', value: productos.filter((p) => p.stock_actual < (p.stock_minimo || 5)).length,
                icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
                color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Valor inventario',
                value: `$${productos.reduce((acc, p) => acc + p.precio_unitario * p.stock_actual, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className={`${bg} rounded-xl p-3`}>
                  <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tabla Productos ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between bg-gray-50/30 gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest w-full md:w-auto">
                {cargandoLocales ? 'Cargando…' : `${productosLocales.length} registros encontrados`}
              </p>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={soloStockBajo}
                    onChange={(e) => setSoloStockBajo(e.target.checked)}
                    className="w-4 h-4 text-[#4169E1] rounded border-gray-300 focus:ring-[#4169E1]"
                  />
                  <span className="text-sm font-medium text-gray-600">Solo stock bajo</span>
                </label>

                <select 
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="bg-white border border-gray-200 text-sm text-gray-600 rounded-xl px-3 py-1.5 outline-none shadow-sm font-medium"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o código…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="bg-transparent text-sm text-gray-600 outline-none placeholder-gray-300 w-48 font-medium" 
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="py-4 px-6">Producto</th>
                    <th className="py-4 px-6">Categoría</th>
                    <th className="py-4 px-6">Precio</th>
                    <th className="py-4 px-6">Stock</th>
                    <th className="py-4 px-6">Código</th>
                    {puedeAdministrar && <th className="py-4 px-6 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productosLocales.length === 0 ? (
                    <tr>
                      <td colSpan={puedeAdministrar ? 6 : 5} className="py-8 text-center text-gray-500 font-medium">
                        No se encontraron productos que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : productosLocales.map((producto) => {
                    const stockBajo = producto.stock_actual < (producto.stock_minimo || 5);
                    const idReal = producto.id_producto || producto.id;
                    return (
                      <tr key={idReal} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 text-sm">{producto.nombre}</p>
                          <p className="text-[10px] text-gray-400 font-mono">ID: {String(idReal).padStart(4, '0')}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-blue-50 text-[#4169E1] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {typeof producto.categoria === 'object' ? producto.categoria?.nombre : (categorias.find(c => c.id_categoria === producto.id_categoria)?.nombre || 'General')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700 font-bold">${producto.precio_unitario.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-sm ${stockBajo ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {producto.stock_actual}
                            </span>
                            {stockBajo && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Stock bajo" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px] text-gray-400">{producto.codigo_barras}</td>
                        {puedeAdministrar && (
                          <td className="py-4 px-6">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => abrirModalEditar(producto)}
                                className="p-2 text-gray-400 hover:text-[#4169E1] hover:bg-blue-50 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button onClick={() => onEliminar(idReal)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ── VISTA DE CATEGORÍAS ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[slideUp_0.3s_ease-out]">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listado Maestro</p>
              <input 
                type="text" 
                placeholder="Buscar categoría..." 
                value={filtroCat}
                onChange={(e) => setFiltroCat(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-gray-900 transition-colors w-40"
              />
            </div>
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/10">
                  <th className="py-4 px-6">Nombre de Categoría</th>
                  <th className="py-4 px-6">Uso</th>
                  {puedeAdministrar && <th className="py-4 px-6 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categorias
                  .filter(c => c.nombre.toLowerCase().includes(filtroCat.toLowerCase()))
                  .map((cat) => (
                  <tr key={cat.id_categoria} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 text-sm">{cat.nombre}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {productos.filter(p => (p.id_categoria || p.categoria?.id_categoria) === cat.id_categoria).length} productos
                      </span>
                    </td>
                    {puedeAdministrar && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => abrirModalCatEditar(cat)}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => onEliminarCat(cat.id_categoria)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
            <h3 className="text-sm font-black text-indigo-900 mb-4 uppercase tracking-wider">Ayuda de Gestión</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">1</div>
                <p className="text-xs text-indigo-800 leading-relaxed">Las categorías ayudan a organizar tu inventario en el Dashboard y Reportes.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">2</div>
                <p className="text-xs text-indigo-800 leading-relaxed">No puedes eliminar una categoría si todavía tiene productos asociados.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">3</div>
                <p className="text-xs text-indigo-800 leading-relaxed">Usa nombres claros y concisos para facilitar el filtrado en el POS.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA/EDITAR CATEGORÍA */}
      {puedeAdministrar && mostrarModalCat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
            <div className="bg-gray-900 px-8 py-6 text-white">
              <h2 className="text-xl font-black">{editando ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <p className="text-gray-400 text-xs mt-1">Organiza mejor tus productos</p>
            </div>
            <form onSubmit={manejarEnvioCat} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre de la categoría</label>
                <input 
                  required 
                  type="text" 
                  value={nombreCat} 
                  onChange={e => setNombreCat(e.target.value)} 
                  placeholder="Ej: Electrónica, Calzado..." 
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all text-sm font-bold text-gray-900" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setMostrarModalCat(false)} className="flex-1 px-5 py-3 text-gray-500 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200 text-sm">
                  {editando ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENTANA MODAL AÑADIR/EDITAR PRODUCTO */}
      {puedeAdministrar && mostrarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-[#4169E1] px-8 py-6 text-white">
              <h2 className="text-2xl font-black">{editando ? 'Editar Producto' : 'Añadir Producto'}</h2>
              <p className="text-blue-100 text-xs mt-1">Completa la ficha técnica del artículo</p>
            </div>
            <form onSubmit={manejarEnvio} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del producto</label>
                <input required type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Precio ($)</label>
                  <input required type="number" step="0.01" min="0" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock Actual</label>
                  <input required type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Stock Mínimo</label>
                  <input required type="number" min="0" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Código de barras</label>
                  <input required type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Categoría</label>
                <select 
                  required 
                  value={form.categoria} 
                  onChange={e => setForm({...form, categoria: e.target.value})} 
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#4169E1] outline-none transition-all text-sm font-bold text-gray-900 appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 px-5 py-3 text-gray-500 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 px-5 py-3 bg-[#4169E1] text-white rounded-2xl font-bold hover:bg-[#3155c7] transition-all active:scale-95 shadow-lg shadow-blue-200 text-sm">
                  {editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
