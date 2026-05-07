import { useState, useRef } from 'react';
import HistorialVentas from './HistorialVentas';
// Productos vienen como prop desde HubPrincipal (fuente única de datos).

const IVA = 0.16;
const fmt = (n) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

export default function RegistroVenta({ productos = [], sesion, mostrarNotificacion }) {
  const [carrito, setCarrito]     = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [finalizado, setFinalizado]   = useState(false);
  const [vista, setVista] = useState('venta');
  const inputRef = useRef(null);

  // ── Búsqueda de productos ──────────────────────────────────────────────────
  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    if (!valor.trim()) { setSugerencias([]); return; }
    const q = valor.toLowerCase();
    setSugerencias(
      productos.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.codigo_barras.toLowerCase().includes(q)
      ).slice(0, 5)
    );
  };

  // ── Simulación Escáner (Enter) ─────────────────────────────────────────────
  const manejarBusqueda = (e) => {
    if (e.key === 'Enter' && busqueda.trim() !== '') {
      const q = busqueda.toLowerCase();
      const prodCatalogo = productos.find(p => p.codigo_barras.toLowerCase() === q || p.nombre.toLowerCase() === q);
      
      if (prodCatalogo) {
        agregarProducto(prodCatalogo);
        mostrarNotificacion(`Escaneado: ${prodCatalogo.nombre}`, 'success');
      } else {
        const precioAleatorio = Math.floor(Math.random() * 500) + 50; 
        const nuevoItem = {
          id: Date.now(),
          nombre: busqueda,
          precio_unitario: precioAleatorio,
          codigo_barras: `GEN-${Date.now()}`
        };
        agregarProducto(nuevoItem);
        mostrarNotificacion(`Agregado genérico: ${busqueda}`, 'success');
      }
    }
  };

  // ── Agregar al carrito ─────────────────────────────────────────────────────
  const agregarProducto = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id === producto.id);
      if (existe) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    setBusqueda('');
    setSugerencias([]);
    inputRef.current?.focus();
  };

  // ── Cambiar cantidad ───────────────────────────────────────────────────────
  const cambiarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  // ── Eliminar ítem ──────────────────────────────────────────────────────────
  const eliminar = (id) => setCarrito((prev) => prev.filter((i) => i.id !== id));

  // ── Cancelar ──────────────────────────────────────────────────────────────────
  const cancelar = () => {
    if (carrito.length > 0) mostrarNotificacion('Transacción cancelada.', 'error');
    setCarrito([]);
    inputRef.current?.focus();
  };

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const subtotal = carrito.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0);
  const impuesto = subtotal * IVA;
  const total    = subtotal + impuesto;
  const numItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  // ── Pantalla de confirmación ───────────────────────────────────────────────
  if (finalizado) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">¡Venta registrada!</h2>
        <p className="text-gray-500 text-sm mb-2">Total cobrado: <span className="font-bold text-gray-900">{fmt(total)}</span></p>
        <p className="text-gray-400 text-xs mb-8">Folio #{String(Math.floor(Math.random() * 90000) + 10000)}</p>
        <button
          onClick={() => { setCarrito([]); setFinalizado(false); }}
          className="bg-[#4169E1] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#3155c7] transition-colors shadow-lg shadow-blue-200"
        >
          Nueva Venta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setVista('venta')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${vista === 'venta' ? 'bg-[#4169E1] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => setVista('historial')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${vista === 'historial' ? 'bg-[#4169E1] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Historial de ventas
        </button>
      </div>

      {vista === 'historial' ? (
        <HistorialVentas sesion={sesion} mostrarNotificacion={mostrarNotificacion} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-full">

      {/* ── Panel izquierdo: buscador + carrito ───────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Punto de Venta</p>
              <h2 className="text-xl font-black text-gray-900">Registro de Venta</h2>
            </div>
            <span className="text-xs bg-blue-50 text-[#4169E1] font-semibold px-3 py-1.5 rounded-full">
              Cliente General
            </span>
          </div>

          {/* Buscador */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              onKeyDown={manejarBusqueda}
              placeholder="[⚡] Escanear código de barras o escribir y presionar ENTER..."
              autoFocus
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] transition-all"
            />
            {/* Sugerencias */}
            {sugerencias.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {sugerencias.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.codigo_barras}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-bold text-[#4169E1]">{fmt(p.precio_unitario)}</p>
                      <p className="text-xs text-gray-400">Stock: {p.stock_actual}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabla del carrito */}
        <div className="flex-1 overflow-y-auto">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium text-sm">Carrito vacío</p>
              <p className="text-xs mt-1">Busca o escanea un producto para comenzar</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-6 font-semibold">Producto</th>
                  <th className="py-3 px-4 font-semibold text-center">Cantidad</th>
                  <th className="py-3 px-4 font-semibold text-right">Precio</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {carrito.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-gray-900">{item.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.codigo_barras}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => cambiarCantidad(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-600 text-sm font-bold transition-colors">
                          −
                        </button>
                        <span className="font-bold text-gray-900 w-5 text-center text-sm">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item.id, +1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-600 text-gray-600 text-sm font-bold transition-colors">
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-500">{fmt(item.precio_unitario)}</td>
                    <td className="py-4 px-4 text-right text-sm font-bold text-gray-900">
                      {fmt(item.precio_unitario * item.cantidad)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button onClick={() => eliminar(item.id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center mx-auto transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer con resumen de ítems */}
        {carrito.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {numItems} ítem{numItems !== 1 ? 's' : ''} en el carrito
          </div>
        )}
      </div>

      {/* ── Panel derecho: totalizador ─────────────────────────────────── */}
      <div className="w-full lg:w-72 flex flex-col gap-3">

        {/* Desglose */}
        <div className="bg-[#0f1623] rounded-2xl p-6 text-white shadow-xl">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-1">Subtotal</p>
          <p className="text-2xl font-black mb-5">{fmt(subtotal)}</p>

          <div className="space-y-2 text-sm border-t border-white/10 pt-4 mb-4">
            <div className="flex justify-between text-gray-400">
              <span>Descuentos</span>
              <span>— $0.00</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>IVA (16%)</span>
              <span>{fmt(impuesto)}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-1">Total a Pagar</p>
            <p className="text-4xl font-black tracking-tight">{fmt(total)}</p>
          </div>
        </div>

        {/* Botón finalizar */}
        <button
          onClick={() => {
            if (carrito.length > 0) {
              mostrarNotificacion(`¡Venta registrada! Total cobrado: ${fmt(total)}. Folio #${Math.floor(Math.random() * 90000) + 10000}`);
              setFinalizado(true);
            }
          }}
          disabled={carrito.length === 0}
          className="w-full bg-[#4169E1] hover:bg-[#3155c7] disabled:opacity-40 disabled:cursor-not-allowed
                     text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200/50 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Finalizar Venta
          <span className="text-blue-300 text-xs font-normal ml-1">F12</span>
        </button>

        {/* Acciones secundarias */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
            Pausar
          </button>
          <button
            onClick={() => setVista('historial')}
            className="bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Último
          </button>
        </div>

        <button
          onClick={cancelar}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-100 transition-colors text-sm"
        >
          Cancelar Transacción
        </button>
      </div>
        </div>
      )}
    </div>
  );
}
