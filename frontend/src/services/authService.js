// Servicio de autenticación que interactúa directamente con la API del backend
const API_BASE_URL = '/api/auth';

class AuthService {
  constructor() {
    this.user = this.getStoredUser();
    this.isAuthenticated = !!this.user;
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
      localStorage.setItem('user', JSON.stringify(user));
      this.user = user;
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Error storing user:', error);
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
      this.setStoredUser(data.user);
      return { success: true, user: data.user };
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
      this.setStoredUser(data.user);
      return { success: true, user: data.user };
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

  // Obtener usuario actual
  getCurrentUser() {
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

  // Actualizar username
  async updateUsername(newUsername) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${this.user.id}/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update username failed');
      }

      const data = await response.json();
      this.setStoredUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Update username error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar una instancia singleton
const authService = new AuthService();
export default authService;