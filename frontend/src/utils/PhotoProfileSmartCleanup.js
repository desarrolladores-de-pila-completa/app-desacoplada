// Sistema avanzado de limpieza inteligente para optimización de espacio en caché de fotos de perfil
class PhotoProfileSmartCleanup {
  constructor() {
    this.CACHE_KEY = 'fotoPerfil_cache';
    this.CLEANUP_STRATEGIES_KEY = 'fotoPerfil_cleanup_strategies';

    // Configuración de estrategias de limpieza
    this.strategies = {
      AGE_BASED: 'age_based',
      SIZE_BASED: 'size_based',
      USAGE_BASED: 'usage_based',
      USER_BASED: 'user_based',
      PREDICTIVE: 'predictive'
    };

    // Configuración de prioridades
    this.priority = {
      CRITICAL: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25,
      VERY_LOW: 10
    };

    this.logger = {
      info: (message, data) => {
        console.log(`[SmartCleanup] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[SmartCleanup] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[SmartCleanup] ${message}`, data || '');
      }
    };

    // Inicializar estrategias si no existen
    this.initializeCleanupStrategies();
  }

  // Inicializar estrategias de limpieza
  initializeCleanupStrategies() {
    try {
      if (!localStorage.getItem(this.CLEANUP_STRATEGIES_KEY)) {
        const defaultStrategies = {
          lastUsed: {},
          effectiveness: {},
          userPreferences: {},
          createdAt: Date.now()
        };
        localStorage.setItem(this.CLEANUP_STRATEGIES_KEY, JSON.stringify(defaultStrategies));
      }
    } catch (error) {
      this.logger.error('Error inicializando estrategias de limpieza', error);
    }
  }

  // Ejecutar limpieza inteligente basada en múltiples factores
  async executeSmartCleanup(options = {}) {
    const {
      targetReductionMB = 10,
      urgency = 'normal',
      preserveImportantUsers = true,
      maxExecutionTime = 5000
    } = options;

    const startTime = Date.now();

    try {
      this.logger.info('Iniciando limpieza inteligente', {
        targetReductionMB,
        urgency,
        preserveImportantUsers
      });

      // Obtener información del caché actual
      const cacheInfo = await this.analyzeCache();
      if (cacheInfo.entries.length === 0) {
        return {
          success: true,
          cleanedEntries: 0,
          freedSpace: 0,
          strategy: 'none',
          reason: 'empty_cache'
        };
      }

      // Seleccionar estrategia óptima basada en la situación
      const optimalStrategy = this.selectOptimalStrategy(cacheInfo, urgency, targetReductionMB);

      // Ejecutar limpieza según la estrategia seleccionada
      const cleanupResult = await this.executeStrategy(
        optimalStrategy,
        cacheInfo,
        targetReductionMB,
        preserveImportantUsers,
        maxExecutionTime - (Date.now() - startTime)
      );

      // Registrar resultados para aprendizaje futuro
      this.recordStrategyEffectiveness(optimalStrategy, cleanupResult);

      this.logger.info('Limpieza inteligente completada', {
        strategy: optimalStrategy,
        result: cleanupResult,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        ...cleanupResult,
        executionTime: Date.now() - startTime,
        strategy: optimalStrategy
      };

    } catch (error) {
      this.logger.error('Error durante limpieza inteligente', error);
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // Analizar el estado actual del caché
  async analyzeCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entries = Object.keys(cache);
      const now = Date.now();

      const analysis = {
        entries: [],
        totalSize: 0,
        averageAge: 0,
        sizeDistribution: {
          small: 0,    // < 500KB
          medium: 0,   // 500KB - 2MB
          large: 0,    // 2MB - 5MB
          huge: 0      // > 5MB
        },
        ageDistribution: {
          recent: 0,   // < 1 hora
          today: 0,    // 1-24 horas
          week: 0,     // 1-7 días
          old: 0       // > 7 días
        },
        userDistribution: {},
        largestEntries: [],
        oldestEntries: []
      };

      let totalAge = 0;

      entries.forEach(userId => {
        const entry = cache[userId];
        if (entry && entry.timestamp) {
          const entrySize = this.estimateEntrySize(entry);
          const age = now - entry.timestamp;

          // Información básica de la entrada
          const entryInfo = {
            userId,
            size: entrySize,
            age,
            timestamp: entry.timestamp,
            hasValidUrl: entry.url && entry.url.startsWith('blob:'),
            urlLength: entry.url ? entry.url.length : 0
          };

          analysis.entries.push(entryInfo);
          analysis.totalSize += entrySize;
          totalAge += age;

          // Distribución por tamaño
          if (entrySize < 500 * 1024) {
            analysis.sizeDistribution.small++;
          } else if (entrySize < 2 * 1024 * 1024) {
            analysis.sizeDistribution.medium++;
          } else if (entrySize < 5 * 1024 * 1024) {
            analysis.sizeDistribution.large++;
          } else {
            analysis.sizeDistribution.huge++;
          }

          // Distribución por edad
          if (age < 60 * 60 * 1000) {
            analysis.ageDistribution.recent++;
          } else if (age < 24 * 60 * 60 * 1000) {
            analysis.ageDistribution.today++;
          } else if (age < 7 * 24 * 60 * 60 * 1000) {
            analysis.ageDistribution.week++;
          } else {
            analysis.ageDistribution.old++;
          }

          // Distribución por usuario
          if (!analysis.userDistribution[userId]) {
            analysis.userDistribution[userId] = {
              count: 0,
              totalSize: 0,
              oldest: age,
              newest: age
            };
          }

          analysis.userDistribution[userId].count++;
          analysis.userDistribution[userId].totalSize += entrySize;
          analysis.userDistribution[userId].oldest = Math.max(analysis.userDistribution[userId].oldest, age);
          analysis.userDistribution[userId].newest = Math.min(analysis.userDistribution[userId].newest, age);
        }
      });

      // Calcular promedio de edad
      analysis.averageAge = entries.length > 0 ? totalAge / entries.length : 0;

      // Encontrar entradas más grandes y más antiguas
      analysis.largestEntries = analysis.entries
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);

      analysis.oldestEntries = analysis.entries
        .sort((a, b) => b.age - a.age)
        .slice(0, 10);

      // Calcular métricas adicionales
      analysis.fragmentationRatio = this.calculateFragmentationRatio(analysis);
      analysis.efficiencyScore = this.calculateEfficiencyScore(analysis);

      return analysis;

    } catch (error) {
      this.logger.error('Error analizando caché', error);
      return {
        entries: [],
        totalSize: 0,
        error: error.message
      };
    }
  }

  // Seleccionar estrategia óptima basada en el análisis
  selectOptimalStrategy(cacheInfo, urgency, targetReductionMB) {
    const urgencyMultiplier = {
      'low': 1,
      'normal': 1.5,
      'high': 2,
      'critical': 3
    };

    const adjustedTarget = targetReductionMB * urgencyMultiplier[urgency] || 1.5;

    // Evaluar cada estrategia y asignar puntuación
    const strategyScores = {};

    // Estrategia basada en edad
    strategyScores[this.strategies.AGE_BASED] = this.scoreAgeBasedStrategy(cacheInfo, adjustedTarget);

    // Estrategia basada en tamaño
    strategyScores[this.strategies.SIZE_BASED] = this.scoreSizeBasedStrategy(cacheInfo, adjustedTarget);

    // Estrategia basada en uso
    strategyScores[this.strategies.USAGE_BASED] = this.scoreUsageBasedStrategy(cacheInfo, adjustedTarget);

    // Estrategia basada en usuario
    strategyScores[this.strategies.USER_BASED] = this.scoreUserBasedStrategy(cacheInfo, adjustedTarget);

    // Estrategia predictiva
    strategyScores[this.strategies.PREDICTIVE] = this.scorePredictiveStrategy(cacheInfo, adjustedTarget);

    // Seleccionar estrategia con mayor puntuación
    let bestStrategy = this.strategies.AGE_BASED;
    let bestScore = 0;

    Object.keys(strategyScores).forEach(strategy => {
      if (strategyScores[strategy] > bestScore) {
        bestScore = strategyScores[strategy];
        bestStrategy = strategy;
      }
    });

    this.logger.info('Estrategia seleccionada', {
      strategy: bestStrategy,
      score: bestScore,
      urgency,
      targetReductionMB,
      strategyScores
    });

    return bestStrategy;
  }

  // Puntuación para estrategia basada en edad
  scoreAgeBasedStrategy(cacheInfo, targetReduction) {
    let score = this.priority.LOW;

    // Bonos por distribución de edad
    if (cacheInfo.ageDistribution.old > cacheInfo.entries.length * 0.3) {
      score += this.priority.HIGH; // Muchas entradas antiguas
    }
    if (cacheInfo.ageDistribution.recent > cacheInfo.entries.length * 0.5) {
      score += this.priority.MEDIUM; // Muchas entradas recientes
    }

    // Bono por eficiencia
    if (cacheInfo.efficiencyScore > 0.7) {
      score += this.priority.MEDIUM;
    }

    // Penalización por fragmentación alta
    if (cacheInfo.fragmentationRatio > 0.8) {
      score -= this.priority.LOW;
    }

    return Math.max(0, score);
  }

  // Puntuación para estrategia basada en tamaño
  scoreSizeBasedStrategy(cacheInfo, targetReduction) {
    let score = this.priority.MEDIUM;

    // Bono por entradas grandes
    if (cacheInfo.sizeDistribution.huge > 0) {
      score += this.priority.HIGH;
    }
    if (cacheInfo.sizeDistribution.large > cacheInfo.entries.length * 0.2) {
      score += this.priority.MEDIUM;
    }

    // Bono por eficiencia de espacio
    if (cacheInfo.efficiencyScore > 0.8) {
      score += this.priority.HIGH;
    }

    return score;
  }

  // Puntuación para estrategia basada en uso
  scoreUsageBasedStrategy(cacheInfo, targetReduction) {
    let score = this.priority.MEDIUM;

    // Analizar patrones de uso por usuario
    const usersWithMultipleImages = Object.keys(cacheInfo.userDistribution).filter(
      userId => cacheInfo.userDistribution[userId].count > 3
    );

    if (usersWithMultipleImages.length > 0) {
      score += this.priority.HIGH;
    }

    return score;
  }

  // Puntuación para estrategia basada en usuario
  scoreUserBasedStrategy(cacheInfo, targetReduction) {
    let score = this.priority.LOW;

    // Si hay usuarios con muchas imágenes, esta estrategia es útil
    const heavyUsers = Object.keys(cacheInfo.userDistribution).filter(
      userId => cacheInfo.userDistribution[userId].count > 5
    );

    if (heavyUsers.length > 0) {
      score += this.priority.HIGH;
    }

    return score;
  }

  // Puntuación para estrategia predictiva
  scorePredictiveStrategy(cacheInfo, targetReduction) {
    let score = this.priority.MEDIUM;

    // Basado en tendencias históricas y proyecciones
    if (cacheInfo.averageAge > 12 * 60 * 60 * 1000) { // Más de 12 horas promedio
      score += this.priority.HIGH;
    }

    return score;
  }

  // Ejecutar estrategia seleccionada
  async executeStrategy(strategy, cacheInfo, targetReductionMB, preserveImportantUsers, timeLimit) {
    const startTime = Date.now();

    switch (strategy) {
      case this.strategies.AGE_BASED:
        return await this.executeAgeBasedCleanup(cacheInfo, targetReductionMB, timeLimit);

      case this.strategies.SIZE_BASED:
        return await this.executeSizeBasedCleanup(cacheInfo, targetReductionMB, timeLimit);

      case this.strategies.USAGE_BASED:
        return await this.executeUsageBasedCleanup(cacheInfo, targetReductionMB, timeLimit);

      case this.strategies.USER_BASED:
        return await this.executeUserBasedCleanup(cacheInfo, targetReductionMB, preserveImportantUsers, timeLimit);

      case this.strategies.PREDICTIVE:
        return await this.executePredictiveCleanup(cacheInfo, targetReductionMB, timeLimit);

      default:
        return await this.executeAgeBasedCleanup(cacheInfo, targetReductionMB, timeLimit);
    }
  }

  // Estrategia basada en edad
  async executeAgeBasedCleanup(cacheInfo, targetReductionMB, timeLimit) {
    const targetBytes = targetReductionMB * 1024 * 1024;
    const sortedByAge = cacheInfo.entries.sort((a, b) => b.age - a.age);

    return this.executeCleanupByList(sortedByAge, targetBytes, 'age', timeLimit);
  }

  // Estrategia basada en tamaño
  async executeSizeBasedCleanup(cacheInfo, targetReductionMB, timeLimit) {
    const targetBytes = targetReductionMB * 1024 * 1024;
    const sortedBySize = cacheInfo.entries.sort((a, b) => b.size - a.size);

    return this.executeCleanupByList(sortedBySize, targetBytes, 'size', timeLimit);
  }

  // Estrategia basada en uso (simulada por número de imágenes por usuario)
  async executeUsageBasedCleanup(cacheInfo, targetReductionMB, timeLimit) {
    const targetBytes = targetReductionMB * 1024 * 1024;

    // Crear lista basada en usuarios con más imágenes primero
    const userGroups = Object.keys(cacheInfo.userDistribution)
      .sort((a, b) => cacheInfo.userDistribution[b].count - cacheInfo.userDistribution[a].count);

    const entriesToRemove = [];

    for (const userId of userGroups) {
      if (Date.now() - startTime > timeLimit) break;

      const userEntries = cacheInfo.entries
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.age - a.age); // Más antiguas primero

      // Tomar la mitad de las entradas del usuario (redondeado hacia abajo)
      const entriesToTake = Math.floor(userEntries.length / 2);
      entriesToRemove.push(...userEntries.slice(0, entriesToTake));
    }

    return this.executeCleanupByList(entriesToRemove, targetBytes, 'usage', timeLimit);
  }

  // Estrategia basada en usuario
  async executeUserBasedCleanup(cacheInfo, targetReductionMB, preserveImportantUsers, timeLimit) {
    // Identificar usuarios "importantes" (los que más almacenamiento usan)
    const usersBySize = Object.keys(cacheInfo.userDistribution)
      .sort((a, b) => cacheInfo.userDistribution[b].totalSize - cacheInfo.userDistribution[a].totalSize);

    const importantUsers = new Set(usersBySize.slice(0, Math.ceil(usersBySize.length * 0.3)));

    const entriesToRemove = cacheInfo.entries
      .filter(entry => !preserveImportantUsers || !importantUsers.has(entry.userId))
      .sort((a, b) => b.age - a.age);

    const targetBytes = targetReductionMB * 1024 * 1024;
    return this.executeCleanupByList(entriesToRemove, targetBytes, 'user', timeLimit);
  }

  // Estrategia predictiva
  async executePredictiveCleanup(cacheInfo, targetReductionMB, timeLimit) {
    // Combinar múltiples factores para una limpieza óptima
    const entriesToRemove = cacheInfo.entries
      .map(entry => ({
        ...entry,
        // Puntuación compuesta basada en edad, tamaño y eficiencia
        score: (entry.age / (24 * 60 * 60 * 1000)) * 0.4 + // 40% peso en edad
               (entry.size / (5 * 1024 * 1024)) * 0.4 +    // 40% peso en tamaño
               (entry.urlLength / 1000) * 0.2               // 20% peso en longitud de URL
      }))
      .sort((a, b) => b.score - a.score);

    const targetBytes = targetReductionMB * 1024 * 1024;
    return this.executeCleanupByList(entriesToRemove, targetBytes, 'predictive', timeLimit);
  }

  // Ejecutar limpieza basada en lista ordenada
  async executeCleanupByList(entryList, targetBytes, strategy, timeLimit) {
    let cleanedCount = 0;
    let freedSpace = 0;
    const removedEntries = [];

    for (const entry of entryList) {
      if (Date.now() - Date.now() > timeLimit || freedSpace >= targetBytes) {
        break;
      }

      const entrySize = this.estimateEntrySize({
        url: entry.url || '',
        timestamp: entry.timestamp
      });

      if (freedSpace + entrySize <= targetBytes * 1.2) { // Permitir 20% de sobre-aprovisionamiento
        removedEntries.push(entry.userId);
        freedSpace += entrySize;
        cleanedCount++;
      }
    }

    // Ejecutar la limpieza real
    if (removedEntries.length > 0) {
      await this.performActualCleanup(removedEntries);
    }

    return {
      cleanedEntries: cleanedCount,
      freedSpace,
      freedSpaceMB: (freedSpace / (1024 * 1024)).toFixed(2),
      strategy,
      removedEntries: removedEntries.length
    };
  }

  // Realizar limpieza física de las entradas
  async performActualCleanup(userIds) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');

      userIds.forEach(userId => {
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

          delete cache[userId];
        }
      });

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));

      this.logger.info('Limpieza física completada', {
        removedEntries: userIds.length
      });

    } catch (error) {
      this.logger.error('Error durante limpieza física', error);
      throw error;
    }
  }

  // Calcular ratio de fragmentación
  calculateFragmentationRatio(analysis) {
    // Un ratio alto indica que hay muchas entradas pequeñas dispersas
    const totalEntries = analysis.entries.length;
    const smallEntriesRatio = analysis.sizeDistribution.small / totalEntries;

    return Math.min(1, smallEntriesRatio * 2); // Normalizado entre 0-1
  }

  // Calcular puntuación de eficiencia
  calculateEfficiencyScore(analysis) {
    // Basado en distribución de tamaño y edad
    const sizeEfficiency = 1 - (analysis.sizeDistribution.small / analysis.entries.length);
    const ageEfficiency = analysis.ageDistribution.old / analysis.entries.length;

    return (sizeEfficiency + ageEfficiency) / 2;
  }

  // Estimar tamaño de entrada
  estimateEntrySize(entry) {
    try {
      const entryString = JSON.stringify(entry);
      return entryString.length * 2; // UTF-16
    } catch (error) {
      return 1024;
    }
  }

  // Registrar efectividad de estrategias para aprendizaje futuro
  recordStrategyEffectiveness(strategy, result) {
    try {
      const strategies = JSON.parse(localStorage.getItem(this.CLEANUP_STRATEGIES_KEY) || '{}');

      if (!strategies.lastUsed[strategy]) {
        strategies.lastUsed[strategy] = [];
      }

      strategies.lastUsed[strategy].push({
        timestamp: Date.now(),
        result,
        effectiveness: result.freedSpace / (result.cleanedEntries || 1)
      });

      // Mantener solo las últimas 10 ejecuciones por estrategia
      if (strategies.lastUsed[strategy].length > 10) {
        strategies.lastUsed[strategy] = strategies.lastUsed[strategy].slice(-10);
      }

      localStorage.setItem(this.CLEANUP_STRATEGIES_KEY, JSON.stringify(strategies));

    } catch (error) {
      this.logger.error('Error registrando efectividad de estrategia', error);
    }
  }

  // Obtener estadísticas de efectividad de estrategias
  getStrategyEffectiveness() {
    try {
      const strategies = JSON.parse(localStorage.getItem(this.CLEANUP_STRATEGIES_KEY) || '{}');
      const effectiveness = {};

      Object.keys(strategies.lastUsed).forEach(strategy => {
        const executions = strategies.lastUsed[strategy];
        if (executions.length > 0) {
          const avgEffectiveness = executions.reduce((sum, exec) => sum + exec.effectiveness, 0) / executions.length;
          const lastExecution = executions[executions.length - 1];

          effectiveness[strategy] = {
            averageEffectiveness: Math.round(avgEffectiveness),
            totalExecutions: executions.length,
            lastExecution: lastExecution.timestamp,
            lastResult: lastExecution.result
          };
        }
      });

      return effectiveness;

    } catch (error) {
      this.logger.error('Error obteniendo efectividad de estrategias', error);
      return {};
    }
  }
}

// Crear instancia singleton
const photoProfileSmartCleanup = new PhotoProfileSmartCleanup();

export default photoProfileSmartCleanup;