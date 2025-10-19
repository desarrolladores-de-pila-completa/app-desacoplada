// Utilidad avanzada para compresión y optimización de imágenes de perfil
class PhotoProfileImageCompressor {
  constructor() {
    this.maxStoragePerImage = 2 * 1024 * 1024; // 2MB por imagen comprimida
    this.maxTotalStorage = 50 * 1024 * 1024; // 50MB total para todas las imágenes
    this.compressionQuality = {
      high: 0.9,    // Para imágenes pequeñas (< 500KB)
      medium: 0.7,  // Para imágenes medianas (500KB - 2MB)
      low: 0.5,     // Para imágenes grandes (2MB - 5MB)
      veryLow: 0.3  // Para imágenes muy grandes (> 5MB)
    };

    this.logger = {
      info: (message, data) => {
        console.log(`[ImageCompressor] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[ImageCompressor] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[ImageCompressor] ${message}`, data || '');
      }
    };
  }

  // Función principal para comprimir imagen
  async compressImage(imageBlob, options = {}) {
    const {
      maxWidth = 300,
      maxHeight = 300,
      quality = 'auto',
      format = 'image/jpeg',
      userId = null
    } = options;

    try {
      this.logger.info('Iniciando compresión de imagen', {
        originalSize: imageBlob.size,
        maxWidth,
        maxHeight,
        quality,
        format,
        userId
      });

      // Verificar si necesitamos compresión basada en el tamaño
      if (imageBlob.size <= this.maxStoragePerImage && quality !== 'force') {
        this.logger.info('Imagen ya está dentro del límite, retornando original');
        return {
          success: true,
          blob: imageBlob,
          originalSize: imageBlob.size,
          compressedSize: imageBlob.size,
          compressionRatio: 1,
          qualityUsed: 'none'
        };
      }

      // Crear imagen desde el blob
      const img = await this.createImageFromBlob(imageBlob);

      // Calcular nuevas dimensiones manteniendo aspect ratio
      const { newWidth, newHeight } = this.calculateDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );

      // Crear canvas para la compresión
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Aplicar compresión con la calidad determinada
      const compressionQuality = this.determineQuality(imageBlob.size, quality);

      // Dibujar imagen en canvas con configuración de calidad
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convertir a blob con la calidad especificada
      const compressedBlob = await this.canvasToBlob(canvas, format, compressionQuality);

      // Verificar que la compresión fue efectiva
      if (compressedBlob.size >= imageBlob.size && quality !== 'force') {
        this.logger.warn('Compresión no redujo el tamaño, retornando original');
        return {
          success: true,
          blob: imageBlob,
          originalSize: imageBlob.size,
          compressedSize: imageBlob.size,
          compressionRatio: 1,
          qualityUsed: 'none'
        };
      }

      this.logger.info('Compresión exitosa', {
        originalSize: imageBlob.size,
        compressedSize: compressedBlob.size,
        compressionRatio: imageBlob.size / compressedBlob.size,
        qualityUsed: compressionQuality,
        newDimensions: `${newWidth}x${newHeight}`
      });

      return {
        success: true,
        blob: compressedBlob,
        originalSize: imageBlob.size,
        compressedSize: compressedBlob.size,
        compressionRatio: imageBlob.size / compressedBlob.size,
        qualityUsed: compressionQuality,
        dimensions: { width: newWidth, height: newHeight }
      };

    } catch (error) {
      this.logger.error('Error durante compresión de imagen', error);
      return {
        success: false,
        blob: imageBlob,
        error: error.message,
        originalSize: imageBlob.size,
        compressedSize: imageBlob.size
      };
    }
  }

  // Crear imagen desde blob
  createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar imagen para compresión'));
      };

      img.src = url;
    });
  }

  // Calcular nuevas dimensiones manteniendo aspect ratio
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    // Si la imagen es más grande que el máximo, reducir proporcionalmente
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const minRatio = Math.min(widthRatio, heightRatio);

      newWidth = Math.round(originalWidth * minRatio);
      newHeight = Math.round(originalHeight * minRatio);
    }

    return { newWidth, newHeight };
  }

  // Determinar calidad de compresión basada en el tamaño
  determineQuality(fileSize, requestedQuality = 'auto') {
    if (requestedQuality !== 'auto') {
      return this.compressionQuality[requestedQuality] || this.compressionQuality.medium;
    }

    if (fileSize <= 500 * 1024) { // <= 500KB
      return this.compressionQuality.high;
    } else if (fileSize <= 2 * 1024 * 1024) { // <= 2MB
      return this.compressionQuality.medium;
    } else if (fileSize <= 5 * 1024 * 1024) { // <= 5MB
      return this.compressionQuality.low;
    } else { // > 5MB
      return this.compressionQuality.veryLow;
    }
  }

  // Convertir canvas a blob
  canvasToBlob(canvas, format, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, format, quality);
    });
  }

  // Monitorear uso de almacenamiento
  getStorageUsage() {
    try {
      let totalSize = 0;
      const imageKeys = [];

      // Calcular tamaño total de imágenes en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('fotoPerfil_cache')) {
          const value = localStorage.getItem(key);
          if (value) {
            // Estimar tamaño del valor (localStorage usa UTF-16)
            totalSize += key.length * 2 + value.length * 2;
            imageKeys.push(key);
          }
        }
      }

      const usagePercentage = (totalSize / this.maxTotalStorage) * 100;

      return {
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        usagePercentage: usagePercentage.toFixed(2),
        imageKeysCount: imageKeys.length,
        maxTotalStorage: this.maxTotalStorage,
        maxTotalStorageMB: (this.maxTotalStorage / (1024 * 1024)).toFixed(2),
        needsCleanup: usagePercentage > 80,
        canAcceptNewImage: totalSize < this.maxTotalStorage * 0.9
      };
    } catch (error) {
      this.logger.error('Error al calcular uso de almacenamiento', error);
      return {
        totalSize: 0,
        usagePercentage: 0,
        needsCleanup: false,
        canAcceptNewImage: true,
        error: error.message
      };
    }
  }

  // Función para limpiar almacenamiento cuando sea necesario
  async cleanupStorage(targetReductionMB = 10) {
    try {
      this.logger.info('Iniciando limpieza de almacenamiento', { targetReductionMB });

      const cache = JSON.parse(localStorage.getItem('fotoPerfil_cache') || '{}');
      const entries = Object.keys(cache);

      if (entries.length === 0) {
        this.logger.info('No hay entradas de caché para limpiar');
        return { cleanedEntries: 0, freedSpace: 0 };
      }

      // Ordenar por timestamp (más antiguas primero)
      const sortedEntries = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);

      let cleanedCount = 0;
      let freedSpace = 0;

      // Calcular espacio aproximado que ocupan las entradas
      const entriesToRemove = [];
      const targetReductionBytes = targetReductionMB * 1024 * 1024;

      for (const userId of sortedEntries) {
        const entry = cache[userId];
        if (entry && entry.url) {
          // Estimar tamaño de la entrada
          const estimatedSize = JSON.stringify(entry).length * 2; // UTF-16
          entriesToRemove.push(userId);
          freedSpace += estimatedSize;

          if (freedSpace >= targetReductionBytes) {
            break;
          }
        }
      }

      // Remover entradas seleccionadas
      entriesToRemove.forEach(userId => {
        const entry = cache[userId];
        if (entry && entry.url && entry.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(entry.url);
          } catch (error) {
            this.logger.warn('Error al revocar URL de objeto durante limpieza', { userId, error });
          }
        }
        delete cache[userId];
        cleanedCount++;
      });

      // Guardar caché actualizado
      localStorage.setItem('fotoPerfil_cache', JSON.stringify(cache));

      this.logger.info('Limpieza de almacenamiento completada', {
        cleanedEntries: cleanedCount,
        freedSpace,
        freedSpaceMB: (freedSpace / (1024 * 1024)).toFixed(2)
      });

      return {
        cleanedEntries: cleanedCount,
        freedSpace,
        freedSpaceMB: (freedSpace / (1024 * 1024)).toFixed(2)
      };

    } catch (error) {
      this.logger.error('Error durante limpieza de almacenamiento', error);
      return { cleanedEntries: 0, freedSpace: 0, error: error.message };
    }
  }

  // Función para optimizar todas las imágenes existentes en caché
  async optimizeExistingCache() {
    try {
      this.logger.info('Iniciando optimización de caché existente');

      const cache = JSON.parse(localStorage.getItem('fotoPerfil_cache') || '{}');
      const entries = Object.keys(cache);

      if (entries.length === 0) {
        this.logger.info('No hay imágenes en caché para optimizar');
        return { optimizedImages: 0, totalSpaceSaved: 0 };
      }

      let optimizedCount = 0;
      let totalSpaceSaved = 0;

      for (const userId of entries) {
        const entry = cache[userId];
        if (entry && entry.url && entry.url.startsWith('blob:')) {
          try {
            // Obtener el blob desde la URL de objeto
            const response = await fetch(entry.url);
            const blob = await response.blob();

            // Comprimir la imagen
            const compressionResult = await this.compressImage(blob, {
              maxWidth: 300,
              maxHeight: 300,
              quality: 'auto',
              userId
            });

            if (compressionResult.success && compressionResult.compressedSize < blob.size) {
              // Crear nueva URL de objeto para la imagen comprimida
              const newObjectUrl = URL.createObjectURL(compressionResult.blob);

              // Revocar la URL anterior
              URL.revokeObjectURL(entry.url);

              // Actualizar entrada en caché
              cache[userId] = {
                url: newObjectUrl,
                timestamp: Date.now(),
                originalSize: compressionResult.originalSize,
                compressedSize: compressionResult.compressedSize,
                compressionRatio: compressionResult.compressionRatio
              };

              optimizedCount++;
              totalSpaceSaved += (blob.size - compressionResult.compressedSize);

              this.logger.info('Imagen optimizada', {
                userId,
                originalSize: blob.size,
                compressedSize: compressionResult.compressedSize,
                spaceSaved: blob.size - compressionResult.compressedSize
              });
            }
          } catch (error) {
            this.logger.warn('Error al optimizar imagen existente', { userId, error: error.message });
          }
        }
      }

      // Guardar caché actualizado
      localStorage.setItem('fotoPerfil_cache', JSON.stringify(cache));

      this.logger.info('Optimización de caché completada', {
        optimizedImages: optimizedCount,
        totalSpaceSaved,
        totalSpaceSavedMB: (totalSpaceSaved / (1024 * 1024)).toFixed(2)
      });

      return {
        optimizedImages: optimizedCount,
        totalSpaceSaved,
        totalSpaceSavedMB: (totalSpaceSaved / (1024 * 1024)).toFixed(2)
      };

    } catch (error) {
      this.logger.error('Error durante optimización de caché existente', error);
      return { optimizedImages: 0, totalSpaceSaved: 0, error: error.message };
    }
  }

  // Función para verificar si necesitamos limpieza antes de agregar nueva imagen
  async shouldCleanupBeforeAdding() {
    const usage = this.getStorageUsage();

    if (usage.needsCleanup || !usage.canAcceptNewImage) {
      this.logger.info('Limpieza necesaria antes de agregar nueva imagen', usage);
      return true;
    }

    return false;
  }

  // Función para preparar almacenamiento antes de agregar nueva imagen
  async prepareStorageForNewImage() {
    const shouldCleanup = await this.shouldCleanupBeforeAdding();

    if (shouldCleanup) {
      this.logger.info('Ejecutando limpieza automática antes de agregar nueva imagen');
      await this.cleanupStorage(5); // Limpiar 5MB
    }

    // Verificar nuevamente después de la limpieza
    const usage = this.getStorageUsage();
    return {
      canProceed: usage.canAcceptNewImage,
      usageInfo: usage
    };
  }
}

// Crear instancia singleton
const photoProfileImageCompressor = new PhotoProfileImageCompressor();

export default photoProfileImageCompressor;