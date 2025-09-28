import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { setupDefaultFetchMocks, createFeedMockWithData, mockFeedData } from '../utils/testSetup';

describe('App - Feed', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

  test('displays feed data when available', async () => {
    // Mock feed con datos
    createFeedMockWithData(mockFeedData);
    
    render(<App />);
    
    // Esperar a que aparezcan los datos del feed
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.getByText('Another Page')).toBeInTheDocument();
      expect(screen.getByText('More content')).toBeInTheDocument();
    });
    
    // Verificar que aparece la tabla con headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('User ID')).toBeInTheDocument();
    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
    expect(screen.getByText('Creado en')).toBeInTheDocument();
    expect(screen.getByText('Elementos')).toBeInTheDocument();
  });

  test('shows empty message when feed is empty', async () => {
    render(<App />);
    
    // Verificar mensaje de feed vacío
    await waitFor(() => {
      expect(screen.getByText(/No hay textos completos disponibles en el feed/i)).toBeInTheDocument();
    });
    
    // Verificar que no aparece la tabla
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
    expect(screen.queryByText('User ID')).not.toBeInTheDocument();
  });

  test('displays feed section title', async () => {
    render(<App />);
    
    // Verificar título de la sección
    expect(screen.getByText(/Feed público/i)).toBeInTheDocument();
  });

  test('renders feed table with correct data structure', async () => {
    createFeedMockWithData([mockFeedData[0]]); // Solo un elemento para testing
    
    render(<App />);
    
    await waitFor(() => {
      // Verificar datos específicos del primer elemento
      expect(screen.getByText('Test Page')).toBeInTheDocument(); // Título
      expect(screen.getByText('Test content')).toBeInTheDocument(); // Contenido
      expect(screen.getByText('2023-01-01')).toBeInTheDocument(); // Fecha
      
      // Verificar que la tabla aparece con el header
      expect(screen.getByText('ID')).toBeInTheDocument();
    });
  });

  test('handles feed loading error gracefully', async () => {
    // Mock error en la carga del feed
    window.fetch.mockImplementation((url) => {
      if (url.includes('/csrf-token')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
        });
      }
      if (url.includes('/paginas')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' })
      });
    });
    
    render(<App />);
    
    // Verificar que aparece mensaje de feed vacío (el comportamiento por defecto al fallar)
    await waitFor(() => {
      expect(screen.getByText(/No hay textos completos disponibles en el feed/i)).toBeInTheDocument();
    });
  });

  test('displays elements field correctly when present', async () => {
    createFeedMockWithData([mockFeedData[1]]); // Segundo elemento tiene elementos JSON
    
    render(<App />);
    
    await waitFor(() => {
      // Verificar que los elementos JSON se muestran
      expect(screen.getByText(/test.*data/i)).toBeInTheDocument();
    });
  });

  test('calls API to load feed on component mount', async () => {
    render(<App />);
    
    // Verificar que se hizo la llamada a la API del feed
    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/paginas'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });
  });

  test('shows feed loading message initially', async () => {
    render(<App />);
    
    // Verificar mensaje inicial de carga
    await waitFor(() => {
      expect(screen.getByText(/Cargando feed/i)).toBeInTheDocument();
    });
  });
});