import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../../App';
import { setupDefaultFetchMocks } from '../utils/testSetup';

describe('App - User Popup', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

  test('opens and closes user popup', async () => {
    render(<App />);
    
    // El popup no debe estar visible inicialmente
    expect(screen.queryByText(/Registro/i)).not.toBeInTheDocument();
    
    // Click en el icono de usuario para abrir popup
    const userIcon = document.querySelector('#user-icon-container');
    
    await act(async () => {
      fireEvent.click(userIcon);
    });
    
    // El popup debe aparecer
    await waitFor(() => {
      expect(screen.getByText(/Registro/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
    
    // Cerrar popup con click en background
    const background = document.querySelector('#user-popup-bg');
    await act(async () => {
      fireEvent.click(background);
    });
    
    // El popup debe desaparecer
    await waitFor(() => {
      expect(screen.queryByText(/Registro/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('closes popup with Escape key', async () => {
    render(<App />);
    
    // Abrir popup
    const userIcon = document.querySelector('#user-icon-container');
    await act(async () => {
      fireEvent.click(userIcon);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Registro/i)).toBeInTheDocument();
    });
    
    // Presionar Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    
    // El popup debe cerrarse
    await waitFor(() => {
      expect(screen.queryByText(/Registro/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('popup shows both registration and login forms', async () => {
    render(<App />);
    
    // Abrir popup
    const userIcon = document.querySelector('#user-icon-container');
    await act(async () => {
      fireEvent.click(userIcon);
    });
    
    await waitFor(() => {
      // Verificar que ambos formularios están presentes
      expect(screen.getByText(/Registro/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      
      // Verificar campos de registro
      expect(screen.getByLabelText(/Email:/i, { selector: '#regEmail' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Contraseña:/i, { selector: '#regPass' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Registrar/i })).toBeInTheDocument();
      
      // Verificar campos de login
      expect(screen.getByLabelText(/Email:/i, { selector: '#logEmail' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Contraseña:/i, { selector: '#logPass' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
    });
  });
});