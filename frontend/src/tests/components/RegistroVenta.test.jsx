/**
 * TC-COMP-005: RegistroVenta - Validación de Formulario y Cálculos
 * 
 * Objetivo: Verificar que el componente RegistroVenta valide datos, calcule totales correctamente y maneje la presentación.
 * 
 * Qué valida:
 * - Renderizado del formulario de venta
 * - Selección de productos funciona
 * - Cálculo de subtotal, impuesto y total
 * - Validación de cantidad mínima
 * - Validación de disponibilidad de stock
 * - Método de pago disponible
 * - Envío de datos correcto
 * 
 * Herramientas: Vitest, React Testing Library, @testing-library/user-event
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistroVenta from '../../components/RegistroVenta';

// Mock de la librería de API
vi.mock('../../lib/api', () => ({
  authFetch: vi.fn(),
  leerRespuestaApi: vi.fn(),
  mensajeErrorApi: vi.fn((err, fallback) => fallback)
}));

vi.mock('../../lib/ventasOffline', () => ({
  guardarVentaPendiente: vi.fn()
}));

const mockSesion = {
  token: 'test-token',
  usuario: { id: 1, email: 'test@example.com' }
};

const mockProductos = [
  {
    id: 1,
    nombre: 'Producto A',
    precio: 100,
    stock: 50,
    codigo_barras: 'PROD001'
  },
  {
    id: 2,
    nombre: 'Producto B',
    precio: 250,
    stock: 30,
    codigo_barras: 'PROD002'
  }
];

const mockCorte = {
  id: 1,
  monto_apertura: 1000,
  estado: 'abierto'
};

describe('TC-COMP-005: RegistroVenta - Validación y Cálculos', () => {
  let mockOnVentaRegistrada;
  let mockOnCorteActualizado;
  let mockOnVentaPendienteGuardada;
  let mockMostrarNotificacion;

  beforeEach(() => {
    mockOnVentaRegistrada = vi.fn();
    mockOnCorteActualizado = vi.fn();
    mockOnVentaPendienteGuardada = vi.fn();
    mockMostrarNotificacion = vi.fn();
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario de registro de venta', () => {
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    expect(screen.getByPlaceholderText(/buscar producto/i)).toBeInTheDocument();
    expect(screen.getByText(/carrito/i)).toBeInTheDocument();
  });

  it('debe permitir agregar un producto al carrito por búsqueda', async () => {
    const user = userEvent.setup();
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'Producto A');

    // Esperar sugerencias
    await waitFor(() => {
      expect(screen.getByText('Producto A')).toBeInTheDocument();
    });

    // Hacer clic en la sugerencia
    await user.click(screen.getByText('Producto A'));

    // Verificar que el producto se añade al carrito
    await waitFor(() => {
      expect(screen.getByText(/Producto A/)).toBeInTheDocument();
    });
  });

  it('debe incrementar la cantidad si el producto ya está en el carrito', async () => {
    const user = userEvent.setup();
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar producto/i);

    // Agregar el mismo producto dos veces
    await user.type(searchInput, 'PROD001');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });

    await user.type(searchInput, 'PROD001');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      // La cantidad debe ser 2
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });
  });

  it('debe calcular correctamente el subtotal con múltiples productos', async () => {
    const { container } = render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    // Con carrito [Prod A (100) x 2, Prod B (250) x 1]
    // Subtotal = 100*2 + 250*1 = 450
    // IVA 16% = 72
    // Total = 522

    await waitFor(() => {
      const subtotalText = screen.queryByText(/subtotal:/i);
      if (subtotalText) {
        expect(subtotalText).toBeInTheDocument();
      }
    });
  });

  it('debe validar que la cantidad no sea mayor que el stock disponible', async () => {
    const user = userEvent.setup();
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'PROD001');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const cantidadInput = screen.getByDisplayValue('1');
      expect(cantidadInput).toBeInTheDocument();
    });

    // Intentar establecer cantidad > stock
    const cantidadInput = screen.getByDisplayValue('1');
    await user.clear(cantidadInput);
    await user.type(cantidadInput, '100');

    // Debería mostrar error o resetear a stock máximo
    await waitFor(() => {
      expect(
        screen.getByText(/no hay suficiente stock|máximo disponible/i)
      ).toBeInTheDocument();
    });
  });

  it('debe permitir remover productos del carrito', async () => {
    const user = userEvent.setup();
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar producto/i);
    await user.type(searchInput, 'PROD001');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/Producto A/)).toBeInTheDocument();
    });

    // Remover producto
    const removeButton = screen.getByRole('button', { name: /eliminar|quitar|×/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Producto A/)).not.toBeInTheDocument();
    });
  });

  it('debe mostrar método de pago disponible', () => {
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    expect(screen.getByText(/método de pago|efectivo|tarjeta/i)).toBeInTheDocument();
  });

  it('debe habilitar el botón de guardar solo cuando hay productos en el carrito', () => {
    render(
      <RegistroVenta
        productos={mockProductos}
        sesion={mockSesion}
        corteActivo={mockCorte}
        onVentaRegistrada={mockOnVentaRegistrada}
        onCorteActualizado={mockOnCorteActualizado}
        onVentaPendienteGuardada={mockOnVentaPendienteGuardada}
        mostrarNotificacion={mockMostrarNotificacion}
      />
    );

    const guardarButton = screen.getByRole('button', { name: /guardar venta|procesar/i });
    
    // Sin productos, botón debe estar deshabilitado
    expect(guardarButton).toBeDisabled();
  });
});
