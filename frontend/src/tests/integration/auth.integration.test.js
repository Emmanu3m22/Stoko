/**
 * TC-INT-001: Flujo de Autenticación - Frontend ↔ Backend
 * 
 * Objetivo: Verificar que el flujo completo de login funcione desde frontend hasta backend.
 * 
 * Módulos involucrados:
 * - Frontend: Login.jsx, AuthContext.jsx
 * - Backend: routers/auth.py, core/security.py
 * - Base de datos: tabla usuarios
 * 
 * Qué valida:
 * - Envío de credenciales al API
 * - Validación de credenciales en backend
 * - Generación de token JWT
 * - Retorno de token al frontend
 * - Almacenamiento de sesión en frontend
 * - Acceso denegado con credenciales incorrectas
 * 
 * Herramientas: Vitest, React Testing Library, Mock de fetch API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../components/Login';

// Mock del localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock del fetch global
global.fetch = vi.fn();

describe('TC-INT-001: Flujo de Autenticación - Frontend ↔ Backend', () => {
  let mockOnLoginExitoso;

  beforeEach(() => {
    mockOnLoginExitoso = vi.fn();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe autenticar correctamente con credenciales válidas', async () => {
    // Mock de respuesta del backend
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'bearer',
        usuario: {
          id: 1,
          email: 'admin@stoko.com',
          nombre: 'Admin User',
          rol: 'administrador'
        }
      })
    });

    const user = userEvent.setup();
    const { container } = render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    // Ingresar credenciales
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'admin@stoko.com');
    await user.type(passwordInput, 'admin1234');
    await user.click(submitButton);

    // Verificar que se hizo la llamada al backend
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    // Verificar que el token se almacena en localStorage
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    });

    // Verificar que se llamó el callback de éxito
    await waitFor(() => {
      expect(mockOnLoginExitoso).toHaveBeenCalled();
    });
  });

  it('debe mostrar error con credenciales inválidas', async () => {
    // Mock de respuesta 401 del backend
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        detail: 'Credenciales inválidas'
      })
    });

    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'usuario@stoko.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Debe mostrar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas|no se pudo iniciar sesión/i)).toBeInTheDocument();
    });

    // No debe guardar token
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('debe manejar error de conexión al backend', async () => {
    // Mock de error de red
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'admin@stoko.com');
    await user.type(passwordInput, 'admin1234');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error de conexión|no se pudo conectar/i)).toBeInTheDocument();
    });
  });

  it('debe validar que el token tenga estructura JWT válida', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        usuario: { id: 1, email: 'admin@stoko.com' }
      })
    });

    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'admin@stoko.com');
    await user.type(passwordInput, 'admin1234');
    await user.click(submitButton);

    await waitFor(() => {
      const token = localStorage.getItem('token');
      // JWT tiene formato: header.payload.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(mockOnLoginExitoso).toHaveBeenCalled();
    });
  });

  it('debe restaurar sesión desde localStorage en carga de página', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const mockUser = { id: 1, email: 'admin@stoko.com' };

    localStorage.setItem('token', mockToken);
    localStorage.setItem('usuario', JSON.stringify(mockUser));

    // Simulamos que el backend valida el token
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUser
    });

    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    // Debería validar el token contra el backend
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });
  });

  it('debe manejar expiración de token', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        detail: 'Token expirado'
      })
    });

    const mockToken = 'expired-token';
    localStorage.setItem('token', mockToken);

    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    // Debería limpiar el token expirado
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('debe incluir datos del usuario después del login exitoso', async () => {
    const mockUserData = {
      id: 1,
      email: 'admin@stoko.com',
      nombre: 'Admin User',
      rol: 'administrador',
      empresa: 'Stoko SAS'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'eyJ...',
        usuario: mockUserData
      })
    });

    const user = userEvent.setup();
    render(<Login onLoginExitoso={mockOnLoginExitoso} />);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'admin@stoko.com');
    await user.type(passwordInput, 'admin1234');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnLoginExitoso).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario: expect.objectContaining({
            email: 'admin@stoko.com',
            rol: 'administrador'
          })
        })
      );
    });
  });
});
