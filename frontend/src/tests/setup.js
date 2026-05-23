import '@testing-library/jest-dom'

// Mock de localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

// Mock de variables globales
global.fetch = vi.fn()
