// Servicio centralizado para gestión avanzada de fotos de perfil (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const API_URL = "http://192.168.1.135:3000";

class PhotoProfileService {
  constructor() {
    this.CACHE_KEY = 'fotoPerfil_advanced_cache_rn';
    this.CACHE_DURATION = 30 * 1000; // 30 segundos para actualización rápida
    this.MAX_CACHE_ENTRIES = 50; // Menos entradas en móvil por limitaciones de almacenamiento
    this.API_URL = API_URL;

    // Logger mejorado
    this.logger = {
      info: (message, data) => {
        console.log(`[PhotoProfileServiceRN] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[PhotoProfileServiceRN] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[PhotoProfileServiceRN] ${message}`, data || '');
      }
    };

    // Inicializar limpieza automática de caché
    this.initAutoCleanup();
  }

  // Inicializar limpieza automática de caché antiguo
  async initAutoCleanup() {
    try {
      // Limpiar caché antiguo cada hora (solo una vez por sesión)
      const cleanupKey = 'photoProfileService_cleanup_rn';
      const lastCleanup = await AsyncStorage.getItem(cleanupKey);

      if (!lastCleanup || Date.now() - parseInt(lastCleanup) > 60 * 60 * 1000) {
        await this.cleanupExpiredCache();
        await AsyncStorage.setItem(cleanupKey, Date.now().toString());
      }

      // Configurar limpieza periódica cada 10 minutos (menos frecuente en móvil)
      setInterval(() => {
        this.cleanupExpiredCache();
      }, 10 * 60 * 1000);
    } catch (error) {
      this.logger.warn('Error inicializando limpieza automática', error);
    }
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

  // Gestión avanzada de caché para React Native
  async getCachedImage(userId) {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');
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
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');

      // Limpiar entradas antiguas si excede el límite
      const entries = Object.keys(cache);
      if (entries.length >= this.MAX_CACHE_ENTRIES) {
        const sortedEntries = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const toRemove = sortedEntries.slice(0, entries.length - this.MAX_CACHE_ENTRIES + 5);
        toRemove.forEach(key => {
          delete cache[key];
        });
        this.logger.info('Caché avanzada limpiado, entradas eliminadas:', toRemove.length);
      }

      cache[userId] = {
        url,
        timestamp: Date.now(),
        metadata,
        serviceVersion: '2.0'
      };

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      this.logger.info('Imagen guardada en caché avanzada', { userId, totalEntries: Object.keys(cache).length });
    } catch (error) {
      this.logger.warn('Error al guardar en caché avanzada', error);
    }
  }

  async clearUserCache(userId) {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');
      if (cache[userId]) {
        delete cache[userId];
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Caché avanzada del usuario limpiado', { userId });
      }
    } catch (error) {
      this.logger.warn('Error al limpiar caché avanzada del usuario', error);
    }
  }

  async clearAllCache() {
    try {
      await AsyncStorage.removeItem(this.CACHE_KEY);
      this.logger.info('Caché avanzada limpiado completamente');
    } catch (error) {
      this.logger.warn('Error al limpiar caché avanzada', error);
    }
  }

  async cleanupExpiredCache() {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');
      const now = Date.now();
      let cleanedCount = 0;

      Object.keys(cache).forEach(userId => {
        if (now - cache[userId].timestamp > this.CACHE_DURATION) {
          delete cache[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Limpieza automática de caché avanzada completada', { cleanedEntries: cleanedCount });
      }
    } catch (error) {
      this.logger.warn('Error durante limpieza automática de caché avanzada', error);
    }
  }

  // Método principal para obtener foto de perfil con mecanismos avanzados
  async getProfilePhoto(userId, options = {}) {
    const {
      forceRefresh = false,
      bypassCache = false,
      timeout = 15000, // Timeout más largo para móvil
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

  // Método para forzar actualización inmediata de foto de perfil
  async forceImmediateUpdate(userId, options = {}) {
    const {
      propagateToComponents = true,
      retries = 3
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    this.logger.info('Forzando actualización inmediata', { userId, propagateToComponents });

    try {
      // 1. Limpiar caché del usuario
      await this.clearUserCache(userId);

      // 2. Obtener nueva imagen con mecanismos avanzados
      const photoResult = await this.getProfilePhoto(userId, {
        forceRefresh: true,
        bypassCache: true,
        retries
      });

      // 3. Propagar actualización a componentes si está habilitado
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

  // Método para suscribirse a eventos de actualización (React Native)
  subscribeToUpdates(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback debe ser una función');
    }

    const subscription = DeviceEventEmitter.addListener('photoProfileGlobalUpdate', callback);

    // Retornar función de unsubscribe
    return () => {
      subscription.remove();
    };
  }

  // Método privado para disparar eventos globales (React Native)
  dispatchGlobalUpdate(userId, data) {
    try {
      DeviceEventEmitter.emit('photoProfileGlobalUpdate', {
        userId,
        ...data,
        source: 'PhotoProfileServiceRN',
        version: '2.0'
      });
      this.logger.info('Evento global de actualización disparado', { userId, action: data.action });
    } catch (error) {
      this.logger.error('Error al disparar evento global', error);
    }
  }

  // Método para obtener información de debug
  async getDebugInfo() {
    try {
      const cacheStats = await this.getCacheStats();
      const storageInfo = await this.getStorageInfo();

      return {
        serviceVersion: '2.0',
        cacheStats,
        storageInfo,
        timestamp: Date.now(),
        cacheKey: this.CACHE_KEY,
        cacheDuration: this.CACHE_DURATION,
        maxCacheEntries: this.MAX_CACHE_ENTRIES,
        platform: 'React Native'
      };
    } catch (error) {
      this.logger.error('Error al obtener información de debug', error);
      return null;
    }
  }

  // Obtener estadísticas avanzadas de caché
  async getCacheStats() {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);
      const now = Date.now();

      const stats = {
        totalEntries: entries.length,
        validEntries: 0,
        expiredEntries: 0,
        oldestEntry: null,
        newestEntry: null,
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

  // Obtener información de almacenamiento (React Native específico)
  async getStorageInfo() {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(this.CACHE_KEY) || '{}');
      const cacheSize = JSON.stringify(cache).length;

      return {
        cacheSizeBytes: cacheSize,
        cacheSizeKB: Math.round(cacheSize / 1024),
        estimatedBlobUrls: Object.keys(cache).length // Cada entrada tiene una URL de blob
      };
    } catch (error) {
      this.logger.warn('Error al obtener información de almacenamiento', error);
      return null;
    }
  }
}

// Crear instancia singleton
const photoProfileService = new PhotoProfileService();

export default photoProfileService;