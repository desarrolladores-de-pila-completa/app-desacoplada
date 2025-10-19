import { create } from 'zustand';
import { API_BASE } from '../config/api';

const useAuthStore = create((set, get) => ({
  // Estado básico
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  // Acciones básicas
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error en el login');
      }

      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Guardar datos básicos en localStorage
      localStorage.setItem('authUser', JSON.stringify(data));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error en el registro');
      }

      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Guardar datos básicos en localStorage
      localStorage.setItem('authUser', JSON.stringify(data));

      return { success: true, data };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    // Limpiar estado básico
    get().clearAuthState();
  },

  checkAuth: async () => {
    try {
      // Obtener username del estado actual o localStorage
      const currentState = get();
      let currentUsername = currentState.user?.username;

      if (!currentUsername) {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            currentUsername = parsedUser.username;
          } catch (e) {
            console.log('❌ Error al parsear usuario de localStorage');
          }
        }
      }

      if (!currentUsername) {
        get().clearAuthState();
        return;
      }

      const response = await fetch(`${API_BASE}/auth/${currentUsername}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        set({
          user,
          isAuthenticated: true,
          isCheckingAuth: false
        });
        localStorage.setItem('authUser', JSON.stringify(user));
        // Registrar timestamp de verificación exitosa
        localStorage.setItem('lastAuthVerification', Date.now().toString());
        console.log('✅ Sesión verificada correctamente con servidor');
      } else if (response.status === 401) {
        // Token expirado, intentar refresh
        try {
          const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            const retryResponse = await fetch(`${API_BASE}/auth/${currentUsername}`, {
              credentials: 'include',
            });

            if (retryResponse.ok) {
              const user = await retryResponse.json();
              set({
                user,
                isAuthenticated: true,
                isCheckingAuth: false
              });
              localStorage.setItem('authUser', JSON.stringify(user));
              return;
            }
          }
        } catch (refreshError) {
          console.error('❌ Error en refresh automático:', refreshError);
        }

        // Si el refresh falla, limpiar estado
        set({
          user: null,
          isAuthenticated: false,
          isCheckingAuth: false,
          error: 'Sesión expirada'
        });
        console.log('❌ Sesión expirada - usuario deslogueado');
      } else {
        set({
          isCheckingAuth: false,
          error: 'Error al verificar sesión'
        });
        console.log('❌ Error al verificar sesión con servidor');
      }
    } catch (error) {
      console.error('❌ Error en checkAuth:', error);
      set({
        isCheckingAuth: false,
        error: 'Error de conexión'
      });
    }
  },

  // Nueva función optimizada que solo verifica cuando es necesario
  verifyAuthIfNeeded: async () => {
    const currentState = get();

    // Si ya estamos verificando, no hacer otra petición
    if (currentState.isCheckingAuth) {
      return;
    }

    // Si no hay usuario autenticado, no necesitamos verificar
    if (!currentState.isAuthenticated || !currentState.user?.username) {
      return;
    }

    // Si el usuario ya está cargado y verificado recientemente, no necesitamos verificar de nuevo
    const lastVerification = localStorage.getItem('lastAuthVerification');
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos

    if (lastVerification && (now - parseInt(lastVerification)) < fiveMinutes) {
      console.log('✅ Verificación reciente encontrada, omitiendo checkAuth');
      set({ isCheckingAuth: false });
      return;
    }

    // Solo entonces hacer la verificación completa
    console.log('🔄 Verificación necesaria, ejecutando checkAuth');
    await get().checkAuth();
  },

  clearError: () => set({ error: null }),

  // Inicializar estado desde localStorage inmediatamente al cargar la app
  initializeFromStorage: () => {
    try {
      const savedUser = localStorage.getItem('authUser');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        set({
          user: parsedUser,
          isAuthenticated: true,
          isCheckingAuth: true, // Mantiene como true hasta verificar con servidor
          error: null
        });
        console.log('✅ Estado inicializado desde localStorage:', parsedUser.username);
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isCheckingAuth: true, // Estado inicial de carga
          error: null
        });
      }
    } catch (error) {
      console.error('❌ Error al inicializar desde localStorage:', error);
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: true,
        error: null
      });
    }
  },

  // Función simplificada para limpiar el estado
  clearAuthState: () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('lastAuthVerification');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      isCheckingAuth: false
    });
  },
}));

// Función auxiliar para obtener CSRF token
async function getCsrfToken() {
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Error al obtener token CSRF: ${res.status}`);
  }
  const data = await res.json();
  return data.csrfToken;
}

export default useAuthStore;