import { useCallback, useState, useEffect } from 'react';
import ListaProductos from './ListaProductos';
import RegistroVenta from './RegistroVenta';
import ReportesAuditorias from './ReportesAuditorias';
import Configuracion from './Configuracion';
import { authFetch } from '../lib/api';
import { ROLES, esAdministrador as usuarioEsAdministrador, normalizarRol } from '../auth';

// ── Constantes ───────────────────────────────────────────────────────────────
// PRODUCTOS_MOCK eliminado — el sistema ahora es 100% real.


const normalizarProducto = (producto) => ({
  ...producto,
  id: producto.id ?? producto.id_producto,
  categoria:
    typeof producto.categoria === 'string'
      ? producto.categoria
      : producto.categoria?.nombre || 'Sin categoría',
});

// ── Íconos SVG inline ────────────────────────────────────────────────────────
const Ico = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const D = {
  home:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  box:     'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  cart:    'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  bar:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  cog:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  warn:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  money:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  trend:   'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  check:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const MENU = [
  { id: 'dashboard', label: 'Dashboard',       icon: 'home' },
  { id: 'catalogo',  label: 'Catálogo',         icon: 'box'  },
  { id: 'ventas',    label: 'Módulo de Ventas', icon: 'cart' },
  { id: 'reportes',  label: 'Reportes',         icon: 'bar', roles: [ROLES.ADMINISTRADOR] },
  { id: 'config',    label: 'Configuración',    icon: 'cog', roles: [ROLES.ADMINISTRADOR] },
];

// ── Dashboard (usa datos reales) ─────────────────────────────────────────────
function Dashboard({ productos, cargando, onNavegar, mostrarNotificacion }) {
  const total        = productos.length;
  const stockBajos   = productos.filter((p) => p.stock_actual < (p.stock_minimo || 5));
  const valorInv     = productos.reduce((a, p) => a + p.precio_unitario * p.stock_actual, 0);
  const fmt          = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });

  const kpis = [
    { label: 'Ventas hoy',      valor: '$12,450',         sub: '+8.3% vs ayer',             color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: 'trend' },
    { label: 'Stock bajo',      valor: `${stockBajos.length} items`, sub: 'Requieren reabasto', color: 'text-amber-500',  bg: 'bg-amber-50',    icon: 'warn'  },
    { label: 'Ops. del día',    valor: '24',              sub: 'Completadas',                color: 'text-[#4169E1]',  bg: 'bg-blue-50',     icon: 'check' },
    { label: 'Total productos', valor: cargando ? '…' : String(total), sub: 'En catálogo',  color: 'text-gray-600',   bg: 'bg-gray-100',    icon: 'box'   },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden bg-[#4169E1] rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">
            Panel operativo · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-black mb-2 tracking-tight">Bienvenido a STOKO</h1>
          <p className="text-blue-100 text-sm max-w-lg leading-relaxed mb-6">
            Todo bajo control. Gestiona el catálogo, procesa ventas y revisa métricas desde un solo lugar.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => { mostrarNotificacion('Navegando a nueva venta...'); onNavegar('ventas'); }}
              className="bg-white text-[#4169E1] px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm">
              Nueva Venta
            </button>
            <button onClick={() => onNavegar('catalogo')}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors">
              Ver Catálogo
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, valor, sub, color, bg, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center gap-1.5 ${bg} rounded-lg px-2.5 py-1 mb-3`}>
              <span className={`${color}`}><Ico d={D[icon]} className="w-3.5 h-3.5" /></span>
              <span className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900">{valor}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Sección de stock bajo ── */}
      {!cargando && stockBajos.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-500 flex-shrink-0">
              <Ico d={D.warn} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700">Alerta de inventario</p>
              <p className="text-xs text-amber-600">
                {stockBajos.length} producto{stockBajos.length !== 1 ? 's' : ''} con stock por debajo del mínimo configurado
              </p>
            </div>
            <button
              onClick={() => onNavegar('catalogo')}
              className="ml-auto text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Ver catálogo →
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                <th className="py-2.5 px-6 font-semibold">Producto</th>
                <th className="py-2.5 px-4 font-semibold">Categoría</th>
                <th className="py-2.5 px-4 font-semibold text-center">Stock actual</th>
                <th className="py-2.5 px-4 font-semibold">Código</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockBajos.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-6 font-semibold text-gray-900 text-sm">{p.nombre}</td>
                  <td className="py-3 px-4">
                    <span className="bg-blue-100 text-[#4169E1] px-2 py-0.5 rounded-full text-xs font-semibold">
                      {typeof p.categoria === 'object' ? p.categoria?.nombre : p.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 font-black text-sm px-3 py-1 rounded-lg">
                      {p.stock_actual}
                      <span className="text-amber-500 text-[10px] font-bold uppercase">uds.</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-400">{p.codigo_barras}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-right">
            <p className="text-xs text-gray-400">Valor total en riesgo:&nbsp;
              <span className="font-bold text-gray-600">
                {fmt(stockBajos.reduce((a, p) => a + p.precio_unitario * p.stock_actual, 0))}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Resumen de inventario */}
      {!cargando && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total productos', valor: String(total),    sub: 'En catálogo',    icon: 'box',   dest: 'catalogo' },
            { label: 'Valor inventario', valor: fmt(valorInv),   sub: 'Stock × precio', icon: 'money', dest: 'reportes' },
            { label: 'Registrar venta',  valor: 'Módulo POS',    sub: 'Ir al POS →',    icon: 'cart',  dest: 'ventas'   },
          ].map(({ label, valor, sub, icon, dest }) => (
            <button key={dest} onClick={() => onNavegar(dest)}
              className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-[#4169E1]/40 hover:shadow-md transition-all group">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 text-[#4169E1] group-hover:bg-[#4169E1] group-hover:text-white transition-colors">
                <Ico d={D[icon]} />
              </div>
              <p className="font-black text-gray-900 text-lg">{valor}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label} · {sub}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function HubPrincipal({ sesion, onLogout }) {
  const [menuActivo, setMenuActivo] = useState('dashboard');
  const usuario = sesion?.usuario;
  const rolUsuario = normalizarRol(usuario?.rol);
  const esAdministrador = usuarioEsAdministrador(usuario);
  const menuVisible = MENU.filter((item) => !item.roles || item.roles.includes(rolUsuario));

  // ── Sistema de notificaciones Toast ────────────────────────────────────────
  const [toast, setToast] = useState({ visible: false, mensaje: '', tipo: '' });

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast({ visible: false, mensaje: '', tipo: '' }), 3500);
  };

  // ── ÚNICA fuente de verdad para productos y categorías ─────────────────────
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando,  setCargando]  = useState(true);

  const fetchProductos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await authFetch('/api/v1/productos/', sesion);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProductos(data.map(normalizarProducto));
    } catch {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, [sesion]);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/categorias/', sesion);
      if (!res.ok) throw new Error();
      setCategorias(await res.json());
    } catch {
      setCategorias([]);
    }
  }, [sesion]);

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, [fetchProductos, fetchCategorias]);

  useEffect(() => {
    if (!menuVisible.some((item) => item.id === menuActivo)) {
      setMenuActivo('dashboard');
    }
  }, [menuActivo, menuVisible]);

  const eliminarProducto = async (id) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede eliminar productos.', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/productos/${id}`, sesion, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'No se pudo eliminar el producto.');
      setProductos((prev) => prev.filter((p) => p.id !== id));
      mostrarNotificacion('Producto eliminado del inventario.', 'error');
    } catch (err) {
      mostrarNotificacion(err.message || 'No se pudo eliminar el producto.', 'error');
    }
  };

  const agregarProducto = async (prod) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede crear productos.', 'error');
      return false;
    }

    try {
      const payload = {
        nombre: prod.nombre.trim(),
        codigo_barras: prod.codigo.trim(),
        precio_unitario: Number(prod.precio),
        stock_actual: Number.parseInt(prod.stock, 10),
        stock_minimo: Number.parseInt(prod.stock_minimo || '5', 10),
        id_categoria: prod.id_categoria ? Number(prod.id_categoria) : null,
      };
      const res = await authFetch('/api/v1/productos/', sesion, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'No se pudo crear el producto.');
      const nuevo = normalizarProducto(data);
      setProductos((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      mostrarNotificacion(`Producto "${nuevo.nombre}" agregado exitosamente al catálogo.`);
      return true;
    } catch (err) {
      mostrarNotificacion(err.message || 'No se pudo crear el producto.', 'error');
      return false;
    }
  };

  const actualizarProducto = async (id, prod) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede actualizar productos.', 'error');
      return false;
    }

    try {
      const payload = {
        nombre: prod.nombre.trim(),
        codigo_barras: prod.codigo.trim(),
        precio_unitario: Number(prod.precio),
        stock_actual: Number.parseInt(prod.stock, 10),
        stock_minimo: Number.parseInt(prod.stock_minimo || '5', 10),
        id_categoria: prod.categoria ? Number(prod.categoria) : null,
      };
      const res = await authFetch(`/api/v1/productos/${id}`, sesion, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'No se pudo actualizar el producto.');
      const actualizado = normalizarProducto(data);
      setProductos((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      mostrarNotificacion(`Producto "${actualizado.nombre}" actualizado.`);
      return true;
    } catch (err) {
      mostrarNotificacion(err.message || 'Error al actualizar el producto.', 'error');
      return false;
    }
  };

  const agregarCategoria = async (nombre) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede crear categorías.', 'error');
      return false;
    }

    try {
      const res = await authFetch('/api/v1/categorias/', sesion, {
        method: 'POST',
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Error al crear la categoría.');
      setCategorias([...categorias, data]);
      mostrarNotificacion(`Categoría "${nombre}" creada con éxito.`);
      return true;
    } catch (err) {
      mostrarNotificacion(err.message || 'Error al crear la categoría.', 'error');
      return false;
    }
  };

  const eliminarCategoria = async (id) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede eliminar categorías.', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/categorias/${id}`, sesion, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Error al eliminar');
      setCategorias((prev) => prev.filter((c) => c.id_categoria !== id));
      mostrarNotificacion('Categoría eliminada con éxito.');
    } catch (err) {
      mostrarNotificacion(err.message || 'Error al conectar con el servidor.', 'error');
    }
  };

  const actualizarCategoria = async (id, nombre) => {
    if (!esAdministrador) {
      mostrarNotificacion('Solo un administrador puede actualizar categorías.', 'error');
      return;
    }

    try {
      const res = await authFetch(`/api/v1/categorias/${id}`, sesion, {
        method: 'PATCH',
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Error al actualizar');
      setCategorias((prev) => prev.map((c) => c.id_categoria === id ? data : c));
      mostrarNotificacion('Categoría actualizada.');
    } catch (err) {
      mostrarNotificacion(err.message || 'Error al actualizar la categoría.', 'error');
    }
  };

  const renderContenido = () => {
    switch (menuActivo) {
      case 'dashboard': return <Dashboard productos={productos} cargando={cargando} onNavegar={setMenuActivo} mostrarNotificacion={mostrarNotificacion} />;
      case 'catalogo':  return (
        <ListaProductos 
          productos={productos} 
          categorias={categorias} 
          cargando={cargando} 
          onEliminar={eliminarProducto} 
          onAgregar={agregarProducto} 
          onActualizar={actualizarProducto}
          onAgregarCat={agregarCategoria} 
          onEliminarCat={eliminarCategoria}
          onActualizarCat={actualizarCategoria}
          puedeAdministrar={esAdministrador}
          mostrarNotificacion={mostrarNotificacion} 
          sesion={sesion}
        />
      );
      case 'ventas':    return <RegistroVenta productos={productos} sesion={sesion} onVentaRegistrada={fetchProductos} mostrarNotificacion={mostrarNotificacion} />;
      case 'reportes':  return esAdministrador
        ? <ReportesAuditorias mostrarNotificacion={mostrarNotificacion} sesion={sesion} />
        : <Dashboard productos={productos} cargando={cargando} onNavegar={setMenuActivo} mostrarNotificacion={mostrarNotificacion} />;
      case 'config':    return esAdministrador
        ? <Configuracion sesion={sesion} mostrarNotificacion={mostrarNotificacion} />
        : <Dashboard productos={productos} cargando={cargando} onNavegar={setMenuActivo} mostrarNotificacion={mostrarNotificacion} />;
      default:          return <Dashboard productos={productos} cargando={cargando} onNavegar={setMenuActivo} mostrarNotificacion={mostrarNotificacion} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden relative">

      {/* ── Toast Flotante ── */}
      {toast.visible && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold text-sm
          transition-all duration-300 animate-[slideIn_0.3s_ease-out]
          ${toast.tipo === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-[#4169E1] to-indigo-600'}`}
        >
          <span className="text-lg">{toast.tipo === 'error' ? '✕' : '✓'}</span>
          {toast.mensaje}
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-60 bg-[#0f1623] flex flex-col flex-shrink-0 shadow-xl">
        <div className="px-5 py-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 bg-[#4169E1] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-black text-base leading-none">S</span>
          </div>
          <div>
            <span className="text-white font-black text-lg tracking-tight leading-none">STOKO</span>
            <p className="text-gray-500 text-[10px] leading-none mt-0.5 tracking-widest uppercase">Sistema POS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">Principal</p>
          {menuVisible.map(({ id, label, icon }) => {
            const activo = menuActivo === id;
            return (
              <button key={id} onClick={() => setMenuActivo(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${activo ? 'bg-[#4169E1] text-white shadow-lg shadow-blue-900/30' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                <span className="flex-shrink-0"><Ico d={D[icon]} /></span>
                {label}
                {activo && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#4169E1]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#4169E1] font-bold text-sm">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-gray-500 text-xs truncate">{usuario?.rol || 'Sin rol'}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/5 text-xs font-medium transition-all">
            <Ico d={D.logout} className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {menuVisible.find((m) => m.id === menuActivo)?.label || 'Dashboard'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            API conectada · localhost:8000
          </div>
        </header>
        <div className="p-8">{renderContenido()}</div>
      </main>
    </div>
  );
}
