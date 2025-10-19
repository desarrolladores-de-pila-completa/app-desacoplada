// Servicio para manejo avanzado de actualización de nombre de usuario
import { API_BASE } from '../config/api.js';

class UsernameUpdateService {
  constructor() {
    this.API_BASE = API_BASE;
    this.CACHE_KEY = 'username_update_stats';
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para estadísticas

    // Logger mejorado
    this.logger = {
      info: (message, data) => {
        console.log(`[UsernameUpdateService] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[UsernameUpdateService] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[UsernameUpdateService] ${message}`, data || '');
      }
    };

    // Inicializar limpieza automática de caché
    this.initAutoCleanup();
  }

  // Inicializar limpieza automática de caché de estadísticas
  initAutoCleanup() {
    // Limpiar caché antiguo cada 10 minutos
    const cleanupKey = 'usernameUpdateService_cleanup';
    const lastCleanup = localStorage.getItem(cleanupKey);

    if (!lastCleanup || Date.now() - parseInt(lastCleanup) > 10 * 60 * 1000) {
      this.cleanupExpiredCache();
      localStorage.setItem(cleanupKey, Date.now().toString());
    }

    // Configurar limpieza periódica cada 10 minutos
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
  }

  // Función auxiliar para reintento automático mejorada
  async retryFetch(url, options = {}, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || i === maxRetries - 1) {
          return response;
        }
        this.logger.warn(`Intento ${i + 1} falló, reintentando...`, { status: response.status, url });
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        this.logger.warn(`Error de red en intento ${i + 1}, reintentando...`, { error: error.message, url });
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  // Gestión de caché para estadísticas
  async getCachedStats(userId) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const cached = cache[userId];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        this.logger.info('Usando estadísticas desde caché', { userId, age: Date.now() - cached.timestamp });
        return cached.data;
      } else if (cached) {
        this.logger.info('Caché de estadísticas expirado, eliminando entrada', { userId });
        await this.clearUserStatsCache(userId);
      }
    } catch (error) {
      this.logger.warn('Error al leer caché de estadísticas', error);
    }
    return null;
  }

  async setCachedStats(userId, data) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');

      // Mantener solo las últimas 50 entradas
      const entries = Object.keys(cache);
      if (entries.length >= 50) {
        const sortedEntries = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const toRemove = sortedEntries.slice(0, entries.length - 40);
        toRemove.forEach(key => delete cache[key]);
      }

      cache[userId] = {
        data,
        timestamp: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      this.logger.info('Estadísticas guardadas en caché', { userId });
    } catch (error) {
      this.logger.warn('Error al guardar estadísticas en caché', error);
    }
  }

  async clearUserStatsCache(userId) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      if (cache[userId]) {
        delete cache[userId];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Caché de estadísticas del usuario limpiado', { userId });
      }
    } catch (error) {
      this.logger.warn('Error al limpiar caché de estadísticas del usuario', error);
    }
  }

  async cleanupExpiredCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(cache).forEach(userId => {
        if (now - cache[userId].timestamp > this.CACHE_DURATION) {
          delete cache[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Limpieza automática de caché de estadísticas completada', { cleanedEntries: cleanedCount });
      }
    } catch (error) {
      this.logger.warn('Error durante limpieza automática de caché de estadísticas', error);
    }
  }

  /**
   * Método principal para actualizar el nombre de usuario
   */
  async updateUsername(userId, newUsername, options = {}) {
    const {
      timeout = 30000,
      retries = 3,
      skipCacheInvalidation = false,
      skipContentUpdate = false,
      skipRedirects = false
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    if (!newUsername) {
      throw new Error('Nuevo nombre de usuario requerido');
    }

    this.logger.info('Iniciando actualización de username', {
      userId,
      newUsername,
      options: { skipCacheInvalidation, skipContentUpdate, skipRedirects }
    });

    try {
      // Obtener token CSRF
      const csrfResponse = await this.retryFetch(`${this.API_BASE.replace('/api', '')}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      }, retries);

      if (!csrfResponse.ok) {
        throw new Error(`Error al obtener token CSRF: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Crear cuerpo de la solicitud
      const requestBody = {
        username: newUsername,
        skipCacheInvalidation,
        skipContentUpdate,
        skipRedirects
      };

      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await this.retryFetch(`${this.API_BASE}/users/${userId}/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }, retries);

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        this.logger.info('Username actualizado exitosamente', {
          userId,
          oldUsername: result.oldUsername,
          newUsername: result.newUsername,
          executionTimeMs: result.executionTimeMs
        });

        // Limpiar caché de estadísticas después de actualización exitosa
        await this.clearUserStatsCache(userId);

        // Disparar evento global de actualización
        this.dispatchGlobalUpdate(userId, {
          action: 'usernameUpdated',
          oldUsername: result.oldUsername,
          newUsername: result.newUsername,
          timestamp: Date.now()
        });

        return {
          success: true,
          message: 'Nombre de usuario actualizado correctamente',
          data: result,
          timestamp: Date.now()
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(`Error al actualizar username: ${response.status} - ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      this.logger.error('Error durante actualización de username', error);

      if (error.name === 'AbortError') {
        throw new Error('Timeout al actualizar nombre de usuario');
      }

      throw error;
    }
  }

  /**
   * Método para previsualizar cambios sin realizarlos (dry-run)
   */
  async previewUsernameUpdate(userId, newUsername, options = {}) {
    const {
      timeout = 15000,
      retries = 3
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    if (!newUsername) {
      throw new Error('Nuevo nombre de usuario requerido');
    }

    this.logger.info('Iniciando preview de actualización de username', { userId, newUsername });

    try {
      // Verificar si tenemos datos en caché primero
      const cachedStats = await this.getCachedStats(userId);
      if (cachedStats && cachedStats.newUsername === newUsername) {
        this.logger.info('Usando datos de preview desde caché', { userId });
        return {
          success: true,
          message: 'Datos de preview obtenidos desde caché',
          data: cachedStats,
          fromCache: true,
          timestamp: Date.now()
        };
      }

      // Obtener token CSRF
      const csrfResponse = await this.retryFetch(`${this.API_BASE.replace('/api', '')}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      }, retries);

      if (!csrfResponse.ok) {
        throw new Error(`Error al obtener token CSRF: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await this.retryFetch(`${this.API_BASE}/users/${userId}/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          username: newUsername,
          dryRun: true
        }),
        signal: controller.signal
      }, retries);

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        this.logger.info('Preview de username completado exitosamente', {
          userId,
          newUsername,
          canProceed: !result.warnings || result.warnings.length === 0
        });

        // Guardar en caché para futuras consultas
        await this.setCachedStats(userId, result);

        return {
          success: true,
          message: 'Preview completado exitosamente',
          data: result,
          fromCache: false,
          timestamp: Date.now()
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(`Error al obtener preview: ${response.status} - ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      this.logger.error('Error durante preview de username', error);

      if (error.name === 'AbortError') {
        throw new Error('Timeout al obtener preview de nombre de usuario');
      }

      throw error;
    }
  }

  /**
   * Método para obtener estadísticas históricas de actualizaciones
   */
  async getUpdateStatistics(userId, options = {}) {
    const {
      timeout = 10000,
      retries = 3,
      useCache = true
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    this.logger.info('Obteniendo estadísticas de actualización', { userId, useCache });

    try {
      // Verificar caché si está habilitado
      if (useCache) {
        const cachedStats = await this.getCachedStats(userId);
        if (cachedStats && cachedStats.statistics) {
          return {
            success: true,
            message: 'Estadísticas obtenidas desde caché',
            data: cachedStats.statistics,
            fromCache: true,
            timestamp: Date.now()
          };
        }
      }

      // Obtener token CSRF
      const csrfResponse = await this.retryFetch(`${this.API_BASE.replace('/api', '')}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      }, retries);

      if (!csrfResponse.ok) {
        throw new Error(`Error al obtener token CSRF: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await this.retryFetch(`${this.API_BASE}/users/${userId}/username/statistics`, {
        method: 'GET',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        signal: controller.signal
      }, retries);

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        this.logger.info('Estadísticas obtenidas exitosamente', {
          userId,
          totalUpdates: result.totalUpdates,
          redirectsActive: result.redirectsActive
        });

        return {
          success: true,
          message: 'Estadísticas obtenidas exitosamente',
          data: result,
          fromCache: false,
          timestamp: Date.now()
        };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(`Error al obtener estadísticas: ${response.status} - ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de actualización', error);

      if (error.name === 'AbortError') {
        throw new Error('Timeout al obtener estadísticas');
      }

      throw error;
    }
  }

  /**
   * Método para validar username antes de enviar al servidor
   */
  validateUsername(username) {
    const errors = [];
    const warnings = [];

    if (!username) {
      errors.push('El nombre de usuario es requerido');
      return { isValid: false, errors, warnings };
    }

    // Validaciones básicas del frontend
    if (username.length < 3) {
      errors.push('El nombre de usuario debe tener al menos 3 caracteres');
    }

    if (username.length > 20) {
      errors.push('El nombre de usuario no puede tener más de 20 caracteres');
    }

    // Validar caracteres permitidos (letras, números, espacios, guiones, guiones bajos)
    const validPattern = /^[a-zA-Z0-9_\sáéíóúÁÉÍÓÚñÑ-]+$/;
    if (!validPattern.test(username)) {
      errors.push('El nombre de usuario contiene caracteres no permitidos');
    }

    // Validar que no empiece o termine con espacios
    if (username.startsWith(' ') || username.endsWith(' ')) {
      errors.push('El nombre de usuario no puede empezar o terminar con espacios');
    }

    // Validar que no tenga espacios consecutivos
    if (username.includes('  ')) {
      warnings.push('El nombre de usuario tiene espacios consecutivos');
    }

    // Validar que no empiece con números
    if (/^\d/.test(username)) {
      warnings.push('Es recomendable que el nombre de usuario no empiece con números');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Método para suscribirse a eventos de actualización de username
   */
  subscribeToUpdates(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback debe ser una función');
    }

    const handleUpdate = (event) => {
      callback(event.detail);
    };

    window.addEventListener('usernameGlobalUpdate', handleUpdate);

    // Retornar función de unsubscribe
    return () => {
      window.removeEventListener('usernameGlobalUpdate', handleUpdate);
    };
  }

  /**
   * Método privado para disparar eventos globales
   */
  dispatchGlobalUpdate(userId, data) {
    try {
      const event = new CustomEvent('usernameGlobalUpdate', {
        detail: {
          userId,
          ...data,
          source: 'UsernameUpdateService',
          version: '1.0'
        }
      });
      window.dispatchEvent(event);
      this.logger.info('Evento global de actualización disparado', { userId, action: data.action });
    } catch (error) {
      this.logger.error('Error al disparar evento global', error);
    }
  }

  /**
   * Método para limpiar todas las cachés relacionadas con el servicio
   */
  async clearAllCaches() {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      this.logger.info('Todas las cachés del servicio limpiadas');
      return { success: true, message: 'Cachés limpiadas exitosamente' };
    } catch (error) {
      this.logger.error('Error al limpiar cachés', error);
      return { success: false, message: 'Error al limpiar cachés', error: error.message };
    }
  }

  /**
   * Método para obtener información de debug del servicio
   */
  async getDebugInfo() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);

      const stats = {
        totalCachedEntries: entries.length,
        cacheSize: JSON.stringify(cache).length,
        serviceVersion: '1.0',
        cacheKey: this.CACHE_KEY,
        cacheDuration: this.CACHE_DURATION,
        apiBase: this.API_BASE
      };

      // Información de entradas de caché
      if (entries.length > 0) {
        stats.oldestEntry = entries.reduce((oldest, userId) => {
          if (!oldest || cache[userId].timestamp < cache[oldest].timestamp) {
            return userId;
          }
          return oldest;
        }, null);

        stats.newestEntry = entries.reduce((newest, userId) => {
          if (!newest || cache[userId].timestamp > cache[newest].timestamp) {
            return userId;
          }
          return newest;
        }, null);
      }

      return {
        success: true,
        data: stats,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error('Error al obtener información de debug', error);
      return {
        success: false,
        message: 'Error al obtener información de debug',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

// Crear instancia singleton
const usernameUpdateService = new UsernameUpdateService();

export default usernameUpdateService;