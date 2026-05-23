/**
 * TC-COMP-003: ListaProductos - Renderizado y Filtrado
 * 
 * Objetivo: Validar que la lista de productos se renderice correctamente con datos y que los filtros funcionen.
 * 
 * Qué valida:
 * - Renderizado de lista de productos
 * - Aplicación correcta de filtros
 * - Búsqueda por nombre funciona
 * - Paginación (si aplica)
 * - Renderizado de estado vacío
 * 
 * Herramientas: Vitest, React Testing Library, @testing-library/user-event
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListaProductos from '../../components/ListaProductos';

vi.mock('../../lib/api', () => ({
  authFetch: vi.fn()
}));

const mockProductos = [
  {
    id: 1,
    nombre: 'Laptop',
    categoria: 'Electrónica',
    precio: 5000,
    stock: 10,
    codigo_barras: 'LAP001'
  },
  {
    id: 2,
    nombre: 'Mouse',
    categoria: 'Accesorios',
    precio: 200,
    stock: 50,
    codigo_barras: 'MOU001'
  },
  {
    id: 3,
    nombre: 'Teclado',
    categoria: 'Accesorios',
    precio: 500,
    stock: 3,
    codigo_barras: 'TEC001'
  }
];

const mockCategorias = [
  { id: 1, nombre: 'Electrónica' },
  { id: 2, nombre: 'Accesorios' }
];

const mockSesion = {
  token: 'test-token',
  usuario: { id: 1 }
};

describe('TC-COMP-003: ListaProductos - Renderizado y Filtrado', () => {
  let mockOnEliminar;
  let mockOnAgregar;
  let mockOnActualizar;
  let mockMostrarNotificacion;

  beforeEach(() => {
    mockOnEliminar = vi.fn();
    mockOnAgregar = vi.fn();
    mockOnActualizar = vi.fn();
    mockMostrarNotificacion = vi.fn();
    vi.clearAllMocks();
  });

  it('debe renderizar la tabla de productos con todos los registros', () => {
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
    expect(screen.getByText('Teclado')).toBeInTheDocument();
  });

  it('debe mostrar mensaje vacío cuando no hay productos', () => {
    render(
      <ListaProductos
        productos={[]}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    expect(screen.getByText(/sin productos|lista vacía/i)).toBeInTheDocument();
  });

  it('debe filtrar productos por categoría', async () => {
    const user = userEvent.setup();
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    const filterSelect = screen.getByRole('combobox', { name: /categoría/i });
    await user.selectOptions(filterSelect, 'Accesorios');

    await waitFor(() => {
      expect(screen.getByText('Mouse')).toBeInTheDocument();
      expect(screen.getByText('Teclado')).toBeInTheDocument();
      expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
    });
  });

  it('debe buscar productos por nombre', async () => {
    const user = userEvent.setup();
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar|nombre/i);
    await user.type(searchInput, 'Teclado');

    await waitFor(() => {
      expect(screen.getByText('Teclado')).toBeInTheDocument();
      expect(screen.queryByText('Mouse')).not.toBeInTheDocument();
    });
  });

  it('debe mostrar indicador de stock bajo', () => {
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    // Teclado tiene stock=3, debería mostrar alerta
    const teclado = screen.getByText('Teclado').closest('tr');
    expect(teclado).toHaveClass(/bajo|warning|low/i);
  });

  it('debe filtrar solo productos con stock bajo', async () => {
    const user = userEvent.setup();
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    const stockBajoCheckbox = screen.getByRole('checkbox', { name: /solo stock bajo/i });
    await user.click(stockBajoCheckbox);

    await waitFor(() => {
      expect(screen.getByText('Teclado')).toBeInTheDocument();
      expect(screen.queryByText('Mouse')).not.toBeInTheDocument();
    });
  });

  it('debe permitir agregar nuevo producto', async () => {
    const user = userEvent.setup();
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    const addButton = screen.getByRole('button', { name: /agregar|nuevo producto/i });
    await user.click(addButton);

    // Modal debería abrirse
    await waitFor(() => {
      expect(screen.getByText(/nuevo producto|crear/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar indicador de carga mientras se cargan productos', () => {
    render(
      <ListaProductos
        productos={[]}
        categorias={mockCategorias}
        cargando={true}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    expect(screen.getByText(/cargando|loading/i)).toBeInTheDocument();
  });

  it('debe permitir editar un producto con permisos de administrador', async () => {
    const user = userEvent.setup();
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={true}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    const editButton = screen.getAllByRole('button', { name: /editar/i })[0];
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText(/editar producto|actualizar/i)).toBeInTheDocument();
    });
  });

  it('debe ocultar botones de edición/eliminación si no tiene permisos', () => {
    render(
      <ListaProductos
        productos={mockProductos}
        categorias={mockCategorias}
        cargando={false}
        onEliminar={mockOnEliminar}
        onAgregar={mockOnAgregar}
        onActualizar={mockOnActualizar}
        puedeAdministrar={false}
        mostrarNotificacion={mockMostrarNotificacion}
        sesion={mockSesion}
      />
    );

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });
});
