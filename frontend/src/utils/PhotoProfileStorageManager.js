// Sistema avanzado de gestión y monitoreo de almacenamiento para fotos de perfil
class PhotoProfileStorageManager {
  constructor() {
    this.CACHE_KEY = 'fotoPerfil_cache';
    this.STORAGE_STATS_KEY = 'fotoPerfil_storage_stats';
    this.CLEANUP_LOG_KEY = 'fotoPerfil_cleanup_log';

    // Configuración de límites de almacenamiento
    this.config = {
      maxTotalStorage: 50 * 1024 * 1024, // 50MB total
      maxPerImage: 2 * 1024 * 1024,      // 2MB por imagen
      maxImagesPerUser: 10,               // Máximo 10 imágenes por usuario
      warningThreshold: 70,               // Advertencia al 70% de uso
      criticalThreshold: 85,              // Crítico al 85% de uso
      cleanupThreshold: 90,               // Limpieza automática al 90% de uso
      maxCacheAge: 24 * 60 * 60 * 1000,  // 24 horas máximo en caché
      cleanupInterval: 30 * 60 * 1000,    // Verificar cada 30 minutos
      aggressiveCleanupInterval: 5 * 60 * 1000 // Limpieza agresiva cada 5 minutos cuando esté cerca del límite
    };

    this.logger = {
      info: (message, data) => {
        console.log(`[StorageManager] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[StorageManager] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[StorageManager] ${message}`, data || '');
      }
    };

    this.cleanupTimer = null;
    this.isMonitoring = false;

    // Inicializar estadísticas si no existen
    this.initializeStorageStats();
  }

  // Inicializar estadísticas de almacenamiento
  initializeStorageStats() {
    try {
      if (!localStorage.getItem(this.STORAGE_STATS_KEY)) {
        const initialStats = {
          totalImagesStored: 0,
          totalSizeStored: 0,
          lastCleanup: null,
          cleanupCount: 0,
          largestImageSize: 0,
          averageImageSize: 0,
          storageHistory: [],
          createdAt: Date.now()
        };
        localStorage.setItem(this.STORAGE_STATS_KEY, JSON.stringify(initialStats));
      }
    } catch (error) {
      this.logger.error('Error inicializando estadísticas de almacenamiento', error);
    }
  }

  // Obtener estadísticas detalladas de almacenamiento
  getDetailedStorageStats() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const stats = JSON.parse(localStorage.getItem(this.STORAGE_STATS_KEY) || '{}');

      const entries = Object.keys(cache);
      const now = Date.now();

      // Calcular estadísticas por usuario
      const userStats = {};
      let totalSize = 0;
      let largestImage = { size: 0, userId: null };
      let oldestEntry = { timestamp: now, userId: null };
      let newestEntry = { timestamp: 0, userId: null };

      entries.forEach(userId => {
        const entry = cache[userId];
        if (entry && entry.timestamp) {
          const entrySize = this.estimateEntrySize(entry);

          // Estadísticas por usuario
          if (!userStats[userId]) {
            userStats[userId] = {
              imageCount: 0,
              totalSize: 0,
              oldestImage: now,
              newestImage: 0,
              averageSize: 0
            };
          }

          userStats[userId].imageCount++;
          userStats[userId].totalSize += entrySize;

          if (entry.timestamp < userStats[userId].oldestImage) {
            userStats[userId].oldestImage = entry.timestamp;
          }
          if (entry.timestamp > userStats[userId].newestImage) {
            userStats[userId].newestImage = entry.timestamp;
          }

          // Estadísticas globales
          totalSize += entrySize;

          if (entrySize > largestImage.size) {
            largestImage = { size: entrySize, userId };
          }

          if (!oldestEntry.userId || entry.timestamp < oldestEntry.timestamp) {
            oldestEntry = { timestamp: entry.timestamp, userId };
          }
          if (entry.timestamp > newestEntry.timestamp) {
            newestEntry = { timestamp: entry.timestamp, userId };
          }
        }
      });

      // Calcular promedios por usuario
      Object.keys(userStats).forEach(userId => {
        userStats[userId].averageSize = Math.round(
          userStats[userId].totalSize / userStats[userId].imageCount
        );
      });

      // Calcular porcentajes de uso
      const usagePercentage = (totalSize / this.config.maxTotalStorage) * 100;
      const usageLevel = this.getUsageLevel(usagePercentage);

      // Predicción de cuándo se alcanzará el límite
      const prediction = this.predictStorageLimit(entries.length, totalSize);

      // Crear entrada de historial
      const historyEntry = {
        timestamp: now,
        totalSize,
        imageCount: entries.length,
        usagePercentage,
        usageLevel
      };

      // Mantener solo las últimas 100 entradas de historial
      const currentHistory = stats.storageHistory || [];
      currentHistory.push(historyEntry);
      if (currentHistory.length > 100) {
        currentHistory.splice(0, currentHistory.length - 100);
      }

      // Actualizar estadísticas persistentes
      const updatedStats = {
        ...stats,
        totalImagesStored: entries.length,
        totalSizeStored: totalSize,
        largestImageSize: largestImage.size,
        averageImageSize: entries.length > 0 ? Math.round(totalSize / entries.length) : 0,
        storageHistory: currentHistory,
        lastUpdated: now
      };

      localStorage.setItem(this.STORAGE_STATS_KEY, JSON.stringify(updatedStats));

      return {
        // Información general
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        imageCount: entries.length,
        usagePercentage: usagePercentage.toFixed(2),
        usageLevel,
        maxTotalStorage: this.config.maxTotalStorage,
        maxTotalStorageMB: (this.config.maxTotalStorage / (1024 * 1024)).toFixed(2),

        // Información por usuario
        userStats,

        // Información de entradas específicas
        largestImage,
        oldestEntry,
        newestEntry,

        // Estado del sistema
        needsCleanup: usagePercentage > this.config.cleanupThreshold,
        needsWarning: usagePercentage > this.config.warningThreshold,
        isCritical: usagePercentage > this.config.criticalThreshold,

        // Predicción
        prediction,

        // Estadísticas históricas
        storageHistory: currentHistory.slice(-10), // Últimas 10 mediciones
        statsUpdated: updatedStats
      };

    } catch (error) {
      this.logger.error('Error obteniendo estadísticas detalladas de almacenamiento', error);
      return {
        error: error.message,
        totalSize: 0,
        imageCount: 0,
        usagePercentage: 0,
        needsCleanup: false
      };
    }
  }

  // Estimar tamaño de una entrada en localStorage
  estimateEntrySize(entry) {
    try {
      // Convertir entrada a string y calcular tamaño en UTF-16
      const entryString = JSON.stringify(entry);
      return entryString.length * 2; // UTF-16 usa 2 bytes por carácter
    } catch (error) {
      this.logger.warn('Error estimando tamaño de entrada', error);
      return 1024; // Estimación por defecto de 1KB
    }
  }

  // Determinar nivel de uso basado en porcentaje
  getUsageLevel(percentage) {
    if (percentage >= this.config.criticalThreshold) {
      return 'critical';
    } else if (percentage >= this.config.warningThreshold) {
      return 'warning';
    } else if (percentage >= 50) {
      return 'moderate';
    } else {
      return 'low';
    }
  }

  // Predecir cuándo se alcanzará el límite de almacenamiento
  predictStorageLimit(currentImageCount, currentSize) {
    try {
      const stats = JSON.parse(localStorage.getItem(this.STORAGE_STATS_KEY) || '{}');
      const history = stats.storageHistory || [];

      if (history.length < 2) {
        return {
          daysToLimit: null,
          growthRate: 0,
          prediction: 'insufficient_data'
        };
      }

      // Calcular tasa de crecimiento promedio (últimas 10 mediciones)
      const recentHistory = history.slice(-10);
      const timeSpan = recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp;
      const sizeGrowth = recentHistory[recentHistory.length - 1].totalSize - recentHistory[0].totalSize;

      if (timeSpan === 0) {
        return {
          daysToLimit: null,
          growthRate: 0,
          prediction: 'no_growth'
        };
      }

      const growthRatePerMs = sizeGrowth / timeSpan;
      const growthRatePerDay = growthRatePerMs * 24 * 60 * 60 * 1000;

      if (growthRatePerDay <= 0) {
        return {
          daysToLimit: null,
          growthRate: 0,
          prediction: 'stable'
        };
      }

      const remainingSize = this.config.maxTotalStorage - currentSize;
      const daysToLimit = remainingSize / growthRatePerDay;

      return {
        daysToLimit: Math.round(daysToLimit * 100) / 100,
        growthRate: Math.round(growthRatePerDay),
        growthRateMB: (growthRatePerDay / (1024 * 1024)).toFixed(2),
        prediction: daysToLimit < 7 ? 'urgent' : daysToLimit < 30 ? 'warning' : 'normal'
      };

    } catch (error) {
      this.logger.error('Error prediciendo límite de almacenamiento', error);
      return {
        daysToLimit: null,
        growthRate: 0,
        prediction: 'error'
      };
    }
  }

  // Iniciar monitoreo automático de almacenamiento
  startMonitoring() {
    if (this.isMonitoring) {
      this.logger.warn('Monitoreo ya está activo');
      return;
    }

    this.logger.info('Iniciando monitoreo automático de almacenamiento');
    this.isMonitoring = true;

    // Verificación periódica normal
    this.cleanupTimer = setInterval(() => {
      this.performMaintenanceCheck();
    }, this.config.cleanupInterval);

    // Verificación más frecuente cuando se acerque al límite
    this.startAggressiveMonitoring();
  }

  // Detener monitoreo automático
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.logger.info('Deteniendo monitoreo automático de almacenamiento');
    this.isMonitoring = false;

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.stopAggressiveMonitoring();
  }

  // Verificación agresiva cuando se acerca al límite
  startAggressiveMonitoring() {
    const stats = this.getDetailedStorageStats();
    if (stats.usagePercentage > this.config.warningThreshold) {
      this.logger.info('Iniciando monitoreo agresivo debido a alto uso de almacenamiento');

      this.aggressiveTimer = setInterval(() => {
        const currentStats = this.getDetailedStorageStats();
        if (currentStats.usagePercentage > this.config.criticalThreshold) {
          this.logger.warn('Uso crítico de almacenamiento detectado', currentStats);
          this.performEmergencyCleanup();
        } else if (currentStats.usagePercentage <= this.config.warningThreshold) {
          this.stopAggressiveMonitoring();
        }
      }, this.config.aggressiveCleanupInterval);
    }
  }

  // Detener monitoreo agresivo
  stopAggressiveMonitoring() {
    if (this.aggressiveTimer) {
      clearInterval(this.aggressiveTimer);
      this.aggressiveTimer = null;
    }
  }

  // Verificación de mantenimiento periódica
  performMaintenanceCheck() {
    try {
      const stats = this.getDetailedStorageStats();

      // Log de estadísticas actuales
      this.logger.info('Verificación de mantenimiento de almacenamiento', {
        usagePercentage: stats.usagePercentage,
        imageCount: stats.imageCount,
        totalSizeMB: stats.totalSizeMB,
        usageLevel: stats.usageLevel
      });

      // Verificar si necesita limpieza
      if (stats.needsCleanup) {
        this.logger.info('Ejecutando limpieza automática por mantenimiento');
        this.performAutomaticCleanup();
      }

      // Verificar imágenes antiguas
      this.cleanupOldImages();

      // Actualizar estadísticas de limpieza
      this.updateCleanupStats(stats);

    } catch (error) {
      this.logger.error('Error durante verificación de mantenimiento', error);
    }
  }

  // Ejecutar limpieza automática
  async performAutomaticCleanup() {
    try {
      this.logger.info('Ejecutando limpieza automática de almacenamiento');

      const cleanupResult = await this.smartCleanup({
        targetReductionMB: 5,
        preserveRecent: true,
        maxAge: this.config.maxCacheAge
      });

      this.logger.info('Limpieza automática completada', cleanupResult);

      return cleanupResult;

    } catch (error) {
      this.logger.error('Error durante limpieza automática', error);
      return { success: false, error: error.message };
    }
  }

  // Ejecutar limpieza de emergencia
  async performEmergencyCleanup() {
    try {
      this.logger.warn('Ejecutando limpieza de emergencia - uso crítico de almacenamiento');

      const cleanupResult = await this.smartCleanup({
        targetReductionMB: 15, // Más agresiva
        preserveRecent: false, // Eliminar más entradas antiguas
        maxAge: 12 * 60 * 60 * 1000 // Solo preservar últimas 12 horas
      });

      this.logger.warn('Limpieza de emergencia completada', cleanupResult);

      return cleanupResult;

    } catch (error) {
      this.logger.error('Error durante limpieza de emergencia', error);
      return { success: false, error: error.message };
    }
  }

  // Limpieza inteligente con múltiples estrategias
  async smartCleanup(options = {}) {
    const {
      targetReductionMB = 10,
      preserveRecent = true,
      maxAge = this.config.maxCacheAge
    } = options;

    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);

      if (entries.length === 0) {
        return { cleanedEntries: 0, freedSpace: 0 };
      }

      const now = Date.now();
      const targetBytes = targetReductionMB * 1024 * 1024;

      // Estrategia 1: Eliminar entradas muy antiguas primero
      const veryOldEntries = entries.filter(userId => {
        const entry = cache[userId];
        return entry && (now - entry.timestamp) > maxAge;
      });

      // Estrategia 2: Si no hay suficientes entradas antiguas, eliminar por orden de antigüedad
      let entriesToRemove = veryOldEntries;

      if (entriesToRemove.length === 0 || preserveRecent) {
        const sortedByAge = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const remainingCount = Math.max(1, Math.floor(entries.length * 0.3)); // Mantener al menos 70% de las entradas recientes
        entriesToRemove = sortedByAge.slice(0, entries.length - remainingCount);
      }

      // Calcular espacio a liberar
      let estimatedSpace = 0;
      entriesToRemove.forEach(userId => {
        const entry = cache[userId];
        if (entry) {
          estimatedSpace += this.estimateEntrySize(entry);
        }
      });

      // Si no se alcanza el objetivo, agregar más entradas
      if (estimatedSpace < targetBytes && entriesToRemove.length < entries.length) {
        const remainingEntries = entries
          .filter(userId => !entriesToRemove.includes(userId))
          .sort((a, b) => cache[a].timestamp - cache[b].timestamp);

        const additionalNeeded = Math.ceil((targetBytes - estimatedSpace) / (this.config.maxPerImage));

        for (let i = 0; i < additionalNeeded && i < remainingEntries.length; i++) {
          entriesToRemove.push(remainingEntries[i]);
          estimatedSpace += this.estimateEntrySize(cache[remainingEntries[i]]);
        }
      }

      // Ejecutar limpieza
      let cleanedCount = 0;
      let actualFreedSpace = 0;

      entriesToRemove.forEach(userId => {
        const entry = cache[userId];
        if (entry) {
          // Revocar URL de objeto si existe
          if (entry.url && entry.url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(entry.url);
            } catch (error) {
              this.logger.warn('Error revocando URL durante limpieza', { userId, error });
            }
          }

          const entrySize = this.estimateEntrySize(entry);
          delete cache[userId];
          cleanedCount++;
          actualFreedSpace += entrySize;
        }
      });

      // Guardar caché actualizado
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

      // Registrar limpieza en el log
      this.logCleanup({
        type: 'automatic',
        cleanedEntries: cleanedCount,
        freedSpace: actualFreedSpace,
        targetReductionMB,
        timestamp: now
      });

      this.logger.info('Limpieza inteligente completada', {
        cleanedEntries: cleanedCount,
        freedSpace: actualFreedSpace,
        freedSpaceMB: (actualFreedSpace / (1024 * 1024)).toFixed(2),
        targetReductionMB
      });

      return {
        success: true,
        cleanedEntries: cleanedCount,
        freedSpace: actualFreedSpace,
        freedSpaceMB: (actualFreedSpace / (1024 * 1024)).toFixed(2),
        targetReductionMB
      };

    } catch (error) {
      this.logger.error('Error durante limpieza inteligente', error);
      return {
        success: false,
        cleanedEntries: 0,
        freedSpace: 0,
        error: error.message
      };
    }
  }

  // Limpiar imágenes antiguas
  cleanupOldImages() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);
      const now = Date.now();

      let cleanedCount = 0;

      entries.forEach(userId => {
        const entry = cache[userId];
        if (entry && (now - entry.timestamp) > this.config.maxCacheAge) {
          if (entry.url && entry.url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(entry.url);
            } catch (error) {
              this.logger.warn('Error revocando URL antigua', { userId, error });
            }
          }
          delete cache[userId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        this.logger.info('Imágenes antiguas limpiadas', { cleanedCount });
      }

      return cleanedCount;

    } catch (error) {
      this.logger.error('Error limpiando imágenes antiguas', error);
      return 0;
    }
  }

  // Actualizar estadísticas de limpieza
  updateCleanupStats(stats) {
    try {
      const storageStats = JSON.parse(localStorage.getItem(this.STORAGE_STATS_KEY) || '{}');

      storageStats.lastCleanup = Date.now();
      storageStats.cleanupCount = (storageStats.cleanupCount || 0) + 1;

      localStorage.setItem(this.STORAGE_STATS_KEY, JSON.stringify(storageStats));
    } catch (error) {
      this.logger.error('Error actualizando estadísticas de limpieza', error);
    }
  }

  // Registrar limpieza en el log
  logCleanup(cleanupInfo) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.CLEANUP_LOG_KEY) || '[]');

      logs.push({
        ...cleanupInfo,
        id: Date.now() + Math.random().toString(36).substring(7)
      });

      // Mantener solo las últimas 50 entradas
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      localStorage.setItem(this.CLEANUP_LOG_KEY, JSON.stringify(logs));
    } catch (error) {
      this.logger.error('Error registrando limpieza en log', error);
    }
  }

  // Obtener historial de limpiezas
  getCleanupHistory(limit = 10) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.CLEANUP_LOG_KEY) || '[]');
      return logs.slice(-limit);
    } catch (error) {
      this.logger.error('Error obteniendo historial de limpiezas', error);
      return [];
    }
  }

  // Obtener recomendaciones de optimización
  getOptimizationRecommendations() {
    const stats = this.getDetailedStorageStats();

    if (stats.error) {
      return { recommendations: [], priority: 'error' };
    }

    const recommendations = [];

    // Recomendaciones basadas en uso de almacenamiento
    if (stats.isCritical) {
      recommendations.push({
        type: 'critical',
        message: 'Uso crítico de almacenamiento. Limpieza inmediata recomendada.',
        action: 'emergency_cleanup'
      });
    } else if (stats.needsWarning) {
      recommendations.push({
        type: 'warning',
        message: 'Alto uso de almacenamiento. Considere limpiar imágenes antiguas.',
        action: 'automatic_cleanup'
      });
    }

    // Recomendaciones basadas en predicción
    if (stats.prediction && stats.prediction.daysToLimit < 7) {
      recommendations.push({
        type: 'prediction',
        message: `Se alcanzará el límite en aproximadamente ${stats.prediction.daysToLimit} días.`,
        action: 'increase_cleanup_frequency'
      });
    }

    // Recomendaciones basadas en tamaño promedio
    if (stats.averageImageSize > this.config.maxPerImage * 0.8) {
      recommendations.push({
        type: 'optimization',
        message: 'Las imágenes son grandes en promedio. Considere compresión adicional.',
        action: 'optimize_existing'
      });
    }

    // Recomendaciones basadas en número de imágenes por usuario
    const usersWithManyImages = Object.keys(stats.userStats).filter(
      userId => stats.userStats[userId].imageCount > this.config.maxImagesPerUser * 0.8
    );

    if (usersWithManyImages.length > 0) {
      recommendations.push({
        type: 'user_management',
        message: `Algunos usuarios tienen muchas imágenes: ${usersWithManyImages.join(', ')}`,
        action: 'user_specific_cleanup'
      });
    }

    return {
      recommendations,
      priority: stats.isCritical ? 'critical' : stats.needsWarning ? 'warning' : 'normal',
      stats
    };
  }
}

// Crear instancia singleton
const photoProfileStorageManager = new PhotoProfileStorageManager();

export default photoProfileStorageManager;