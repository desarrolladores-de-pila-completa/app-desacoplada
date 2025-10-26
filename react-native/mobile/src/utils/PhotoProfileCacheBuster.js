// Mecanismo avanzado de "cache busting" para actualización inmediata sin caché temporal (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';

class PhotoProfileCacheBuster {
  constructor() {
    this.activeRequests = new Map();
    this.bustHistory = new Map();
    this.maxHistoryEntries = 50; // Menos en móvil por limitaciones de memoria

    this.logger = {
      info: (message, data) => {
        console.log(`[PhotoProfileCacheBusterRN] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[PhotoProfileCacheBusterRN] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[PhotoProfileCacheBusterRN] ${message}`, data || '');
      }
    };
  }

  // Generar clave única para cada request de cache busting
  generateBustKey(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${timestamp}_${random}`;
  }

  // Registrar request activo para evitar duplicados
  registerActiveRequest(userId, bustKey) {
    if (!this.activeRequests.has(userId)) {
      this.activeRequests.set(userId, new Set());
    }
    this.activeRequests.get(userId).add(bustKey);

    // Cleanup automático después de 30 segundos
    setTimeout(() => {
      this.unregisterActiveRequest(userId, bustKey);
    }, 30000);
  }

  // Desregistrar request activo
  unregisterActiveRequest(userId, bustKey) {
    if (this.activeRequests.has(userId)) {
      this.activeRequests.get(userId).delete(bustKey);
      if (this.activeRequests.get(userId).size === 0) {
        this.activeRequests.delete(userId);
      }
    }
  }

  // Verificar si hay un request activo para el usuario
  hasActiveRequest(userId) {
    return this.activeRequests.has(userId) && this.activeRequests.get(userId).size > 0;
  }

  // Método principal para obtener imagen sin caché temporal
  async getImageWithoutCache(userId, options = {}) {
    const {
      timeout = 20000, // Timeout más largo para móvil
      retries = 3,
      priority = 'normal',
      metadata = {}
    } = options;

    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    // Verificar si ya hay un request activo
    if (this.hasActiveRequest(userId)) {
      this.logger.warn('Request activo ya existe para usuario, esperando...', { userId });
      // Esperar un poco y reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (this.hasActiveRequest(userId)) {
        throw new Error('Otro proceso de actualización ya está en curso');
      }
    }

    const bustKey = this.generateBustKey(userId);
    this.registerActiveRequest(userId, bustKey);

    try {
      this.logger.info('Iniciando cache busting para usuario', {
        userId,
        bustKey,
        priority,
        metadata
      });

      // Registrar en historial
      this.addToHistory(userId, {
        action: 'cacheBustStart',
        bustKey,
        timestamp: Date.now(),
        priority,
        metadata
      });

      // 1. Limpiar cualquier caché existente
      await this.clearAllCaches(userId);

      // 2. Generar múltiples estrategias de URLs para evitar caché
      const urls = this.generateBustUrls(userId, bustKey);

      // 3. Intentar cada URL con diferentes estrategias
      for (const urlInfo of urls) {
        try {
          const result = await this.fetchWithAdvancedStrategy(urlInfo, {
            timeout,
            retries,
            userId,
            bustKey
          });

          if (result.success) {
            // Registrar éxito en historial
            this.addToHistory(userId, {
              action: 'cacheBustSuccess',
              bustKey,
              urlUsed: urlInfo.url,
              strategy: urlInfo.strategy,
              timestamp: Date.now(),
              responseTime: result.responseTime
            });

            this.logger.info('Cache busting exitoso', {
              userId,
              bustKey,
              strategy: urlInfo.strategy,
              responseTime: result.responseTime
            });

            return {
              success: true,
              url: result.url,
              blob: result.blob,
              metadata: {
                bustKey,
                strategy: urlInfo.strategy,
                responseTime: result.responseTime,
                timestamp: Date.now(),
                ...metadata
              }
            };
          }
        } catch (error) {
          this.logger.warn(`Estrategia fallida: ${urlInfo.strategy}`, {
            userId,
            error: error.message
          });
        }
      }

      throw new Error('Todas las estrategias de cache busting fallaron');
    } finally {
      this.unregisterActiveRequest(userId, bustKey);
    }
  }

  // Generar múltiples URLs con diferentes estrategias de cache busting
  generateBustUrls(userId, bustKey) {
    const baseUrl = `http://192.168.1.135:3000/api/auth/user/${userId}/foto`;
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(7);

    return [
      {
        url: `${baseUrl}?_cb=${bustKey}&_t=${timestamp}&_r=${randomSeed}`,
        strategy: 'queryParams',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache-Bust': bustKey,
          'X-Requested-With': 'XMLHttpRequest'
        }
      },
      {
        url: `${baseUrl}?_ts=${timestamp}&_uid=${userId}&_sid=${randomSeed}`,
        strategy: 'timestampOnly',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Timestamp': timestamp.toString()
        }
      },
      {
        url: `${baseUrl}/${timestamp}?_bust=${bustKey}`,
        strategy: 'pathTimestamp',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    ];
  }

  // Fetch avanzado con diferentes estrategias
  async fetchWithAdvancedStrategy(urlInfo, options) {
    const { timeout, retries, userId, bustKey } = options;
    const startTime = Date.now();

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Crear AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(urlInfo.url, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'User-Agent': `PhotoProfileCacheBusterRN/1.0 (User:${userId})`,
            ...urlInfo.headers
          },
          signal: controller.signal,
          cache: 'no-store'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const blob = await response.blob();

          // Verificar que el blob tenga contenido
          if (blob.size === 0) {
            throw new Error('Blob vacío recibido');
          }

          // Crear URL de objeto con clave única
          const objectUrl = URL.createObjectURL(blob);

          return {
            success: true,
            url: objectUrl,
            blob,
            responseTime: Date.now() - startTime,
            strategy: urlInfo.strategy,
            attempt: attempt + 1
          };
        } else if (attempt === retries - 1) {
          // Último intento fallido
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } else {
          // Esperar antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error(`Timeout después de ${timeout}ms`);
        }

        if (attempt === retries - 1) {
          throw error;
        }

        this.logger.warn(`Intento ${attempt + 1} fallido, reintentando...`, {
          error: error.message,
          strategy: urlInfo.strategy
        });

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // Limpiar todos los cachés posibles (React Native)
  async clearAllCaches(userId) {
    try {
      // 1. Limpiar AsyncStorage relacionado con fotos de perfil
      const keysToRemove = [];
      const keys = await AsyncStorage.getAllKeys();

      keys.forEach(key => {
        if (key.includes('fotoPerfil') ||
            key.includes('photoProfile') ||
            (key.includes('cache') && key.includes('image'))) {
          keysToRemove.push(key);
        }
      });

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      this.logger.info('Todos los cachés limpiados', {
        userId,
        keysRemoved: keysToRemove.length
      });

    } catch (error) {
      this.logger.warn('Error limpiando cachés', error);
    }
  }

  // Agregar entrada al historial
  addToHistory(userId, entry) {
    if (!this.bustHistory.has(userId)) {
      this.bustHistory.set(userId, []);
    }

    const history = this.bustHistory.get(userId);
    history.push(entry);

    // Mantener solo las últimas entradas
    if (history.length > this.maxHistoryEntries) {
      history.splice(0, history.length - this.maxHistoryEntries);
    }
  }

  // Obtener historial de un usuario
  getUserHistory(userId, limit = 10) {
    if (!this.bustHistory.has(userId)) {
      return [];
    }

    const history = this.bustHistory.get(userId);
    return history.slice(-limit);
  }

  // Obtener estadísticas de cache busting
  getStats() {
    const stats = {
      activeRequests: this.activeRequests.size,
      totalHistoryEntries: 0,
      usersWithHistory: this.bustHistory.size,
      activeRequestsByUser: {}
    };

    this.activeRequests.forEach((bustKeys, userId) => {
      stats.activeRequestsByUser[userId] = bustKeys.size;
    });

    this.bustHistory.forEach((history, userId) => {
      stats.totalHistoryEntries += history.length;
    });

    return stats;
  }

  // Método para verificar si una imagen necesita actualización forzada
  async shouldForceUpdate(userId, currentImageInfo) {
    try {
      // Verificar si hay requests activos
      if (this.hasActiveRequest(userId)) {
        return {
          shouldUpdate: true,
          reason: 'activeRequest',
          priority: 'high'
        };
      }

      // Verificar historial reciente
      const recentHistory = this.getUserHistory(userId, 5);
      const recentFailures = recentHistory.filter(entry =>
        entry.action === 'cacheBustError' ||
        entry.action === 'cacheBustTimeout'
      );

      if (recentFailures.length > 0) {
        return {
          shouldUpdate: true,
          reason: 'recentFailures',
          priority: 'medium',
          lastFailure: recentFailures[recentFailures.length - 1].timestamp
        };
      }

      // Verificar si la imagen actual es muy antigua
      if (currentImageInfo && currentImageInfo.timestamp) {
        const age = Date.now() - currentImageInfo.timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutos

        if (age > maxAge) {
          return {
            shouldUpdate: true,
            reason: 'imageTooOld',
            priority: 'low',
            age: age
          };
        }
      }

      return {
        shouldUpdate: false,
        reason: 'noUpdateNeeded'
      };
    } catch (error) {
      this.logger.error('Error verificando si necesita actualización', error);
      return {
        shouldUpdate: false,
        reason: 'checkError'
      };
    }
  }

  // Limpiar historial antiguo
  cleanupHistory() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas

    this.bustHistory.forEach((history, userId) => {
      const filteredHistory = history.filter(entry => entry.timestamp > cutoffTime);
      if (filteredHistory.length !== history.length) {
        this.bustHistory.set(userId, filteredHistory);
      }
    });

    this.logger.info('Historial limpiado');
  }
}

// Crear instancia singleton
const photoProfileCacheBuster = new PhotoProfileCacheBuster();

// Configurar limpieza periódica del historial cada hora
setInterval(() => {
  photoProfileCacheBuster.cleanupHistory();
}, 60 * 60 * 1000);

export default photoProfileCacheBuster;