// Configuración avanzada de almacenamiento para fotos de perfil
// Esta configuración permite personalizar límites y comportamiento por usuario o grupo

const PhotoProfileStorageConfig = {
  // Límites globales de almacenamiento
  global: {
    maxTotalStorage: 50 * 1024 * 1024,     // 50MB total
    maxPerImage: 2 * 1024 * 1024,          // 2MB por imagen comprimida
    maxImagesPerUser: 10,                   // Máximo 10 imágenes por usuario
    maxCacheAge: 24 * 60 * 60 * 1000,      // 24 horas máximo en caché
    warningThreshold: 70,                   // Advertencia al 70% de uso
    criticalThreshold: 85,                  // Crítico al 85% de uso
    cleanupThreshold: 90                    // Limpieza automática al 90% de uso
  },

  // Límites específicos por tipo de usuario
  userTypes: {
    // Usuarios premium tienen límites más altos
    premium: {
      maxTotalStorage: 100 * 1024 * 1024,   // 100MB
      maxPerImage: 5 * 1024 * 1024,         // 5MB por imagen
      maxImagesPerUser: 25,                  // 25 imágenes por usuario
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      priority: 'high'
    },

    // Usuarios estándar
    standard: {
      maxTotalStorage: 50 * 1024 * 1024,    // 50MB
      maxPerImage: 2 * 1024 * 1024,         // 2MB por imagen
      maxImagesPerUser: 10,                  // 10 imágenes por usuario
      maxCacheAge: 24 * 60 * 60 * 1000,     // 24 horas
      priority: 'normal'
    },

    // Usuarios básicos (límites más estrictos)
    basic: {
      maxTotalStorage: 25 * 1024 * 1024,    // 25MB
      maxPerImage: 1 * 1024 * 1024,         // 1MB por imagen
      maxImagesPerUser: 5,                   // 5 imágenes por usuario
      maxCacheAge: 12 * 60 * 60 * 1000,     // 12 horas
      priority: 'low'
    },

    // Administradores (límites muy altos para debugging)
    admin: {
      maxTotalStorage: 200 * 1024 * 1024,   // 200MB
      maxPerImage: 10 * 1024 * 1024,        // 10MB por imagen
      maxImagesPerUser: 50,                  // 50 imágenes por usuario
      maxCacheAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      priority: 'critical'
    }
  },

  // Configuración de calidad de compresión por tipo de usuario
  compressionQuality: {
    premium: {
      high: 0.95,    // Alta calidad para usuarios premium
      medium: 0.85,
      low: 0.7,
      veryLow: 0.5
    },

    standard: {
      high: 0.9,     // Calidad estándar
      medium: 0.7,
      low: 0.5,
      veryLow: 0.3
    },

    basic: {
      high: 0.8,     // Calidad reducida para usuarios básicos
      medium: 0.6,
      low: 0.4,
      veryLow: 0.25
    },

    admin: {
      high: 0.98,    // Máxima calidad para administradores
      medium: 0.9,
      low: 0.8,
      veryLow: 0.6
    }
  },

  // Configuración de limpieza inteligente por prioridad
  cleanupPriority: {
    critical: {
      targetReductionMB: 20,
      preserveRecent: false,
      maxAge: 6 * 60 * 60 * 1000,  // 6 horas
      urgency: 'critical'
    },

    high: {
      targetReductionMB: 15,
      preserveRecent: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 horas
      urgency: 'high'
    },

    normal: {
      targetReductionMB: 10,
      preserveRecent: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      urgency: 'normal'
    },

    low: {
      targetReductionMB: 5,
      preserveRecent: true,
      maxAge: 48 * 60 * 60 * 1000, // 48 horas
      urgency: 'low'
    }
  },

  // Función para obtener configuración de usuario
  getUserConfig(userType = 'standard', userId = null) {
    const baseConfig = this.userTypes[userType] || this.userTypes.standard;

    return {
      ...this.global,
      ...baseConfig,
      userType,
      userId,
      compressionQuality: this.compressionQuality[userType] || this.compressionQuality.standard
    };
  },

  // Función para determinar el tipo de usuario basado en propiedades
  determineUserType(user = {}) {
    // Si el usuario tiene propiedades específicas que indiquen premium
    if (user.premium === true || user.plan === 'premium' || user.role === 'admin') {
      return 'premium';
    }

    // Si el usuario tiene propiedades básicas
    if (user.basic === true || user.plan === 'basic') {
      return 'basic';
    }

    // Si el usuario es administrador
    if (user.role === 'admin' || user.admin === true) {
      return 'admin';
    }

    // Por defecto, usuario estándar
    return 'standard';
  },

  // Función para obtener configuración basada en el usuario actual
  getCurrentUserConfig(currentUser = null) {
    let userType = 'standard';

    if (currentUser) {
      userType = this.determineUserType(currentUser);
    } else {
      // Intentar obtener información del usuario desde el almacenamiento local
      try {
        const authStore = JSON.parse(localStorage.getItem('authStore') || '{}');
        if (authStore.user) {
          userType = this.determineUserType(authStore.user);
        }
      } catch (error) {
        console.warn('Error obteniendo configuración de usuario actual', error);
      }
    }

    return this.getUserConfig(userType);
  },

  // Función para validar si una operación está dentro de los límites del usuario
  validateOperation(userConfig, operationType, size = 0) {
    const validations = {
      canStoreImage: size <= userConfig.maxPerImage,
      canAddMoreImages: true, // Esto se validaría contando imágenes existentes
      storageAvailable: true, // Esto se validaría con el uso actual
      meetsQualityStandards: true
    };

    // Validar tamaño de imagen
    if (operationType === 'store_image' || operationType === 'upload_image') {
      validations.canStoreImage = size <= userConfig.maxPerImage;

      if (!validations.canStoreImage) {
        return {
          valid: false,
          reason: 'image_too_large',
          maxSize: userConfig.maxPerImage,
          actualSize: size,
          userType: userConfig.userType
        };
      }
    }

    return {
      valid: true,
      validations,
      userConfig
    };
  },

  // Configuración de monitoreo y alertas
  monitoring: {
    enableDetailedLogging: true,
    enablePerformanceTracking: true,
    enableUserBehaviorAnalytics: false,
    alertThresholds: {
      storageUsage: [60, 80, 90, 95],
      compressionRatio: [0.3, 0.5, 0.7],
      cleanupFrequency: [10, 30, 60] // minutos
    }
  },

  // Configuración de optimización automática
  autoOptimization: {
    enabled: true,
    triggerThreshold: 60, // Porcentaje de uso que activa optimización
    strategies: ['conservative', 'balanced', 'aggressive'],
    defaultStrategy: 'balanced',
    maxOptimizationTime: 30000, // 30 segundos
    minSpaceSaving: 0.1 // 10% mínimo de ahorro
  }
};

// Exportar configuración por defecto
export default PhotoProfileStorageConfig;