// Servicio centralizado para gestión avanzada de fotos de perfil
import { API_URL } from '../config/api.js';

class PhotoProfileService {
  constructor() {
    this.CACHE_KEY = 'fotoPerfil_advanced_cache';
    this.CACHE_DURATION = 30 * 1000; // 30 segundos para actualización rápida
    this.MAX_CACHE_ENTRIES = 100;
    this.API_URL = API_URL;

    // Logger mejorado
    this.logger = {
      info: (message, data) => {
        console.log(`[PhotoProfileService] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[PhotoProfileService] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[PhotoProfileService] ${message}`, data || '');
      }
    };

    // Inicializar limpieza automática de caché
    this.initAutoCleanup();
  }

  // Inicializar limpieza automática de caché antiguo
  initAutoCleanup() {
    // Limpiar caché antiguo cada hora (solo una vez por sesión)
    const cleanupKey = 'photoProfileService_cleanup';
    const lastCleanup = localStorage.getItem(cleanupKey);

    if (!lastCleanup || Date.now() - parseInt(lastCleanup) > 60 * 60 * 1000) {
      this.cleanupExpiredCache();
      localStorage.setItem(cleanupKey, Date.now().toString());
    }

    // Configurar limpieza periódica cada 5 minutos
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
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

  // Gestión avanzada de caché
  async getCachedImage(userId) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const cached = cache[userId];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        this.logger.info('Usando imagen desde caché avanzada', { userId, age: Date.now() - cached.timestamp });
        return cached;
      } else if (cached) {
        this.logger.info('Caché expirado, eliminando entrada', { userId, age: Date.now() - cached.timestamp });
        await this.clearUserCache(userId);
      }
    } catch (error) {
      this.logger.warn('Error al leer caché avanzada', error);
    }
    return null;
  }

  async setCachedImage(userId, url, metadata = {}) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');

      // Limpiar entradas antiguas si excede el límite
      const entries = Object.keys(cache);
      if (entries.length >= this.MAX_CACHE_ENTRIES) {
        const sortedEntries = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const toRemove = sortedEntries.slice(0, entries.length - this.MAX_CACHE_ENTRIES + 10);
        toRemove.forEach(key => {
          this.revokeObjectURL(cache[key].url);
          delete cache[key];
        });
        this.logger.info('Caché avanzada limpiado, entradas eliminadas:', toRemove.length);
      }

      // Si ya existe una entrada para este usuario, revocar la URL anterior
      if (cache[userId]) {
        this.revokeObjectURL(cache[userId].url);
      }

      cache[userId] = {
        url,
        timestamp: Date.now(),
        metadata,
        serviceVersion: '2.0'
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      this.logger.info('Imagen guardada en caché avanzada', { userId, totalEntries: Object.keys(cache).length });
    } catch (error) {
      this.logger.warn('Error al guardar en caché avanzada', error);
    }
  }

  async clearUserCache(userId) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      if (cache[userId]) {
        this.revokeObjectURL(cache[userId].url);
        delete cache[userId];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Caché avanzada del usuario limpiado', { userId });
      }
    } catch (error) {
      this.logger.warn('Error al limpiar caché avanzada del usuario', error);
    }
  }

  async clearAllCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      Object.keys(cache).forEach(userId => {
        this.revokeObjectURL(cache[userId].url);
      });
      localStorage.removeItem(this.CACHE_KEY);
      this.logger.info('Caché avanzada limpiado completamente');
    } catch (error) {
      this.logger.warn('Error al limpiar caché avanzada', error);
    }
  }

  async cleanupExpiredCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(cache).forEach(userId => {
        if (now - cache[userId].timestamp > this.CACHE_DURATION) {
          this.revokeObjectURL(cache[userId].url);
          delete cache[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Limpieza automática de caché avanzada completada', { cleanedEntries: cleanedCount });
      }
    } catch (error) {
      this.logger.warn('Error durante limpieza automática de caché avanzada', error);
    }
  }

  // Función mejorada para limpiar URLs de objetos
  revokeObjectURL(url) {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        this.logger.warn('Error al revocar URL de objeto', { url, error });
      }
    }
  }

  // Obtener estadísticas avanzadas de caché
  async getCacheStats() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);
      const now = Date.now();

      const stats = {
        totalEntries: entries.length,
        validEntries: 0,
        expiredEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        totalSize: 0,
        serviceVersion: '2.0'
      };

      entries.forEach(userId => {
        const entry = cache[userId];
        if (now - entry.timestamp < this.CACHE_DURATION) {
          stats.validEntries++;
          if (!stats.newestEntry || entry.timestamp > cache[stats.newestEntry].timestamp) {
            stats.newestEntry = userId;
          }
        } else {
          stats.expiredEntries++;
        }

        if (!stats.oldestEntry || entry.timestamp < cache[stats.oldestEntry].timestamp) {
          stats.oldestEntry = userId;
        }
      });

      return stats;
    } catch (error) {
      this.logger.warn('Error al obtener estadísticas de caché avanzada', error);
      return null;
    }
  }

  // Método principal para obtener foto de perfil con mecanismos avanzados
  async getProfilePhoto(userId, options = {}) {
    const {
      forceRefresh = false,
      bypassCache = false,
      timeout = 10000,
      retries = 3
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    this.logger.info('Obteniendo foto de perfil', { userId, forceRefresh, bypassCache });

    try {
      // Si no se fuerza refresh y no se bypassa caché, intentar obtener desde caché
      if (!forceRefresh && !bypassCache) {
        const cached = await this.getCachedImage(userId);
        if (cached) {
          return {
            url: cached.url,
            fromCache: true,
            timestamp: cached.timestamp,
            metadata: cached.metadata
          };
        }
      }

      // Limpiar caché del usuario si es un refresh forzado
      if (forceRefresh) {
        await this.clearUserCache(userId);
      }

      // Crear URL con timestamp único para evitar caché del navegador
      const timestamp = Date.now();
      const refreshKey = Math.random().toString(36).substring(7);
      const photoUrl = `${this.API_URL}/api/auth/user/${userId}/foto?_t=${timestamp}&_r=${refreshKey}`;

      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await this.retryFetch(photoUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        }, retries);

        clearTimeout(timeoutId);

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);

          // Guardar en caché avanzada
          await this.setCachedImage(userId, objectUrl, {
            size: blob.size,
            type: blob.type,
            lastModified: response.headers.get('last-modified')
          });

          this.logger.info('Foto de perfil obtenida exitosamente', {
            userId,
            size: blob.size,
            fromCache: false
          });

          return {
            url: objectUrl,
            fromCache: false,
            timestamp: Date.now(),
            size: blob.size,
            type: blob.type,
            metadata: {
              lastModified: response.headers.get('last-modified')
            }
          };
        } else {
          throw new Error(`Error HTTP: ${response.status}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout al obtener foto de perfil');
        }
        throw fetchError;
      }
    } catch (error) {
      this.logger.error('Error al obtener foto de perfil', error);
      throw error;
    }
  }

  // Método para subir foto de perfil con mecanismos avanzados
  async uploadProfilePhoto(userId, file, options = {}) {
    const {
      timeout = 30000,
      retries = 3,
      onProgress
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    if (!file) {
      throw new Error('Archivo requerido');
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Archivo demasiado grande. Máximo 5MB permitido.');
    }

    this.logger.info('Iniciando subida de foto de perfil', { userId, fileSize: file.size, fileType: file.type });

    try {
      // Obtener token CSRF
      const csrfResponse = await this.retryFetch(`${this.API_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      }, retries);

      if (!csrfResponse.ok) {
        throw new Error(`Error al obtener token CSRF: ${csrfResponse.status}`);
      }

      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Crear FormData
      const formData = new FormData();
      formData.append('photo', file);

      // Configurar timeout y progreso si está disponible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: formData,
        signal: controller.signal
      };

      // Agregar soporte para progreso si la API lo soporta
      if (onProgress && typeof onProgress === 'function') {
        // Nota: El progreso real depende de la implementación del servidor
        fetchOptions.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      const response = await this.retryFetch(`${this.API_URL}/api/auth/profile-photo`, fetchOptions, retries);

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();

        this.logger.info('Foto subida exitosamente', { userId });

        // Limpiar caché después de subida exitosa
        await this.clearUserCache(userId);

        // Disparar evento global de actualización
        this.dispatchGlobalUpdate(userId, {
          action: 'upload',
          timestamp: Date.now(),
          fileSize: file.size,
          fileType: file.type
        });

        return {
          success: true,
          message: 'Foto de perfil actualizada correctamente',
          timestamp: Date.now(),
          fileSize: file.size,
          fileType: file.type
        };
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error al subir foto: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      this.logger.error('Error durante subida de foto', error);
      throw error;
    }
  }

  // Método para forzar actualización inmediata de foto de perfil
  async forceImmediateUpdate(userId, options = {}) {
    const {
      propagateToComponents = true,
      clearBrowserCache = true,
      retries = 3
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    this.logger.info('Forzando actualización inmediata', { userId, propagateToComponents, clearBrowserCache });

    try {
      // 1. Limpiar caché del usuario
      await this.clearUserCache(userId);

      // 2. Limpiar caché del navegador si está habilitado
      if (clearBrowserCache && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          this.logger.info('Caché del navegador limpiado');
        } catch (cacheError) {
          this.logger.warn('Error al limpiar caché del navegador', cacheError);
        }
      }

      // 3. Obtener nueva imagen con mecanismos avanzados
      const photoResult = await this.getProfilePhoto(userId, {
        forceRefresh: true,
        bypassCache: true,
        retries
      });

      // 4. Propagar actualización a componentes si está habilitado
      if (propagateToComponents) {
        this.dispatchGlobalUpdate(userId, {
          action: 'forceRefresh',
          timestamp: Date.now(),
          url: photoResult.url,
          fromCache: photoResult.fromCache,
          refreshKey: Math.random().toString(36).substring(7)
        });
      }

      this.logger.info('Actualización inmediata completada', { userId });

      return {
        success: true,
        url: photoResult.url,
        timestamp: photoResult.timestamp,
        fromCache: photoResult.fromCache,
        metadata: photoResult.metadata
      };
    } catch (error) {
      this.logger.error('Error durante actualización inmediata', error);
      throw error;
    }
  }

  // Método para suscribirse a eventos de actualización
  subscribeToUpdates(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback debe ser una función');
    }

    const handleUpdate = (event) => {
      callback(event.detail);
    };

    window.addEventListener('photoProfileGlobalUpdate', handleUpdate);

    // Retornar función de unsubscribe
    return () => {
      window.removeEventListener('photoProfileGlobalUpdate', handleUpdate);
    };
  }

  // Método privado para disparar eventos globales
  dispatchGlobalUpdate(userId, data) {
    try {
      const event = new CustomEvent('photoProfileGlobalUpdate', {
        detail: {
          userId,
          ...data,
          source: 'PhotoProfileService',
          version: '2.0'
        }
      });
      window.dispatchEvent(event);
      this.logger.info('Evento global de actualización disparado', { userId, action: data.action });
    } catch (error) {
      this.logger.error('Error al disparar evento global', error);
    }
  }

  // Método para obtener información de debug
  async getDebugInfo() {
    try {
      const cacheStats = await this.getCacheStats();
      const memoryUsage = performance?.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null;

      return {
        serviceVersion: '2.0',
        cacheStats,
        memoryUsage,
        timestamp: Date.now(),
        cacheKey: this.CACHE_KEY,
        cacheDuration: this.CACHE_DURATION,
        maxCacheEntries: this.MAX_CACHE_ENTRIES
      };
    } catch (error) {
      this.logger.error('Error al obtener información de debug', error);
      return null;
    }
  }
}

// Crear instancia singleton
const photoProfileService = new PhotoProfileService();

export default photoProfileService;