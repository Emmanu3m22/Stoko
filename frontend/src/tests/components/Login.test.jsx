/**
 * TC-COMP-001: Login - Renderizado y Validación de Formulario
 * 
 * Objetivo: Verificar que el componente Login se renderice correctamente y valide los campos requeridos.
 * 
 * Qué valida:
 * - Renderizado de elementos del formulario (inputs, botón)
 * - Validación de campos vacíos
 * - Validación de formato de email
 * - Mensajes de error mostrados correctamente
 * - Deshabilitación del botón en estado de carga
 * 
 * Herramientas: Vitest, React Testing Library, @testing-library/user-event
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../components/Login';

// Mock de la librería de API
vi.mock('../../lib/api', () => ({
  iniciarSesion: vi.fn(),
  mensajeErrorApi: vi.fn((err, fallback) => fallback)
}));

describe('TC-COMP-001: Login - Renderizado y Validación', () => {
  let mockOnLoginExitoso;

  beforeEach(() => {
    mockOnLoginExitoso = vi.fn();
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario de login con todos los elementos', () => {
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    // Validar presencia de elementos
    expect(screen.getByText(/Bienvenido de nuevo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/usar credenciales de demo/i)).toBeInTheDocument();
  });

  it('debe mostrar error cuando se envía el formulario sin email', async () => {
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const botton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(botton);
    
    await waitFor(() => {
      expect(screen.getByText(/correo requerido/i)).toBeInTheDocument();
    });
  });

  it('debe validar formato de email antes de enviar', async () => {
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    await user.type(emailInput, 'email-invalido');
    
    const botton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(botton);
    
    await waitFor(() => {
      expect(screen.getByText(/correo válido/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar/ocultar contraseña al hacer clic en el ícono', async () => {
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });
    await user.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('debe llenar campos con credenciales de demo al hacer clic en "Usar demo"', async () => {
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const demoButton = screen.getByText(/usar credenciales de demo/i);
    await user.click(demoButton);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    
    expect(emailInput).toHaveValue('admin@stoko.com');
    expect(passwordInput).toHaveValue('admin1234');
  });

  it('debe mostrar indicador de carga mientras se procesa el login', async () => {
    const { iniciarSesion } = await import('../../lib/api');
    iniciarSesion.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const botton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'admin@stoko.com');
    await user.type(passwordInput, 'admin1234');
    await user.click(botton);
    
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje de error cuando la autenticación falla', async () => {
    const { iniciarSesion } = await import('../../lib/api');
    iniciarSesion.mockRejectedValue(new Error('Credenciales inválidas'));
    
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const botton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    await user.type(emailInput, 'usuario@stoko.com');
    await user.type(passwordInput, 'passwordIncorrecto');
    await user.click(botton);
    
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('debe limpiar el mensaje de error cuando el usuario cambia el email', async () => {
    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    await user.type(emailInput, 'test');
    
    const botton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(botton);
    
    await waitFor(() => {
      expect(screen.getByText(/correo válido/i)).toBeInTheDocument();
    });
    
    // Limpiar y escribir nuevamente
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    
    expect(screen.queryByText(/correo válido/i)).not.toBeInTheDocument();
  });
});
