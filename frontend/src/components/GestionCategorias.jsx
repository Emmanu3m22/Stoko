import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../lib/api';

const categoriaVacia = { id_categoria: null, nombre: '' };

async function leerRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || 'No se pudo completar la operación.');
  }
  return data;
}

export default function GestionCategorias({ sesion, mostrarNotificacion }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(categoriaVacia);
  const [guardando, setGuardando] = useState(false);

  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await authFetch('/api/v1/categorias/', sesion);
      setCategorias(await leerRespuesta(res));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las categorías.');
    } finally {
      setCargando(false);
    }
  }, [sesion]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const abrirNuevo = () => {
    setForm(categoriaVacia);
    setModalAbierto(true);
  };

  const abrirEdicion = (categoria) => {
    setForm(categoria);
    setModalAbierto(true);
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    if (!nombre) {
      mostrarNotificacion('El nombre de la categoría es obligatorio.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const esEdicion = Boolean(form.id_categoria);
      const res = await authFetch(
        esEdicion ? `/api/v1/categorias/${form.id_categoria}` : '/api/v1/categorias/',
        sesion,
        {
          method: esEdicion ? 'PATCH' : 'POST',
          body: JSON.stringify({ nombre }),
        },
      );
      await leerRespuesta(res);
      setModalAbierto(false);
      mostrarNotificacion(esEdicion ? 'Categoría actualizada.' : 'Categoría creada.');
      await cargarCategorias();
    } catch (err) {
      mostrarNotificacion(err.message || 'No se pudo guardar la categoría.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCategoria = async (categoria) => {
    const confirmado = window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`);
    if (!confirmado) return;

    try {
      const res = await authFetch(`/api/v1/categorias/${categoria.id_categoria}`, sesion, {
        method: 'DELETE',
      });
      await leerRespuesta(res);
      mostrarNotificacion('Categoría eliminada.');
      await cargarCategorias();
    } catch (err) {
      mostrarNotificacion(err.message || 'No se pudo eliminar la categoría.', 'error');
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Catálogo e Inventario
          </p>
          <h2 className="text-2xl font-black text-gray-900">Gestión de Categorías</h2>
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="bg-[#4169E1] hover:bg-[#3155c7] text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-md shadow-blue-200"
        >
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {cargando ? 'Cargando categorías...' : `${categorias.length} categorías registradas`}
          </p>
          <button
            type="button"
            onClick={cargarCategorias}
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
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Nombre</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorias.map((categoria) => (
                <tr key={categoria.id_categoria} className="hover:bg-blue-50/40">
                  <td className="py-4 px-6 font-mono text-xs text-gray-400">
                    #{String(categoria.id_categoria).padStart(3, '0')}
                  </td>
                  <td className="py-4 px-6 font-semibold text-gray-900">{categoria.nombre}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(categoria)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarCategoria(categoria)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!cargando && categorias.length === 0 && !error && (
          <div className="py-16 text-center text-sm font-medium text-gray-400">
            No hay categorías registradas.
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-black text-gray-900 mb-6">
              {form.id_categoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <form onSubmit={guardarCategoria} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Nombre de la categoría
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4169E1]/40 focus:border-[#4169E1] outline-none text-sm font-medium text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[#4169E1] text-white rounded-xl font-bold hover:bg-[#3155c7] disabled:opacity-60 text-sm"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
