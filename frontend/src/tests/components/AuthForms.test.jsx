import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { setupDefaultFetchMocks, createApiErrorMock, openUserPopup, fillRegistrationForm, fillLoginForm } from '../utils/testSetup';

describe('App - Authentication Forms', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
    setupDefaultFetchMocks();
  });

  describe('Registration Form', () => {
    test('handles successful registration form submission', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Abrir popup
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      // Llenar formulario de registro
      const { submitButton } = await fillRegistrationForm(user, screen, 'test@example.com', 'password123');
      
      // Mock successful registration
      window.fetch.mockImplementation((url) => {
        if (url.includes('/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
          });
        }
        if (url.includes('/auth/register')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Registro exitoso' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });
      });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que se hizo la llamada a la API
      await waitFor(() => {
        expect(window.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
          })
        );
      });
    });

    test('handles API error during registration', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Abrir popup
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      // Llenar formulario
      const { submitButton } = await fillRegistrationForm(user, screen, 'test@example.com', 'password123');
      
      // Mock failed registration
      createApiErrorMock('/auth/register', 'Usuario ya existe');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que aparece mensaje de error
      await waitFor(() => {
        expect(screen.getByText(/Usuario ya existe/i)).toBeInTheDocument();
      });
    });

    test('clears form fields after successful registration', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      const { emailInput, passwordInput, submitButton } = await fillRegistrationForm(
        user, screen, 'test@example.com', 'password123'
      );
      
      // Mock successful registration
      window.fetch.mockImplementation((url) => {
        if (url.includes('/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
          });
        }
        if (url.includes('/auth/register')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Registro exitoso' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });
      });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que los campos se limpiaron
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });

  describe('Login Form', () => {
    test('handles successful login form submission', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      const { submitButton } = await fillLoginForm(user, screen, 'test@example.com', 'password123');
      
      // Mock successful login
      window.fetch.mockImplementation((url) => {
        if (url.includes('/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Login exitoso' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });
      });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que se hizo la llamada a la API
      await waitFor(() => {
        expect(window.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
          })
        );
      });
    });

    test('handles API error during login', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      const { submitButton } = await fillLoginForm(user, screen, 'invalid@example.com', 'wrongpass');
      
      // Mock failed login
      createApiErrorMock('/auth/login', 'Credenciales inválidas');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que aparece mensaje de error
      await waitFor(() => {
        expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
      });
    });

    test('clears form fields after successful login', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await openUserPopup(fireEvent, act, waitFor, screen, expect);
      
      const { emailInput, passwordInput, submitButton } = await fillLoginForm(
        user, screen, 'test@example.com', 'password123'
      );
      
      // Mock successful login
      window.fetch.mockImplementation((url) => {
        if (url.includes('/csrf-token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
          });
        }
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Login exitoso' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });
      });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Verificar que los campos se limpiaron
      await waitFor(() => {
        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
      });
    });
  });
});