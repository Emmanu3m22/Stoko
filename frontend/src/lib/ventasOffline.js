import { apiFetch } from './api.js';

export const VENTAS_OFFLINE_EVENT = 'stoko:ventas-offline-actualizadas';

const DB_NAME = 'stoko-offline';
const DB_VERSION = 1;
const STORE_NAME = 'ventas-pendientes';
const FALLBACK_KEY = 'stoko_ventas_pendientes';

const tieneIndexedDB = () => typeof indexedDB !== 'undefined';

const crearId = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `venta-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const emitirCambio = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VENTAS_OFFLINE_EVENT));
  }
};

function abrirDB() {
  if (!tieneIndexedDB()) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('creadaEn', 'creadaEn');
        store.createIndex('estado', 'estado');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaccion(storeMode, callback) {
  return abrirDB().then((db) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, storeMode);
      const store = tx.objectStore(STORE_NAME);
      const resultado = callback(store);

      tx.oncomplete = () => {
        db.close();
        resolve(resultado);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  });
}

const leerFallback = () => {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]');
  } catch {
    localStorage.removeItem(FALLBACK_KEY);
    return [];
  }
};

const escribirFallback = (ventas) => {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(ventas));
};

const perteneceAUsuario = (venta, usuarioId) =>
  usuarioId == null || venta.usuarioId == null || String(venta.usuarioId) === String(usuarioId);

async function listarDesdeIndexedDB() {
  const db = await abrirDB();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

export async function listarVentasPendientes({ usuarioId } = {}) {
  if (!tieneIndexedDB()) return leerFallback().filter((venta) => perteneceAUsuario(venta, usuarioId));

  try {
    const ventas = await listarDesdeIndexedDB();
    return [...ventas]
      .filter((venta) => perteneceAUsuario(venta, usuarioId))
      .sort((a, b) => new Date(a.creadaEn) - new Date(b.creadaEn));
  } catch {
    return leerFallback()
      .filter((venta) => perteneceAUsuario(venta, usuarioId));
  }
}

export async function contarVentasPendientes(filtros) {
  return (await listarVentasPendientes(filtros)).length;
}

export async function guardarVentaPendiente({ payload, total, items, usuarioId }) {
  const venta = {
    id: crearId(),
    payload,
    total,
    items,
    usuarioId,
    creadaEn: new Date().toISOString(),
    intentos: 0,
    estado: 'pendiente',
    ultimoError: null,
  };

  if (!tieneIndexedDB()) {
    escribirFallback([...leerFallback(), venta]);
    emitirCambio();
    return venta;
  }

  try {
    await transaccion('readwrite', (store) => store.add(venta));
  } catch {
    escribirFallback([...leerFallback(), venta]);
  }

  emitirCambio();
  return venta;
}

export async function eliminarVentaPendiente(id) {
  if (!tieneIndexedDB()) {
    escribirFallback(leerFallback().filter((venta) => venta.id !== id));
    emitirCambio();
    return;
  }

  try {
    await transaccion('readwrite', (store) => store.delete(id));
  } catch {
    escribirFallback(leerFallback().filter((venta) => venta.id !== id));
  }

  emitirCambio();
}

export async function actualizarVentaPendiente(id, cambios) {
  const ventas = await listarVentasPendientes();
  const actual = ventas.find((venta) => venta.id === id);
  if (!actual) return null;

  const actualizada = { ...actual, ...cambios };

  if (!tieneIndexedDB()) {
    escribirFallback(ventas.map((venta) => (venta.id === id ? actualizada : venta)));
    emitirCambio();
    return actualizada;
  }

  try {
    await transaccion('readwrite', (store) => store.put(actualizada));
  } catch {
    escribirFallback(ventas.map((venta) => (venta.id === id ? actualizada : venta)));
  }

  emitirCambio();
  return actualizada;
}

export async function sincronizarVentasPendientes(sesion, { onVentaSincronizada } = {}) {
  const usuarioId = sesion?.usuario?.id;
  const ventas = await listarVentasPendientes({ usuarioId });
  const resumen = {
    total: ventas.length,
    sincronizadas: 0,
    pendientes: ventas.length,
    errores: 0,
  };

  if (!sesion?.token || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return resumen;
  }

  for (const venta of ventas) {
    try {
      await actualizarVentaPendiente(venta.id, {
        estado: 'sincronizando',
        intentos: (venta.intentos || 0) + 1,
        ultimoError: null,
      });

      const res = await apiFetch('/api/v1/ventas/', {
        method: 'POST',
        body: JSON.stringify(venta.payload),
      }, sesion);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'No se pudo sincronizar la venta pendiente.');
      }

      await eliminarVentaPendiente(venta.id);
      resumen.sincronizadas += 1;
      resumen.pendientes -= 1;
      await onVentaSincronizada?.(data, venta);
    } catch (err) {
      resumen.errores += 1;
      await actualizarVentaPendiente(venta.id, {
        estado: 'pendiente',
        ultimoError: err.message || 'Error de sincronización',
      });

      if ((typeof navigator !== 'undefined' && !navigator.onLine) || err instanceof TypeError) {
        break;
      }
    }
  }

  return resumen;
}
