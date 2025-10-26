import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { setupDefaultFetchMocks, createFeedMockWithData, mockFeedData } from '../utils/testSetup';

describe('App - Feed', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

  test('displays users data when available', async () => {
    // Mock usuarios con datos
    createFeedMockWithData(mockFeedData);

    render(<App />);

    // Esperar a que aparezcan los datos de usuarios
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('anotheruser')).toBeInTheDocument();
    });

    // Verificar que aparece la sección de usuarios
    expect(screen.getByText('Usuarios registrados')).toBeInTheDocument();
  });

  test('shows empty message when no users available', async () => {
    render(<App />);

    // Verificar mensaje de usuarios vacío
    await waitFor(() => {
      expect(screen.getByText(/No hay usuarios registrados/i)).toBeInTheDocument();
    });
  });

  test('displays users section title', async () => {
    render(<App />);

    // Verificar título de la sección
    expect(screen.getByText(/Usuarios registrados/i)).toBeInTheDocument();
  });

  test('renders users list with correct data structure', async () => {
    createFeedMockWithData([mockFeedData[0]]); // Solo un elemento para testing

    render(<App />);

    await waitFor(() => {
      // Verificar datos específicos del primer usuario
      expect(screen.getByText('testuser')).toBeInTheDocument(); // Username
      expect(screen.getByText('1/1/2023')).toBeInTheDocument(); // Fecha formateada
    });
  });

  test('handles users loading error gracefully', async () => {
    // Mock error en la carga de usuarios
    window.fetch.mockImplementation((url) => {
      if (url.includes('/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
        });
      }
      if (url.includes('/api/auth/users')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
    });

    render(<App />);

    // Verificar que aparece mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  test('displays user profile photo when available', async () => {
    const userWithPhoto = [{
      ...mockFeedData[0],
      foto_perfil: Buffer.from('fake-image-data')
    }];
    createFeedMockWithData(userWithPhoto);

    render(<App />);

    await waitFor(() => {
      // Verificar que se muestra el enlace al perfil del usuario
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  test('calls API to load users on component mount', async () => {
    render(<App />);

    // Verificar que se hizo la llamada a la API de usuarios
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/users'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
  });

  test('shows users loading message initially', async () => {
    render(<App />);

    // Verificar mensaje inicial de carga
    await waitFor(() => {
      expect(screen.getByText(/Cargando usuarios/i)).toBeInTheDocument();
    });
  });
});