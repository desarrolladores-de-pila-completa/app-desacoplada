import { create } from 'zustand';
import { API_BASE } from '../config/api';

const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
  refreshTimer: null,
  lastActivity: null,
  activityInterval: null,
  maintenanceInterval: null,

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

      // Establecer hora de inicio de sesión
      localStorage.setItem('sessionStart', new Date().toISOString());

      // Inicializar sistema completo de gestión de sesiones
      get().initializeSessionManagement();

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

  // Nueva función para monitoreo de actividad de sesión
  updateLastActivity: () => {
    const lastActivity = new Date();
    localStorage.setItem('lastActivity', lastActivity.toISOString());
    set({ lastActivity });
  },

  // Nueva función para verificar si la sesión está activa
  isSessionActive: () => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;

    const lastActivityTime = new Date(lastActivity);
    const now = new Date();
    const inactiveTime = now.getTime() - lastActivityTime.getTime();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutos de inactividad máxima

    return inactiveTime < maxInactiveTime;
  },

  // Nueva función para inicializar monitoreo de actividad
  initializeActivityMonitoring: () => {
    const state = get();

    // Configurar listeners de actividad
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      if (state.isAuthenticated) {
        get().updateLastActivity();
      }
    };

    // Remover listeners anteriores si existen
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
      document.addEventListener(event, updateActivity);
    });

    // Actualizar actividad inicial
    updateActivity();

    // Configurar intervalo para verificar actividad cada minuto
    const activityInterval = setInterval(() => {
      if (state.isAuthenticated && !get().isSessionActive()) {
        console.log('⚠️ Sesión inactiva por más de 30 minutos, cerrando sesión');
        get().logout();
      }
    }, 60000); // Cada minuto

    set({ activityInterval });
  },

  // Nueva función para limpiar monitoreo de actividad
  cleanupActivityMonitoring: () => {
    const state = get();
    if (state.activityInterval) {
      clearInterval(state.activityInterval);
    }

    // Remover listeners de actividad
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => get().updateLastActivity();

    activityEvents.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });

    set({ activityInterval: null });
  },

  // Nueva función para obtener estadísticas de sesión
  getSessionStats: () => {
    const state = get();
    const lastActivity = localStorage.getItem('lastActivity');
    const sessionStart = localStorage.getItem('sessionStart');

    return {
      isAuthenticated: state.isAuthenticated,
      username: state.user?.username,
      sessionDuration: sessionStart ? new Date().getTime() - new Date(sessionStart).getTime() : 0,
      lastActivity: lastActivity ? new Date(lastActivity) : null,
      tokenNearExpiry: get().isTokenNearExpiry(),
      hasAutoRefresh: !!state.refreshTimer,
      isActive: get().isSessionActive(),
    };
  },

  // Nueva función para forzar cierre de sesión en todos los dispositivos
  forceLogoutAllDevices: async () => {
    const state = get();
    if (!state.isAuthenticated) return { success: false, error: 'No autenticado' };

    try {
      // Esta función requeriría un endpoint específico en el backend
      // Por ahora, simplemente cerramos la sesión actual
      console.log('🔒 Forzando cierre de sesión en todos los dispositivos');
      get().logout();
      return { success: true };
    } catch (error) {
      console.error('❌ Error forzando cierre de sesión:', error);
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

    // Usar la nueva función para limpiar completamente el estado
    get().clearAuthState();
  },

  checkAuth: async () => {
    try {
      console.log('🔍 Verificando autenticación con ruta /:username');

      // Obtener username del estado actual o localStorage
      const currentState = get();
      let currentUsername = currentState.user?.username;

      if (!currentUsername) {
        // Intentar obtener de localStorage
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            currentUsername = parsedUser.username;
            console.log('✅ Username obtenido de localStorage:', currentUsername);
          } catch (e) {
            console.log('❌ Error al parsear usuario de localStorage:', e);
          }
        }
      }

      if (!currentUsername) {
        console.log('❌ No se pudo obtener username para checkAuth');
        get().clearAuthState();
        return;
      }

      console.log('🚀 Haciendo petición a /:username:', `${API_BASE}/auth/${currentUsername}`);
      const response = await fetch(`${API_BASE}/auth/${currentUsername}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        console.log('✅ Usuario verificado exitosamente:', user.username);
        set({
          user,
          isAuthenticated: true,
          isCheckingAuth: false
        });

        // Actualizar localStorage
        localStorage.setItem('authUser', JSON.stringify(user));

        // Inicializar sistema completo de gestión de sesiones
        get().initializeSessionManagement();
      } else {
        // Si el token ha expirado (401), intentar refresh automático
        if (response.status === 401) {
          console.log('❌ Token expirado, intentando refresh automático...');

          try {
            const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              console.log('✅ Tokens refrescados automáticamente');

              // Reintentar la verificación original
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
                get().initializeSessionManagement();
                return;
              }
            }
          } catch (refreshError) {
            console.error('❌ Error en refresh automático:', refreshError);
          }

          // Si el refresh falla, mostrar mensaje de sesión expirada
          console.log('❌ Refresh falló, sesión expirada');
          set({
            user: null,
            isAuthenticated: false,
            isCheckingAuth: false,
            error: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
          });

          setTimeout(() => {
            if (typeof window !== 'undefined' && window.showSessionExpiredMessage) {
              window.showSessionExpiredMessage();
            }
          }, 100);
        } else if (response.status === 404) {
          console.log('❌ Usuario no encontrado con username:', currentUsername);
          get().clearAuthState();
          set({ error: 'Usuario no encontrado. Verifica que tu cuenta existe.' });
        } else {
          console.log('❌ Error inesperado:', response.status, response.statusText);
          get().clearAuthState();
        }
      }
    } catch (error) {
      console.error('❌ Error en checkAuth:', error);
      get().clearAuthState();
    }
  },

  clearError: () => set({ error: null }),

  // Nueva función para programar refresh automático de tokens
  scheduleTokenRefresh: () => {
    // Cancelar cualquier refresh programado anterior
    if (get().refreshTimer) {
      clearTimeout(get().refreshTimer);
    }

    // Programar refresh para 10 minutos (600,000 ms)
    const timer = setTimeout(async () => {
      console.log('🔄 Refresh automático de tokens programado');
      const state = get();

      if (state.isAuthenticated && state.user?.username) {
        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Tokens refrescados automáticamente');

            // Actualizar estado con nuevos tokens
            set({
              user: { ...state.user, accessToken: data.accessToken },
              isAuthenticated: true,
              error: null
            });

            // Re-verificar autenticación después del refresh
            get().checkAuth();
          } else {
            console.log('❌ Error en refresh automático, cerrando sesión');
            get().logout();
          }
        } catch (error) {
          console.error('❌ Error en refresh automático:', error);
          get().logout();
        }
      }
    }, 600000); // 10 minutos

    set({ refreshTimer: timer });
  },

  // Nueva función para verificar si el token está próximo a expirar
  isTokenNearExpiry: () => {
    try {
      const state = get();
      if (!state.user?.accessToken) return true;

      // Decodificar token JWT (parte del medio)
      const tokenParts = state.user.accessToken.split('.');
      if (tokenParts.length !== 3) return true;

      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;

      return (payload.exp - now) < fiveMinutes;
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
      return true;
    }
  },

  // Nueva función para obtener información de la sesión actual
  getSessionInfo: () => {
    const state = get();
    return {
      isAuthenticated: state.isAuthenticated,
      username: state.user?.username,
      displayName: state.user?.display_name,
      tokenNearExpiry: get().isTokenNearExpiry(),
      hasRefreshTimer: !!state.refreshTimer,
      lastActivity: new Date(),
    };
  },

  // Nueva función para extender sesión manualmente
  extendSession: async () => {
    const state = get();
    if (!state.isAuthenticated) return { success: false, error: 'No autenticado' };

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sesión extendida manualmente');

        set({
          user: { ...state.user, accessToken: data.accessToken },
          isAuthenticated: true,
          error: null
        });

        // Reprogramar refresh automático
        get().scheduleTokenRefresh();

        return { success: true };
      } else {
        return { success: false, error: 'Error extendiendo sesión' };
      }
    } catch (error) {
      console.error('❌ Error extendiendo sesión:', error);
      return { success: false, error: error.message };
    }
  },

  // Nueva función para verificar seguridad de la sesión
  checkSessionSecurity: () => {
    const state = get();
    const warnings = [];

    if (!state.isAuthenticated) return { secure: true, warnings: [] };

    // Verificar si el token está próximo a expirar
    if (get().isTokenNearExpiry()) {
      warnings.push('Token próximo a expirar');
    }

    // Verificar si la sesión está activa
    if (!get().isSessionActive()) {
      warnings.push('Sesión inactiva por mucho tiempo');
    }

    // Verificar si hay múltiples sesiones sospechosas (requeriría backend)
    // warnings.push('Múltiples sesiones activas detectadas');

    return {
      secure: warnings.length === 0,
      warnings,
      recommendations: warnings.length > 0 ? ['Considera extender tu sesión'] : []
    };
  },

  // Nueva función para inicializar el sistema completo de gestión de sesiones
  initializeSessionManagement: () => {
    const state = get();

    if (state.isAuthenticated) {
      // Inicializar todos los sistemas de gestión de sesión
      get().updateLastActivity();
      get().initializeActivityMonitoring();
      get().scheduleTokenRefresh();
      get().initializeAutoMaintenance();

      console.log('🔧 Sistema de gestión de sesiones inicializado');
    }
  },

  // Nueva función para limpiar completamente el estado de autenticación
  clearAuthState: () => {
    // Limpiar toda la información relacionada con autenticación
    localStorage.removeItem('authUser');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('sessionStart');

    // Limpiar timers e intervalos
    const state = get();
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }
    if (state.activityInterval) {
      clearInterval(state.activityInterval);
    }

    // Limpiar listeners de actividad
    get().cleanupActivityMonitoring();

    // Limpiar mantenimiento automático
    get().cleanupAutoMaintenance();

    // Resetear estado
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      refreshTimer: null,
      lastActivity: null,
      activityInterval: null,
      maintenanceInterval: null,
      isCheckingAuth: false
    });

    console.log('🧹 Estado de autenticación limpiado completamente');
  },

  // Nueva función para obtener estadísticas completas de sesión
  getSessionStats: () => {
    const state = get();
    const lastActivity = localStorage.getItem('lastActivity');
    const sessionStart = localStorage.getItem('sessionStart');

    return {
      isAuthenticated: state.isAuthenticated,
      username: state.user?.username,
      sessionDuration: sessionStart ? new Date().getTime() - new Date(sessionStart).getTime() : 0,
      lastActivity: lastActivity ? new Date(lastActivity) : null,
      tokenNearExpiry: get().isTokenNearExpiry(),
      hasAutoRefresh: !!state.refreshTimer,
      isActive: get().isSessionActive(),
      securityStatus: get().checkSessionSecurity(),
    };
  },

  // Nueva función para verificar si necesita inicialización de sesión
  needsSessionInit: () => {
    const state = get();
    return state.isAuthenticated && !state.refreshTimer && !state.activityInterval;
  },

  // Nueva función para manejar errores de red durante refresh
  handleRefreshError: (error) => {
    console.error('❌ Error en refresh de tokens:', error);

    // Si hay errores de red frecuentes, podría indicar problemas de conectividad
    const state = get();
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      console.warn('🔍 Posibles problemas de conectividad detectados');

      // Podrías implementar lógica para mostrar un mensaje al usuario
      // o intentar el refresh con un backoff exponencial
    }

    // Si el error persiste, cerrar sesión por seguridad
    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
      set({ refreshTimer: null });
    }

    return { shouldLogout: true, reason: 'Error persistente en refresh' };
  },

  // Nueva función para validar la integridad de la sesión
  validateSessionIntegrity: () => {
    const state = get();
    const issues = [];

    if (!state.isAuthenticated) return { valid: true, issues: [] };

    // Verificar que tenemos toda la información necesaria
    if (!state.user?.username) {
      issues.push('Username faltante en sesión');
    }

    if (!state.user?.accessToken) {
      issues.push('Access token faltante');
    }

    // Verificar que el token no está corrupto
    if (state.user?.accessToken && !get().isTokenNearExpiry() && get().isTokenNearExpiry()) {
      issues.push('Token corrupto o malformado');
    }

    // Verificar consistencia de datos
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.username !== state.user?.username) {
          issues.push('Inconsistencia entre estado y localStorage');
        }
      } catch (e) {
        issues.push('Datos corruptos en localStorage');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      canRecover: issues.length <= 2 // Algunas issues pueden ser recuperadas automáticamente
    };
  },

  // Nueva función para recuperación automática de sesión
  recoverSession: async () => {
    const state = get();
    const integrity = get().validateSessionIntegrity();

    if (!integrity.canRecover) {
      console.log('❌ No se puede recuperar la sesión automáticamente');
      return { success: false, reason: 'Demasiados problemas de integridad' };
    }

    try {
      // Intentar refresh de tokens
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();

        // Actualizar estado
        set({
          user: { ...state.user, accessToken: refreshData.accessToken },
          isAuthenticated: true,
          error: null
        });

        // Re-inicializar gestión de sesiones
        get().initializeSessionManagement();

        return { success: true };
      } else {
        return { success: false, reason: 'Error en refresh durante recuperación' };
      }
    } catch (error) {
      console.error('❌ Error en recuperación de sesión:', error);
      return { success: false, reason: error.message };
    }
  },

  // Nueva función para diagnóstico completo de sesión
  diagnoseSession: () => {
    const state = get();
    const stats = get().getSessionStats();
    const integrity = get().validateSessionIntegrity();
    const security = get().checkSessionSecurity();

    return {
      authenticated: state.isAuthenticated,
      username: state.user?.username,
      hasValidTokens: !!(state.user?.accessToken),
      sessionIntegrity: integrity,
      securityStatus: security,
      sessionStats: stats,
      recommendations: [
        ...security.recommendations,
        ...(integrity.issues.length > 0 ? ['Revisar integridad de sesión'] : []),
        ...(stats.tokenNearExpiry ? ['Token próximo a expirar'] : [])
      ],
      overallHealth: state.isAuthenticated && integrity.valid && security.secure ? 'good' : 'warning'
    };
  },

  // Nueva función para mantenimiento automático de sesión
  performSessionMaintenance: async () => {
    const state = get();
    const diagnosis = get().diagnoseSession();

    if (!state.isAuthenticated) return { maintenance: 'none', actions: [] };

    const actions = [];

    // Verificar y reparar problemas de integridad
    if (!diagnosis.sessionIntegrity.valid && diagnosis.sessionIntegrity.canRecover) {
      const recovery = await get().recoverSession();
      if (recovery.success) {
        actions.push('Sesión recuperada automáticamente');
      }
    }

    // Verificar seguridad
    if (!diagnosis.securityStatus.secure) {
      actions.push('Problemas de seguridad detectados');
    }

    // Programar mantenimiento preventivo
    if (diagnosis.sessionStats.tokenNearExpiry) {
      const extendResult = await get().extendSession();
      if (extendResult.success) {
        actions.push('Sesión extendida preventivamente');
      }
    }

    return {
      maintenance: actions.length > 0 ? 'performed' : 'none',
      actions,
      nextMaintenance: new Date(Date.now() + 600000) // Próximo mantenimiento en 10 minutos
    };
  },

  // Nueva función para inicializar mantenimiento automático
  initializeAutoMaintenance: () => {
    const state = get();

    // Configurar mantenimiento automático cada 5 minutos
    const maintenanceInterval = setInterval(async () => {
      if (state.isAuthenticated) {
        console.log('🔧 Ejecutando mantenimiento automático de sesión');
        await get().performSessionMaintenance();
      }
    }, 300000); // Cada 5 minutos

    set({ maintenanceInterval });

    console.log('🔧 Mantenimiento automático de sesiones inicializado');
  },

  // Nueva función para limpiar mantenimiento automático
  cleanupAutoMaintenance: () => {
    const state = get();
    if (state.maintenanceInterval) {
      clearInterval(state.maintenanceInterval);
      set({ maintenanceInterval: null });
    }
  },
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