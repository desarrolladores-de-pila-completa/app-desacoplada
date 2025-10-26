// Test setup y utilidades comunes

// Función para configurar mocks por defecto
export const setupDefaultFetchMocks = () => {
  window.fetch.mockClear();

  // Mock por defecto para CSRF token
  window.fetch.mockImplementation((url) => {
    if (url.includes('/csrf-token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
      });
    }
    if (url.includes('/api/auth/users')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });
};

// Función para crear mock de usuarios con datos
export const createFeedMockWithData = (usersData) => {
  fetch.mockImplementation((url) => {
    if (url.includes('/csrf-token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
      });
    }
    if (url.includes('/api/auth/users')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(usersData)
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });
};

// Función para crear mock de API con error
export const createApiErrorMock = (endpoint, errorMessage) => {
  fetch.mockImplementation((url) => {
    if (url.includes('/csrf-token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ csrfToken: 'test-csrf-token' })
      });
    }
    if (url.includes(endpoint)) {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });
};

// Datos de prueba comunes
export const mockFeedData = [
  {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    foto_perfil: null,
    creado_en: '2023-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'another@example.com',
    username: 'anotheruser',
    display_name: 'Another User',
    foto_perfil: null,
    creado_en: '2023-01-02T00:00:00.000Z'
  }
];

// Helper para esperar y abrir popup de usuario
export const openUserPopup = async (fireEvent, act, waitFor, screen, expect) => {
  const userIcon = document.querySelector('#user-icon-container');
  
  await act(async () => {
    fireEvent.click(userIcon);
  });
  
  await waitFor(() => {
    expect(screen.getByText(/Registro/i)).toBeInTheDocument();
  });
};

// Helper para llenar formulario de registro
export const fillRegistrationForm = async (user, screen, email, password) => {
  const emailInput = screen.getByLabelText(/Email:/i, { selector: '#regEmail' });
  const passwordInput = screen.getByLabelText(/Contraseña:/i, { selector: '#regPass' });
  
  await user.type(emailInput, email);
  await user.type(passwordInput, password);
  
  return {
    emailInput,
    passwordInput,
    submitButton: screen.getByRole('button', { name: /Registrar/i })
  };
};

// Helper para llenar formulario de login
export const fillLoginForm = async (user, screen, email, password) => {
  const emailInput = screen.getByLabelText(/Email:/i, { selector: '#logEmail' });
  const passwordInput = screen.getByLabelText(/Contraseña:/i, { selector: '#logPass' });
  
  await user.type(emailInput, email);
  await user.type(passwordInput, password);
  
  return {
    emailInput,
    passwordInput,
    submitButton: screen.getByRole('button', { name: /Iniciar Sesión/i })
  };
};