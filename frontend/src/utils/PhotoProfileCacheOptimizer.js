// Optimizador avanzado de caché de fotos de perfil con compresión automática
import photoProfileImageCompressor from './PhotoProfileImageCompressor.js';

class PhotoProfileCacheOptimizer {
  constructor() {
    this.CACHE_KEY = 'fotoPerfil_cache';
    this.OPTIMIZATION_LOG_KEY = 'fotoPerfil_optimization_log';

    // Configuración de optimización
    this.config = {
      batchSize: 5,                    // Procesar 5 imágenes por lote
      delayBetweenBatches: 100,        // 100ms entre lotes
      maxOptimizationTime: 30000,     // 30 segundos máximo por sesión de optimización
      minSizeImprovement: 0.1,        // Al menos 10% de reducción para considerar optimización
      maxImagesPerSession: 20,         // Máximo 20 imágenes por sesión
      qualityPresets: {
        conservative: { maxWidth: 200, maxHeight: 200, quality: 'high' },
        balanced: { maxWidth: 300, maxHeight: 300, quality: 'medium' },
        aggressive: { maxWidth: 400, maxHeight: 400, quality: 'low' }
      }
    };

    this.logger = {
      info: (message, data) => {
        console.log(`[CacheOptimizer] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[CacheOptimizer] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[CacheOptimizer] ${message}`, data || '');
      }
    };

    // Estado de optimización
    this.isOptimizing = false;
    this.optimizationStats = {
      totalOptimized: 0,
      totalSpaceSaved: 0,
      lastOptimization: null,
      sessionsCount: 0
    };
  }

  // Función principal para optimizar todo el caché
  async optimizeEntireCache(options = {}) {
    const {
      strategy = 'balanced',
      forceRecompression = false,
      maxImages = this.config.maxImagesPerSession
    } = options;

    if (this.isOptimizing) {
      throw new Error('Optimización ya en progreso');
    }

    this.isOptimizing = true;
    const startTime = Date.now();

    try {
      this.logger.info('Iniciando optimización completa del caché', {
        strategy,
        forceRecompression,
        maxImages
      });

      // Obtener información del caché actual
      const cacheInfo = await this.analyzeCacheForOptimization();
      if (cacheInfo.entries.length === 0) {
        this.logger.info('No hay imágenes en caché para optimizar');
        return {
          success: true,
          optimizedImages: 0,
          totalSpaceSaved: 0,
          reason: 'empty_cache'
        };
      }

      // Filtrar imágenes que necesitan optimización
      const imagesToOptimize = this.filterImagesForOptimization(
        cacheInfo.entries,
        forceRecompression,
        maxImages
      );

      if (imagesToOptimize.length === 0) {
        this.logger.info('No hay imágenes que necesiten optimización');
        return {
          success: true,
          optimizedImages: 0,
          totalSpaceSaved: 0,
          reason: 'no_optimization_needed'
        };
      }

      this.logger.info('Imágenes seleccionadas para optimización', {
        totalCandidates: cacheInfo.entries.length,
        toOptimize: imagesToOptimize.length,
        strategy
      });

      // Ejecutar optimización por lotes
      const result = await this.optimizeInBatches(
        imagesToOptimize,
        strategy,
        startTime
      );

      // Actualizar estadísticas
      this.updateOptimizationStats(result);

      // Registrar en el log de optimización
      this.logOptimizationSession({
        strategy,
        result,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      });

      this.logger.info('Optimización completada exitosamente', {
        ...result,
        duration: Date.now() - startTime
      });

      return {
        success: true,
        ...result,
        duration: Date.now() - startTime,
        strategy
      };

    } catch (error) {
      this.logger.error('Error durante optimización del caché', error);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    } finally {
      this.isOptimizing = false;
    }
  }

  // Analizar caché para identificar oportunidades de optimización
  async analyzeCacheForOptimization() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);

      const analysis = {
        entries: [],
        totalSize: 0,
        optimizationCandidates: 0,
        potentialSpaceSaving: 0,
        averageSize: 0,
        sizeDistribution: {
          small: 0,
          medium: 0,
          large: 0,
          huge: 0
        }
      };

      for (const userId of entries) {
        const entry = cache[userId];
        if (entry && entry.url && entry.url.startsWith('blob:')) {
          try {
            // Obtener el blob real para análisis
            const response = await fetch(entry.url);
            const blob = await response.blob();

            const entryInfo = {
              userId,
              currentSize: blob.size,
              timestamp: entry.timestamp,
              url: entry.url,
              blob,
              estimatedCompressedSize: this.estimateCompressedSize(blob.size),
              potentialSaving: blob.size - this.estimateCompressedSize(blob.size)
            };

            analysis.entries.push(entryInfo);
            analysis.totalSize += blob.size;

            // Contar candidatos para optimización
            if (entryInfo.potentialSaving > 0) {
              analysis.optimizationCandidates++;
              analysis.potentialSpaceSaving += entryInfo.potentialSaving;
            }

            // Distribución por tamaño
            if (blob.size < 500 * 1024) {
              analysis.sizeDistribution.small++;
            } else if (blob.size < 2 * 1024 * 1024) {
              analysis.sizeDistribution.medium++;
            } else if (blob.size < 5 * 1024 * 1024) {
              analysis.sizeDistribution.large++;
            } else {
              analysis.sizeDistribution.huge++;
            }

          } catch (error) {
            this.logger.warn('Error analizando imagen para optimización', {
              userId,
              error: error.message
            });
          }
        }
      }

      analysis.averageSize = analysis.entries.length > 0 ?
        analysis.totalSize / analysis.entries.length : 0;

      return analysis;

    } catch (error) {
      this.logger.error('Error analizando caché para optimización', error);
      return {
        entries: [],
        totalSize: 0,
        optimizationCandidates: 0,
        error: error.message
      };
    }
  }

  // Filtrar imágenes que necesitan optimización
  filterImagesForOptimization(entries, forceRecompression, maxImages) {
    let candidates = entries.filter(entry => {
      // Filtrar por tamaño mínimo para optimización
      if (entry.currentSize < 100 * 1024) { // Menos de 100KB
        return false;
      }

      // Filtrar por potencial de ahorro
      if (!forceRecompression && entry.potentialSaving < entry.currentSize * this.config.minSizeImprovement) {
        return false;
      }

      return true;
    });

    // Ordenar por potencial de ahorro (mayor primero)
    candidates.sort((a, b) => b.potentialSaving - a.potentialSaving);

    // Limitar número de imágenes
    if (maxImages && candidates.length > maxImages) {
      candidates = candidates.slice(0, maxImages);
    }

    return candidates;
  }

  // Estimar tamaño después de compresión
  estimateCompressedSize(originalSize) {
    // Basado en análisis históricos y características típicas de imágenes
    const compressionRatios = {
      small: 0.3,   // 70% reducción para imágenes pequeñas
      medium: 0.4,  // 60% reducción para imágenes medianas
      large: 0.5,   // 50% reducción para imágenes grandes
      huge: 0.6     // 40% reducción para imágenes muy grandes
    };

    let ratio;
    if (originalSize < 500 * 1024) {
      ratio = compressionRatios.small;
    } else if (originalSize < 2 * 1024 * 1024) {
      ratio = compressionRatios.medium;
    } else if (originalSize < 5 * 1024 * 1024) {
      ratio = compressionRatios.large;
    } else {
      ratio = compressionRatios.huge;
    }

    return Math.round(originalSize * ratio);
  }

  // Optimizar imágenes por lotes
  async optimizeInBatches(imagesToOptimize, strategy, startTime) {
    const batches = this.createBatches(imagesToOptimize, this.config.batchSize);
    const results = {
      optimizedImages: 0,
      totalSpaceSaved: 0,
      errors: 0,
      skipped: 0
    };

    this.logger.info('Procesando imágenes en lotes', {
      totalBatches: batches.length,
      imagesPerBatch: this.config.batchSize
    });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Verificar tiempo límite
      if (Date.now() - startTime > this.config.maxOptimizationTime) {
        this.logger.warn('Tiempo límite alcanzado, deteniendo optimización');
        break;
      }

      try {
        // Procesar lote actual
        const batchResults = await this.processBatch(batch, strategy);

        // Acumular resultados
        results.optimizedImages += batchResults.optimizedImages;
        results.totalSpaceSaved += batchResults.totalSpaceSaved;
        results.errors += batchResults.errors;
        results.skipped += batchResults.skipped;

        this.logger.info(`Lote ${i + 1}/${batches.length} completado`, {
          batchSize: batch.length,
          results: batchResults
        });

        // Pequeña pausa entre lotes (excepto el último)
        if (i < batches.length - 1) {
          await this.delay(this.config.delayBetweenBatches);
        }

      } catch (error) {
        this.logger.error(`Error procesando lote ${i + 1}`, error);
        results.errors += batch.length;
      }
    }

    return results;
  }

  // Crear lotes de imágenes
  createBatches(images, batchSize) {
    const batches = [];
    for (let i = 0; i < images.length; i += batchSize) {
      batches.push(images.slice(i, i + batchSize));
    }
    return batches;
  }

  // Procesar un lote de imágenes
  async processBatch(batch, strategy) {
    const results = {
      optimizedImages: 0,
      totalSpaceSaved: 0,
      errors: 0,
      skipped: 0
    };

    // Procesar imágenes en paralelo dentro del lote
    const batchPromises = batch.map(async (imageInfo) => {
      try {
        return await this.optimizeSingleImage(imageInfo, strategy);
      } catch (error) {
        this.logger.warn('Error optimizando imagen individual', {
          userId: imageInfo.userId,
          error: error.message
        });
        return { success: false, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Procesar resultados del lote
    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      const originalImage = batch[i];

      if (result.success) {
        if (result.spaceSaved > 0) {
          results.optimizedImages++;
          results.totalSpaceSaved += result.spaceSaved;

          // Actualizar caché con imagen optimizada
          await this.updateCacheWithOptimizedImage(originalImage, result);

          this.logger.info('Imagen optimizada exitosamente', {
            userId: originalImage.userId,
            originalSize: originalImage.currentSize,
            newSize: result.compressedSize,
            spaceSaved: result.spaceSaved
          });
        } else {
          results.skipped++;
        }
      } else {
        results.errors++;
      }
    }

    return results;
  }

  // Optimizar una sola imagen
  async optimizeSingleImage(imageInfo, strategy) {
    const qualityPreset = this.config.qualityPresets[strategy] || this.config.qualityPresets.balanced;

    // Comprimir imagen usando el compresor
    const compressionResult = await photoProfileImageCompressor.compressImage(
      imageInfo.blob,
      {
        maxWidth: qualityPreset.maxWidth,
        maxHeight: qualityPreset.maxHeight,
        quality: qualityPreset.quality,
        userId: imageInfo.userId
      }
    );

    if (!compressionResult.success) {
      return {
        success: false,
        error: compressionResult.error || 'Compresión fallida'
      };
    }

    const spaceSaved = imageInfo.currentSize - compressionResult.compressedSize;

    return {
      success: true,
      originalSize: imageInfo.currentSize,
      compressedSize: compressionResult.compressedSize,
      spaceSaved,
      compressionRatio: compressionResult.compressionRatio,
      qualityUsed: compressionResult.qualityUsed,
      dimensions: compressionResult.dimensions
    };
  }

  // Actualizar caché con imagen optimizada
  async updateCacheWithOptimizedImage(originalImage, optimizationResult) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');

      // Revocar URL anterior
      if (originalImage.url && originalImage.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(originalImage.url);
        } catch (error) {
          this.logger.warn('Error revocando URL anterior', {
            userId: originalImage.userId,
            error
          });
        }
      }

      // Crear nueva URL de objeto para la imagen comprimida
      const newObjectUrl = URL.createObjectURL(optimizationResult.blob);

      // Actualizar entrada en caché
      cache[originalImage.userId] = {
        url: newObjectUrl,
        timestamp: Date.now(),
        originalSize: optimizationResult.originalSize,
        compressedSize: optimizationResult.compressedSize,
        compressionRatio: optimizationResult.compressionRatio,
        qualityUsed: optimizationResult.qualityUsed,
        dimensions: optimizationResult.dimensions,
        optimized: true,
        optimizationDate: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

    } catch (error) {
      this.logger.error('Error actualizando caché con imagen optimizada', {
        userId: originalImage.userId,
        error: error.message
      });
      throw error;
    }
  }

  // Función de utilidad para delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Actualizar estadísticas de optimización
  updateOptimizationStats(result) {
    try {
      this.optimizationStats.totalOptimized += result.optimizedImages;
      this.optimizationStats.totalSpaceSaved += result.totalSpaceSaved;
      this.optimizationStats.lastOptimization = Date.now();
      this.optimizationStats.sessionsCount++;

      // Podríamos guardar estas estadísticas en localStorage si es necesario
      const statsKey = 'fotoPerfil_optimization_stats';
      localStorage.setItem(statsKey, JSON.stringify(this.optimizationStats));

    } catch (error) {
      this.logger.error('Error actualizando estadísticas de optimización', error);
    }
  }

  // Registrar sesión de optimización en el log
  logOptimizationSession(sessionInfo) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.OPTIMIZATION_LOG_KEY) || '[]');

      logs.push({
        id: Date.now() + Math.random().toString(36).substring(7),
        ...sessionInfo
      });

      // Mantener solo las últimas 20 sesiones
      if (logs.length > 20) {
        logs.splice(0, logs.length - 20);
      }

      localStorage.setItem(this.OPTIMIZATION_LOG_KEY, JSON.stringify(logs));

    } catch (error) {
      this.logger.error('Error registrando sesión de optimización', error);
    }
  }

  // Obtener historial de optimizaciones
  getOptimizationHistory(limit = 10) {
    try {
      const logs = JSON.parse(localStorage.getItem(this.OPTIMIZATION_LOG_KEY) || '[]');
      return logs.slice(-limit);
    } catch (error) {
      this.logger.error('Error obteniendo historial de optimizaciones', error);
      return [];
    }
  }

  // Obtener estadísticas actuales de optimización
  getOptimizationStats() {
    try {
      const statsKey = 'fotoPerfil_optimization_stats';
      const storedStats = JSON.parse(localStorage.getItem(statsKey) || '{}');

      return {
        ...this.optimizationStats,
        ...storedStats,
        isOptimizing: this.isOptimizing,
        averageSpaceSaved: storedStats.sessionsCount > 0 ?
          Math.round(storedStats.totalSpaceSaved / storedStats.sessionsCount) : 0
      };

    } catch (error) {
      this.logger.error('Error obteniendo estadísticas de optimización', error);
      return {
        totalOptimized: 0,
        totalSpaceSaved: 0,
        isOptimizing: this.isOptimizing
      };
    }
  }

  // Función para optimización automática basada en umbrales
  async autoOptimizeIfNeeded() {
    try {
      const storageManager = await import('./PhotoProfileStorageManager.js');
      const manager = storageManager.default;

      const stats = manager.getDetailedStorageStats();

      // Solo optimizar si el uso está por encima del 60%
      if (stats.usagePercentage < 60) {
        return {
          optimized: false,
          reason: 'usage_below_threshold',
          usagePercentage: stats.usagePercentage
        };
      }

      // Si hay muchas imágenes grandes, optimizar
      if (stats.userStats && Object.keys(stats.userStats).length > 5) {
        const largeUsers = Object.keys(stats.userStats).filter(
          userId => stats.userStats[userId].averageSize > 1024 * 1024 // Más de 1MB promedio
        );

        if (largeUsers.length > 0) {
          this.logger.info('Optimización automática activada por imágenes grandes', {
            largeUsers: largeUsers.length,
            usagePercentage: stats.usagePercentage
          });

          return await this.optimizeEntireCache({
            strategy: 'conservative',
            maxImages: 10
          });
        }
      }

      return {
        optimized: false,
        reason: 'no_large_images'
      };

    } catch (error) {
      this.logger.error('Error durante optimización automática', error);
      return {
        optimized: false,
        error: error.message
      };
    }
  }

  // Función para limpiar imágenes duplicadas o muy similares
  async cleanupDuplicateImages() {
    try {
      this.logger.info('Iniciando limpieza de imágenes duplicadas');

      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);

      if (entries.length < 2) {
        return { removedDuplicates: 0, spaceFreed: 0 };
      }

      // Esta es una implementación simplificada
      // En un escenario real, compararíamos hashes o características visuales
      const duplicates = [];
      const seenSizes = new Map();

      for (const userId of entries) {
        const entry = cache[userId];
        if (entry && entry.compressedSize) {
          const size = entry.compressedSize;
          if (seenSizes.has(size)) {
            // Posible duplicado basado en tamaño
            // En implementación real, compararíamos el contenido
            duplicates.push(userId);
          } else {
            seenSizes.set(size, userId);
          }
        }
      }

      // Remover duplicados encontrados
      let removedCount = 0;
      let spaceFreed = 0;

      for (const userId of duplicates) {
        const entry = cache[userId];
        if (entry) {
          if (entry.url && entry.url.startsWith('blob:')) {
            URL.revokeObjectURL(entry.url);
          }
          spaceFreed += entry.compressedSize || 0;
          delete cache[userId];
          removedCount++;
        }
      }

      if (removedCount > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      }

      this.logger.info('Limpieza de duplicados completada', {
        removedDuplicates: removedCount,
        spaceFreed
      });

      return {
        removedDuplicates: removedCount,
        spaceFreed,
        spaceFreedMB: (spaceFreed / (1024 * 1024)).toFixed(2)
      };

    } catch (error) {
      this.logger.error('Error limpiando imágenes duplicadas', error);
      return { removedDuplicates: 0, spaceFreed: 0, error: error.message };
    }
  }
}

// Crear instancia singleton
const photoProfileCacheOptimizer = new PhotoProfileCacheOptimizer();

export default photoProfileCacheOptimizer;