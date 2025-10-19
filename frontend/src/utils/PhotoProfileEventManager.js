// Sistema avanzado de eventos para sincronización de fotos de perfil
class PhotoProfileEventManager {
  constructor() {
    this.events = new Map();
    this.logger = {
      info: (message, data) => {
        console.log(`[PhotoProfileEventManager] ${message}`, data || '');
      },
      error: (message, error) => {
        console.error(`[PhotoProfileEventManager] ${message}`, error);
      },
      warn: (message, data) => {
        console.warn(`[PhotoProfileEventManager] ${message}`, data || '');
      }
    };

    // Configuración de eventos
    this.eventConfig = {
      // Eventos de actualización de foto
      'photoProfileUpdate': {
        maxListeners: 50,
        description: 'Foto de perfil actualizada'
      },
      'photoProfileImmediateUpdate': {
        maxListeners: 50,
        description: 'Actualización inmediata de foto de perfil'
      },
      'photoProfileCacheUpdate': {
        maxListeners: 50,
        description: 'Actualización de caché de foto de perfil'
      },
      'photoProfileGlobalUpdate': {
        maxListeners: 100,
        description: 'Evento global de actualización de foto de perfil'
      },

      // Eventos de error
      'photoProfileError': {
        maxListeners: 20,
        description: 'Error en operación de foto de perfil'
      },

      // Eventos de progreso
      'photoProfileUploadProgress': {
        maxListeners: 10,
        description: 'Progreso de subida de foto de perfil'
      },

      // Eventos de sincronización
      'photoProfileSync': {
        maxListeners: 30,
        description: 'Sincronización entre componentes'
      }
    };

    // Inicializar eventos del navegador si está disponible
    if (typeof window !== 'undefined') {
      this.setupGlobalEventListeners();
    }
  }

  // Configurar listeners globales para eventos del navegador
  setupGlobalEventListeners() {
    // Mapear eventos personalizados a eventos del navegador
    Object.keys(this.eventConfig).forEach(eventName => {
      const handleGlobalEvent = (nativeEvent) => {
        try {
          // Emitir evento interno con los datos del evento nativo
          this.emit(eventName, nativeEvent.detail);
        } catch (error) {
          this.logger.error(`Error manejando evento global ${eventName}`, error);
        }
      };

      window.addEventListener(eventName, handleGlobalEvent);

      // Guardar referencia para cleanup
      this.globalEventListeners = this.globalEventListeners || new Map();
      this.globalEventListeners.set(eventName, handleGlobalEvent);
    });
  }

  // Método para suscribirse a eventos
  on(eventName, listener, options = {}) {
    if (typeof listener !== 'function') {
      throw new Error('El listener debe ser una función');
    }

    // Verificar configuración del evento
    const config = this.eventConfig[eventName];
    if (!config) {
      this.logger.warn(`Evento no configurado: ${eventName}`);
      // Crear configuración por defecto
      this.eventConfig[eventName] = {
        maxListeners: 10,
        description: `Evento personalizado: ${eventName}`
      };
    }

    // Inicializar array de listeners para este evento
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listeners = this.events.get(eventName);

    // Verificar límite de listeners
    if (listeners.length >= config.maxListeners) {
      this.logger.warn(`Número máximo de listeners alcanzado para ${eventName}`, {
        current: listeners.length,
        max: config.maxListeners
      });
    }

    // Agregar listener con opciones
    listeners.push({
      listener,
      options: {
        once: false,
        priority: 0,
        ...options
      }
    });

    // Ordenar por prioridad
    listeners.sort((a, b) => b.options.priority - a.options.priority);

    this.logger.info(`Listener agregado a evento ${eventName}`, {
      totalListeners: listeners.length,
      priority: options.priority || 0
    });

    // Retornar función de unsubscribe
    return () => {
      this.off(eventName, listener);
    };
  }

  // Método para suscribirse a evento único (se ejecuta solo una vez)
  once(eventName, listener, options = {}) {
    return this.on(eventName, listener, { ...options, once: true });
  }

  // Método para desuscribirse de eventos
  off(eventName, listener) {
    if (!this.events.has(eventName)) {
      return false;
    }

    const listeners = this.events.get(eventName);
    const index = listeners.findIndex(item => item.listener === listener);

    if (index > -1) {
      listeners.splice(index, 1);
      this.logger.info(`Listener removido de evento ${eventName}`, {
        remainingListeners: listeners.length
      });
      return true;
    }

    return false;
  }

  // Método para emitir eventos
  emit(eventName, data, options = {}) {
    if (!this.events.has(eventName)) {
      this.logger.warn(`Emitiendo evento sin listeners: ${eventName}`);
      return false;
    }

    const listeners = this.events.get(eventName);
    if (listeners.length === 0) {
      this.logger.warn(`No hay listeners para evento: ${eventName}`);
      return false;
    }

    // Preparar datos del evento
    const eventData = {
      eventName,
      data,
      timestamp: Date.now(),
      source: options.source || 'PhotoProfileEventManager',
      ...data
    };

    this.logger.info(`Emitiendo evento ${eventName}`, {
      listenersCount: listeners.length,
      hasData: !!data
    });

    // Ejecutar listeners
    const listenersToRemove = [];
    listeners.forEach((item, index) => {
      try {
        const { listener, options } = item;

        // Ejecutar listener
        listener(eventData);

        // Marcar para remoción si es "once"
        if (options.once) {
          listenersToRemove.push(index);
        }
      } catch (error) {
        this.logger.error(`Error ejecutando listener para evento ${eventName}`, error);
      }
    });

    // Remover listeners marcados
    listenersToRemove.reverse().forEach(index => {
      listeners.splice(index, 1);
    });

    // También emitir evento global del navegador si está disponible
    if (typeof window !== 'undefined' && !options.internal) {
      try {
        const globalEvent = new CustomEvent(eventName, {
          detail: eventData
        });
        window.dispatchEvent(globalEvent);
      } catch (error) {
        this.logger.error(`Error emitiendo evento global ${eventName}`, error);
      }
    }

    return true;
  }

  // Método para remover todos los listeners de un evento
  removeAllListeners(eventName) {
    if (!this.events.has(eventName)) {
      return 0;
    }

    const listeners = this.events.get(eventName);
    const removedCount = listeners.length;

    this.events.delete(eventName);

    this.logger.info(`Todos los listeners removidos para evento ${eventName}`, {
      removedCount
    });

    return removedCount;
  }

  // Método para obtener información de eventos
  getEventInfo(eventName) {
    if (!this.events.has(eventName)) {
      return null;
    }

    const listeners = this.events.get(eventName);
    const config = this.eventConfig[eventName];

    return {
      eventName,
      listenersCount: listeners.length,
      maxListeners: config?.maxListeners || 10,
      description: config?.description || 'Evento personalizado',
      listeners: listeners.map((item, index) => ({
        index,
        priority: item.options.priority,
        once: item.options.once
      }))
    };
  }

  // Método para obtener estadísticas generales
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: 0,
      events: []
    };

    this.events.forEach((listeners, eventName) => {
      const config = this.eventConfig[eventName];
      stats.totalListeners += listeners.length;
      stats.events.push({
        eventName,
        listenersCount: listeners.length,
        maxListeners: config?.maxListeners || 10,
        description: config?.description || 'Evento personalizado'
      });
    });

    return stats;
  }

  // Método para limpiar recursos
  cleanup() {
    // Remover listeners globales del navegador
    if (this.globalEventListeners && typeof window !== 'undefined') {
      this.globalEventListeners.forEach((listener, eventName) => {
        window.removeEventListener(eventName, listener);
      });
      this.globalEventListeners.clear();
    }

    // Limpiar todos los eventos internos
    this.events.clear();

    this.logger.info('PhotoProfileEventManager limpiado completamente');
  }

  // Método para crear eventos específicos de foto de perfil
  emitPhotoUpdate(userId, data = {}) {
    return this.emit('photoProfileUpdate', {
      userId,
      action: 'update',
      ...data
    });
  }

  emitPhotoImmediateUpdate(userId, data = {}) {
    return this.emit('photoProfileImmediateUpdate', {
      userId,
      action: 'immediateUpdate',
      ...data
    });
  }

  emitPhotoCacheUpdate(userId, data = {}) {
    return this.emit('photoProfileCacheUpdate', {
      userId,
      action: 'cacheUpdate',
      ...data
    });
  }

  emitPhotoError(userId, error, data = {}) {
    return this.emit('photoProfileError', {
      userId,
      error: error.message || error,
      action: 'error',
      ...data
    });
  }

  emitPhotoUploadProgress(userId, progress, data = {}) {
    return this.emit('photoProfileUploadProgress', {
      userId,
      progress: Math.round(progress),
      action: 'uploadProgress',
      ...data
    });
  }

  emitPhotoSync(userId, data = {}) {
    return this.emit('photoProfileSync', {
      userId,
      action: 'sync',
      ...data
    });
  }
}

// Crear instancia singleton
const photoProfileEventManager = new PhotoProfileEventManager();

export default photoProfileEventManager;