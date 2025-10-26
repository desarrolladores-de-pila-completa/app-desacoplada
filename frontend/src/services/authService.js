// Servicio de autenticación que interactúa directamente con la API del backend
import { API_BASE } from '../config/api.js';
const API_BASE_URL = `${API_BASE}/auth`;

class AuthService {
  // Función helper para manejar respuestas y errores de autenticación
  async handleAuthResponse(response) {
    if (response.status === 401) {
      this.clearStoredUser();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error en la solicitud');
    }
    return response.json();
  }

  // Función helper para obtener headers con token
  getAuthHeaders() {
    const user = this.getStoredUser();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': user?.accessToken ? `Bearer ${user.accessToken}` : '',
    };
    console.log('Auth headers:', headers);
    console.log('Usuario en getAuthHeaders:', user);
    return headers;
  }
  constructor() {
    this.user = this.getStoredUser();
    this.isAuthenticated = !!this.user;
    this.checkAuth(); // Verificar sesión al inicializar
  }

  // Obtener usuario almacenado en localStorage
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      if (user && user !== 'undefined') {
        return JSON.parse(user);
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      localStorage.removeItem('user'); // Clear invalid data
      return null;
    }
  }

  // Almacenar usuario en localStorage
  setStoredUser(user) {
    try {
      const userString = JSON.stringify(user);
      console.log('=== DEBUG: Almacenando usuario en localStorage ===', {
        userSize: userString.length,
        userKeys: Object.keys(user),
        timestamp: new Date().toISOString()
      });
      // Verificar si el tamaño excede el límite (aprox 5MB)
      if (userString.length > 4 * 1024 * 1024) {
        console.warn('Usuario demasiado grande para localStorage, limpiando datos innecesarios');
        // Remover campos grandes como tokens si es necesario
        const minimalUser = { ...user };
        delete minimalUser.accessToken;
        delete minimalUser.refreshToken;
        const minimalString = JSON.stringify(minimalUser);
        localStorage.setItem('user', minimalString);
        this.user = minimalUser;
      } else {
        localStorage.setItem('user', userString);
        this.user = user;
      }
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Error storing user:', error);
      // Si falla, intentar con datos mínimos
      try {
        const minimalUser = { id: user.id, username: user.username };
        localStorage.setItem('user', JSON.stringify(minimalUser));
        this.user = minimalUser;
        this.isAuthenticated = true;
      } catch (e) {
        console.error('Error crítico: No se pudo almacenar usuario', e);
      }
    }
  }

  // Eliminar usuario de localStorage
  clearStoredUser() {
    try {
      localStorage.removeItem('user');
      this.user = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  }

  // Verificar autenticación actual
  async checkAuth() {
    if (this.user) {
      return { success: true, user: this.user };
    } else {
      return { success: false, error: 'No autenticado' };
    }
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      this.setStoredUser(data);
      return { success: true, user: data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  // Register
  async register(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('Register data:', data);
      console.log('Tokens recibidos en frontend register:', { accessToken: !!data.accessToken, refreshToken: !!data.refreshToken });
      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Tokens de acceso no recibidos del servidor');
      }
      this.setStoredUser(data);
      console.log('Usuario almacenado en localStorage después de registro:', this.getStoredUser());
      return { success: true, user: data };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearStoredUser();
    }
  }

  // Obtener usuario actual (verifica con el servidor)
  getCurrentUser() {
    if (!this.user) {
      // Since checkAuth is async, but for simplicity, just return null if no user
      // In future, if needed, make callers await
      return null;
    }
    return this.user;
  }

  // Verificar si está autenticado
  isLoggedIn() {
    return this.isAuthenticated;
  }

  // Obtener usuario por username (para perfiles públicos)
  async getUserByUsername(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/${username}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('User not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  // Actualizar foto de perfil
  async updateProfilePhoto(photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await fetch(`${API_BASE_URL}/profile-photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update photo failed');
      }

      const data = await response.json();
      this.setStoredUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Update profile photo error:', error);
      return { success: false, error: error.message };
    }
  }

}

// Exportar una instancia singleton
const authService = new AuthService();
export default authService;