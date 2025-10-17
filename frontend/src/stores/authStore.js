import { create } from 'zustand';
import { API_BASE } from '../config/api';

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  // Acciones
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

    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  checkAuth: async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        set({
          user,
          isAuthenticated: true,
          isCheckingAuth: false
        });
      } else {
        // Si el token ha expirado (401), mostrar mensaje y enlace
        if (response.status === 401) {
          set({
            user: null,
            isAuthenticated: false,
            isCheckingAuth: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          });

          // Mostrar mensaje con enlace HTML en el body
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.showSessionExpiredMessage) {
              window.showSessionExpiredMessage();
            }
          }, 100);
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isCheckingAuth: false
          });
        }
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false
      });
    }
  },

  clearError: () => set({ error: null }),
}));

// Función para mostrar mensaje de sesión expirada con enlace HTML
function showSessionExpiredMessage() {
  // Remover mensaje anterior si existe
  const existingMessage = document.getElementById('session-expired-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Crear el mensaje
  const messageDiv = document.createElement('div');
  messageDiv.id = 'session-expired-message';
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    font-family: Arial, sans-serif;
  `;

  messageDiv.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="flex: 1;">
        <strong style="color: #856404;">Sesión expirada</strong>
        <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">
          Tu sesión ha expirado. Por favor,
          <a href="/login" style="color: #007bff; text-decoration: none; font-weight: bold;">
            inicia sesión nuevamente
          </a>.
        </p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: #856404;
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        line-height: 1;
      ">×</button>
    </div>
  `;

  // Agregar al body
  document.body.appendChild(messageDiv);

  // Auto-remover después de 10 segundos
  setTimeout(() => {
    if (messageDiv.parentElement) {
      messageDiv.remove();
    }
  }, 10000);
}

// Hacer la función disponible globalmente
if (typeof window !== 'undefined') {
  window.showSessionExpiredMessage = showSessionExpiredMessage;
}

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