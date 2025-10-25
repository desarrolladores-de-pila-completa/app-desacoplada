import React from "react";
const API_URL = "http://localhost:3000";

// Stub objects for photo profile management (to prevent undefined errors)
const photoProfileStorageManager = {
  startMonitoring: () => {},
  stopMonitoring: () => {},
  getDetailedStorageStats: () => ({}),
  getOptimizationRecommendations: () => ({ recommendations: [] })
};

const photoProfileImageCompressor = {
  getStorageUsage: () => ({ canAcceptNewImage: true, usagePercentage: 0 }),
  compressImage: async (blob, options) => ({ success: true, blob, originalSize: blob.size, compressedSize: blob.size, compressionRatio: 1, qualityUsed: 'auto' })
};

const photoProfileSmartCleanup = {
  executeSmartCleanup: async (options) => ({ success: true, cleanedMB: 0 })
};

const photoProfileCacheOptimizer = {
  autoOptimizeIfNeeded: async () => ({ optimized: false }),
  optimizeEntireCache: async (options) => ({ success: true })
};

const PhotoProfileStorageConfig = {
  getCurrentUserConfig: (user) => ({}),
  validateOperation: (config, operationType, size) => ({ valid: true })
};

// Función auxiliar para logging mejorado
const logger = {
  info: (message, data) => {
    console.log(`[FotoPerfil] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[FotoPerfil] ${message}`, error);
  },
  warn: (message, data) => {
    console.warn(`[FotoPerfil] ${message}`, data || '');
  }
};

// Función auxiliar para reintento automático simple
const retryFetch = async (url, options = {}, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || i === maxRetries - 1) {
        return response;
      }
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Función auxiliar para gestión de caché mejorada
const CACHE_KEY = 'fotoPerfil_cache';
const CACHE_DURATION = 30 * 1000; // Reducido a 30 segundos para actualización más rápida
const MAX_CACHE_ENTRIES = 50; // Máximo número de entradas en caché

// Función mejorada para limpiar URLs de objetos y evitar fugas de memoria
const revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.warn('Error al revocar URL de objeto', { url, error });
    }
  }
};

const getCachedImage = (userId) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[userId];

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info('Usando imagen desde caché', {
        userId,
        age: Date.now() - cached.timestamp,
        compressed: cached.compressed || false,
        compressionRatio: cached.compressionRatio || 1
      });
      return cached.url;
    } else if (cached) {
      logger.info('Caché expirado, eliminando entrada', { userId, age: Date.now() - cached.timestamp });

      // Liberar URL de objeto antes de eliminar del caché
      revokeObjectURL(cached.url);
      delete cache[userId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

      // Actualizar estadísticas de almacenamiento después de eliminar entrada
      photoProfileStorageManager.getDetailedStorageStats();
    }
  } catch (error) {
    logger.warn('Error al leer caché', error);
  }
  return null;
};

const setCachedImage = async (userId, url, blob = null) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');

    // Verificar estado de almacenamiento antes de agregar nueva imagen
    const storageCheck = photoProfileImageCompressor.getStorageUsage();
    if (!storageCheck.canAcceptNewImage) {
      logger.warn('Almacenamiento lleno, ejecutando limpieza automática', storageCheck);

      // Ejecutar limpieza automática antes de proceder
      await photoProfileSmartCleanup.executeSmartCleanup({
        targetReductionMB: 5,
        urgency: storageCheck.usagePercentage > 90 ? 'critical' : 'normal'
      });
    }

    // Si tenemos el blob, comprimir la imagen antes de guardarla
    let processedBlob = blob;
    let compressionInfo = null;

    if (blob) {
      const compressionResult = await photoProfileImageCompressor.compressImage(blob, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 'auto',
        userId
      });

      if (compressionResult.success) {
        processedBlob = compressionResult.blob;
        compressionInfo = {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          compressionRatio: compressionResult.compressionRatio,
          qualityUsed: compressionResult.qualityUsed
        };

        // Crear nueva URL de objeto para la imagen comprimida
        if (url && url.startsWith('blob:')) {
          revokeObjectURL(url);
        }
        url = URL.createObjectURL(processedBlob);

        logger.info('Imagen comprimida antes de guardar en caché', {
          userId,
          ...compressionInfo
        });
      }
    }

    // Limpiar entradas antiguas si excede el límite
    const entries = Object.keys(cache);
    if (entries.length >= MAX_CACHE_ENTRIES) {
      // Usar limpieza inteligente en lugar de limpieza básica
      const cleanupResult = await photoProfileSmartCleanup.executeSmartCleanup({
        targetReductionMB: 2,
        urgency: 'low'
      });

      logger.info('Limpieza inteligente ejecutada durante setCachedImage', cleanupResult);
    }

    // Si ya existe una entrada para este usuario, revocar la URL anterior
    if (cache[userId]) {
      revokeObjectURL(cache[userId].url);
    }

    // Crear entrada mejorada con información de compresión
    const cacheEntry = {
      url,
      timestamp: Date.now(),
      ...(compressionInfo && {
        originalSize: compressionInfo.originalSize,
        compressedSize: compressionInfo.compressedSize,
        compressionRatio: compressionInfo.compressionRatio,
        qualityUsed: compressionInfo.qualityUsed,
        compressed: true
      })
    };

    cache[userId] = cacheEntry;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

    // Actualizar estadísticas de almacenamiento
    photoProfileStorageManager.getDetailedStorageStats();

    logger.info('Imagen guardada en caché con optimización', {
      userId,
      totalEntries: Object.keys(cache).length,
      compressionInfo,
      storageUsage: photoProfileImageCompressor.getStorageUsage()
    });

  } catch (error) {
    logger.warn('Error al guardar en caché con optimización', error);
    // Fallback a método original si hay error
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      if (cache[userId]) {
        revokeObjectURL(cache[userId].url);
      }
      cache[userId] = {
        url,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (fallbackError) {
      logger.error('Error incluso en método fallback', fallbackError);
    }
  }
};

// Función para limpiar caché de un usuario específico (útil al actualizar foto)
const clearUserCache = (userId) => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cache[userId]) {
      revokeObjectURL(cache[userId].url);
      delete cache[userId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      logger.info('Caché del usuario limpiado', { userId });
    }
  } catch (error) {
    logger.warn('Error al limpiar caché del usuario', error);
  }
};

// Función para limpiar caché completo (útil para debugging)
const clearImageCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    logger.info('Caché de imágenes limpiado completamente');
  } catch (error) {
    logger.warn('Error al limpiar caché', error);
  }
};

// Función para obtener estadísticas de caché
const getCacheStats = () => {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entries = Object.keys(cache);
    const now = Date.now();

    const stats = {
      totalEntries: entries.length,
      validEntries: 0,
      expiredEntries: 0,
      oldestEntry: null,
      newestEntry: null
    };

    entries.forEach(userId => {
      const entry = cache[userId];
      if (now - entry.timestamp < CACHE_DURATION) {
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
    logger.warn('Error al obtener estadísticas de caché', error);
    return null;
  }
};

function FotoPerfil({
  user,
  setUser,
  editable,
  authUserId,
  id,
  fotoPerfil,
  useAdvancedUpload = false,
  onPhotoUpload,
  uploadProps = {}
}) {
  const inputRef = React.useRef();
  const [preview, setPreview] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now()); // Para forzar recarga
  const [forceRefreshKey, setForceRefreshKey] = React.useState(0); // Clave adicional para forzar recarga absoluta
  const [isRefreshing, setIsRefreshing] = React.useState(false); // Estado de actualización en tiempo real

  // Función avanzada para forzar recarga inmediata
  const forceImmediateRefresh = React.useCallback(async (targetUserId) => {
    const userIdToRefresh = targetUserId || id;
    if (!userIdToRefresh) return;

    logger.info('Iniciando recarga inmediata forzada', { userId: userIdToRefresh });

    setIsRefreshing(true);

    try {
      // 1. Limpiar caché completamente para este usuario
      clearUserCache(userIdToRefresh);

      // 2. Forzar limpieza de cualquier caché de navegador relacionado
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          logger.info('Caché del navegador limpiado');
        } catch (cacheError) {
          logger.warn('Error al limpiar caché del navegador', cacheError);
        }
      }

      // 3. Agregar timestamp único para evitar cualquier caché
      const timestamp = Date.now();
      const refreshUrl = `${API_URL}/api/auth/user/${userIdToRefresh}/foto?_t=${timestamp}&_refresh=${forceRefreshKey}`;

      const res = await fetch(refreshUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });

      if (res.ok) {
        const blob = await res.blob();
        const previewUrl = URL.createObjectURL(blob);

        // Revocar URL anterior
        if (preview && preview.startsWith('blob:')) {
          revokeObjectURL(preview);
        }

        setPreview(previewUrl);
        setCachedImage(userIdToRefresh, previewUrl);

        // Actualizar clave de refresh para futuras recargas
        setForceRefreshKey(prev => prev + 1);

        // Forzar actualización del estado global
        if (setUser && typeof setUser === 'function') {
          setUser(prevUser => ({
            ...prevUser,
            fotoPerfil: previewUrl,
            lastFotoUpdate: timestamp
          }));
        }

        // Disparar evento de actualización inmediata
        const event = new CustomEvent('fotoPerfilImmediateUpdate', {
          detail: {
            userId: userIdToRefresh,
            previewUrl,
            timestamp,
            source: 'FotoPerfil-forceRefresh',
            forceUpdate: true,
            refreshKey: forceRefreshKey + 1
          }
        });
        window.dispatchEvent(event);

        logger.info('Recarga inmediata completada exitosamente', { userId: userIdToRefresh });
      } else {
        throw new Error(`Error HTTP: ${res.status}`);
      }
    } catch (error) {
      logger.error('Error durante recarga inmediata', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [id, preview, forceRefreshKey, setUser]);

  // Efecto para inicializar sistemas de gestión de almacenamiento
  React.useEffect(() => {
    // Inicializar el sistema de gestión de almacenamiento
    photoProfileStorageManager.startMonitoring();

    // Ejecutar optimización automática si es necesario
    const performInitialOptimization = async () => {
      try {
        const optimizationResult = await photoProfileCacheOptimizer.autoOptimizeIfNeeded();
        if (optimizationResult.optimized) {
          logger.info('Optimización automática inicial ejecutada', optimizationResult);
        }
      } catch (error) {
        logger.warn('Error durante optimización automática inicial', error);
      }
    };

    performInitialOptimization();

    // Cleanup al desmontar
    return () => {
      photoProfileStorageManager.stopMonitoring();
    };
  }, []);

  // Efecto mejorado para mantenimiento automático de caché
  React.useEffect(() => {
    // Verificación periódica de mantenimiento usando el sistema avanzado
    const maintenanceInterval = setInterval(async () => {
      try {
        // Obtener recomendaciones del sistema de almacenamiento
        const recommendations = photoProfileStorageManager.getOptimizationRecommendations();

        if (recommendations.recommendations.length > 0) {
          logger.info('Ejecutando mantenimiento automático basado en recomendaciones', recommendations);

          // Ejecutar limpieza automática si se recomienda
          for (const recommendation of recommendations.recommendations) {
            if (recommendation.action === 'automatic_cleanup' || recommendation.action === 'emergency_cleanup') {
              await photoProfileSmartCleanup.executeSmartCleanup({
                targetReductionMB: recommendation.type === 'critical' ? 15 : 5,
                urgency: recommendation.type === 'critical' ? 'critical' : 'normal'
              });
              break; // Ejecutar solo una limpieza por intervalo
            }
          }
        }

        // Ejecutar optimización automática si hay imágenes grandes
        if (Math.random() < 0.1) { // 10% de probabilidad cada intervalo
          await photoProfileCacheOptimizer.autoOptimizeIfNeeded();
        }

      } catch (error) {
        logger.warn('Error durante mantenimiento automático', error);
      }
    }, 10 * 60 * 1000); // Cada 10 minutos

    return () => clearInterval(maintenanceInterval);
  }, []);

  React.useEffect(() => {
    // Si se proporciona fotoPerfil directamente (base64), usarla
    if (fotoPerfil) {
      // Revocar URL anterior si existe para evitar fugas de memoria
      if (preview && preview.startsWith('blob:')) {
        revokeObjectURL(preview);
      }
      setPreview(fotoPerfil);
      return;
    }

    // Si no, hacer petición al servidor con caché mejorada
    async function fetchFoto() {
      if (!id) {
        logger.warn('No se pudo obtener foto: ID de usuario no válido', { id });
        return;
      }

      // Limpiar caché del usuario si la actualización es reciente (últimos 10 segundos)
      // Esto asegura que se obtenga la versión más nueva después de una actualización
      const cacheClearedRecently = Date.now() - lastUpdate < 10000;
      if (cacheClearedRecently) {
        clearUserCache(id);
      }

      // Verificar caché primero (solo si no se limpió recientemente)
      const cachedUrl = !cacheClearedRecently ? getCachedImage(id) : null;
      if (cachedUrl) {
        // Revocar URL anterior si existe
        if (preview && preview.startsWith('blob:')) {
          revokeObjectURL(preview);
        }
        setPreview(cachedUrl);
        logger.info('Foto cargada desde caché', { userId: id });
        return;
      }

      logger.info('Obteniendo foto de perfil del servidor', { userId: id, cacheClearedRecently });

      try {
        const res = await retryFetch(`${API_URL}/api/auth/user/${id}/foto`);
        if (res.ok) {
          const blob = await res.blob();

          logger.info('Foto de perfil obtenida del servidor', {
            userId: id,
            size: blob.size,
            type: blob.type
          });

          // Comprimir imagen antes de crear URL de objeto
          const compressionResult = await photoProfileImageCompressor.compressImage(blob, {
            maxWidth: 300,
            maxHeight: 300,
            quality: 'auto',
            userId: id
          });

          let finalBlob = blob;
          let compressionInfo = null;

          if (compressionResult.success) {
            finalBlob = compressionResult.blob;
            compressionInfo = {
              originalSize: compressionResult.originalSize,
              compressedSize: compressionResult.compressedSize,
              compressionRatio: compressionResult.compressionRatio,
              qualityUsed: compressionResult.qualityUsed
            };

            logger.info('Imagen comprimida después de obtener del servidor', {
              userId: id,
              ...compressionInfo
            });
          }

          const previewUrl = URL.createObjectURL(finalBlob);

          // Revocar URL anterior si existe
          if (preview && preview.startsWith('blob:')) {
            revokeObjectURL(preview);
          }

          setPreview(previewUrl);

          // Usar función mejorada de caché con información de compresión
          await setCachedImage(id, previewUrl, finalBlob);

          logger.info('Foto de perfil procesada y guardada exitosamente', {
            userId: id,
            finalSize: finalBlob.size,
            compressionInfo
          });

        } else {
          logger.error('Error al obtener foto de perfil', { userId: id, status: res.status });
          if (!cachedUrl) {
            setPreview("");
          }
        }
      } catch (error) {
        logger.error('Error de red al obtener foto de perfil', error);
        if (!cachedUrl) {
          setPreview("");
        }
      }
    }
    fetchFoto();
  }, [id, fotoPerfil, lastUpdate]); // Agregar lastUpdate como dependencia

  // Listener para sincronización entre múltiples componentes FotoPerfil
  React.useEffect(() => {
    const handleCacheUpdate = (event) => {
      const { userId, previewUrl, timestamp, forceUpdate } = event.detail;

      // Si es una actualización para este mismo usuario, sincronizar
      if (userId && String(userId) === String(id) && previewUrl) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Sincronizando foto de perfil desde evento de caché', {
            userId,
            hasCurrentPreview: !!preview,
            previewUrl: previewUrl.substring(0, 50) + '...',
            forceUpdate
          });
        }

        // Verificar si realmente necesitamos actualizar
        const needsUpdate = preview !== previewUrl || forceUpdate;

        if (needsUpdate) {
          // Revocar URL anterior para evitar fugas de memoria
          if (preview && preview.startsWith('blob:')) {
            revokeObjectURL(preview);
          }

          setPreview(previewUrl);
          setCachedImage(userId, previewUrl);

          // Si es una actualización forzada, usar el mecanismo más agresivo
          if (forceUpdate) {
            setForceRefreshKey(prev => prev + 1);
            setIsRefreshing(false); // Asegurar que no quede en estado de refreshing
          }

          // Forzar recarga inmediata actualizando el timestamp
          setLastUpdate(Date.now());
        }
      }
    };

    const handleImmediateUpdate = (event) => {
      const { userId, previewUrl, timestamp, source, refreshKey } = event.detail;

      // Si es una actualización inmediata para este usuario, aplicar inmediatamente
      if (userId && String(userId) === String(id) && previewUrl) {
        logger.info('Aplicando actualización inmediata de foto de perfil', {
          userId,
          source,
          refreshKey,
          currentRefreshKey: forceRefreshKey
        });

        // Revocar URL anterior para evitar fugas de memoria
        if (preview && preview.startsWith('blob:')) {
          revokeObjectURL(preview);
        }

        setPreview(previewUrl);
        setCachedImage(userId, previewUrl);

        // Actualizar clave de refresh si se proporciona
        if (refreshKey && refreshKey > forceRefreshKey) {
          setForceRefreshKey(refreshKey);
        }

        setLastUpdate(timestamp);
        setIsRefreshing(false);
      }
    };

    window.addEventListener('fotoPerfilCacheUpdate', handleCacheUpdate);
    window.addEventListener('fotoPerfilImmediateUpdate', handleImmediateUpdate);

    return () => {
      window.removeEventListener('fotoPerfilCacheUpdate', handleCacheUpdate);
      window.removeEventListener('fotoPerfilImmediateUpdate', handleImmediateUpdate);
    };
  }, [id, preview, forceRefreshKey]);

  const handleClick = () => {
    if (editable && inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Si se usa el mecanismo avanzado de subida, delegar al callback
    if (useAdvancedUpload && onPhotoUpload) {
      logger.info('Usando mecanismo avanzado de subida', { userId: id });

      try {
        const result = await onPhotoUpload(file);

        if (result.success) {
          setMsg("Foto de perfil actualizada correctamente.");

          // Usar el nuevo mecanismo de recarga inmediata
          await forceImmediateRefresh(id);

          // Actualizar el estado global del usuario si setUser está disponible
          if (setUser && typeof setUser === 'function') {
            logger.info('Actualizando estado global del usuario');
            setUser(prevUser => ({
              ...prevUser,
              fotoPerfil: preview,
              lastFotoUpdate: Date.now()
            }));
          }

          logger.info('Foto de perfil actualizada completamente con mecanismo avanzado', { userId: id });
        } else {
          setError(result.error || "Error al subir la foto de perfil.");
        }
      } catch (error) {
        logger.error('Error en mecanismo avanzado de subida', error);
        setError("Error al subir la foto de perfil.");
      }

      // Limpiar input
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Código original para compatibilidad hacia atrás
    setMsg("");
    setError("");

    // Validar ID del usuario antes de proceder
    if (!id) {
      setError("ID de usuario no válido. No se puede subir la foto.");
      logger.error('Intento de subida sin ID de usuario válido', { id });
      return;
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo 5MB permitido.");
      logger.error('Archivo demasiado grande', { size: file.size, maxSize });
      return;
    }

    setIsUploading(true);
    logger.info('Iniciando subida de foto de perfil', { userId: id, fileSize: file.size, fileType: file.type });

    try {
      // Comprimir imagen antes de subir al servidor
      logger.info('Comprimiendo imagen antes de subir');
      const compressionResult = await photoProfileImageCompressor.compressImage(file, {
        maxWidth: 800, // Mayor resolución para subida al servidor
        maxHeight: 800,
        quality: 'medium',
        userId: id
      });

      if (!compressionResult.success) {
        throw new Error('Error comprimiendo imagen: ' + (compressionResult.error || 'Compresión fallida'));
      }

      logger.info('Imagen comprimida exitosamente para subida', {
        originalSize: file.size,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio
      });

      // Crear FormData con la imagen comprimida
      const formData = new FormData();
      formData.append("photo", compressionResult.blob, file.name);

      // Obtener CSRF token con reintento
      logger.info('Obteniendo token CSRF');
      const csrfRes = await retryFetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      if (!csrfRes.ok) {
        throw new Error(`Error al obtener token CSRF: ${csrfRes.status}`);
      }
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      // Subir foto con reintento automático
      logger.info('Subiendo foto de perfil comprimida');
      const res = await retryFetch(`${API_URL}/api/auth/profile-photo`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: formData
      }, 3, 1000);

      if (res.ok) {
        setMsg("Foto de perfil actualizada correctamente.");
        logger.info('Foto subida exitosamente, actualizando vista previa');

        // Usar el nuevo mecanismo de recarga inmediata
        await forceImmediateRefresh(id);

        // Actualizar el estado global del usuario si setUser está disponible
        if (setUser && typeof setUser === 'function') {
          logger.info('Actualizando estado global del usuario');
          setUser(prevUser => ({
            ...prevUser,
            fotoPerfil: preview,
            lastFotoUpdate: Date.now()
          }));
        }

        // Función auxiliar para disparar eventos con reintento
        const dispatchFotoUpdateEvent = (attempts = 0) => {
          try {
            const event = new CustomEvent('fotoPerfilActualizada', {
              detail: {
                userId: id,
                previewUrl: preview,
                timestamp: Date.now(),
                source: 'FotoPerfil',
                forceUpdate: true,
                refreshKey: forceRefreshKey,
                compressionInfo: compressionResult
              }
            });
            window.dispatchEvent(event);
            logger.info('Evento fotoPerfilActualizada disparado', { userId: id, attempts });
          } catch (error) {
            logger.error('Error al disparar evento fotoPerfilActualizada', { error, attempts });
            if (attempts < 2) {
              setTimeout(() => dispatchFotoUpdateEvent(attempts + 1), 100);
            }
          }
        };

        dispatchFotoUpdateEvent();

        // También actualizar otros posibles componentes que puedan estar mostrando la misma foto
        setTimeout(() => {
          try {
            // Forzar actualización de otros componentes FotoPerfil que puedan estar en la página
            window.dispatchEvent(new CustomEvent('fotoPerfilCacheUpdate', {
              detail: {
                userId: id,
                previewUrl: preview,
                timestamp: Date.now(),
                forceUpdate: true,
                refreshKey: forceRefreshKey,
                compressionInfo: compressionResult
              }
            }));
          } catch (error) {
            logger.warn('Error al enviar evento de actualización de caché', error);
          }
        }, 100);

        logger.info('Foto de perfil actualizada completamente', {
          userId: id,
          compressionInfo: compressionResult
        });
      } else {
        const errorText = await res.text().catch(() => 'Error desconocido');
        logger.error('Error al subir foto de perfil', { status: res.status, error: errorText });
        setError(`Error al subir la foto de perfil: ${res.status === 413 ? 'Archivo demasiado grande' : 'Error del servidor'}`);
      }
    } catch (error) {
      logger.error('Error de red durante subida de foto', error);
      setError("Error de conexión al subir la foto. Verifica tu conexión a internet.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Funciones auxiliares para gestión avanzada de caché (expuestas para uso externo)
  const getStorageStats = React.useCallback(() => {
    return photoProfileStorageManager.getDetailedStorageStats();
  }, []);

  const getOptimizationRecommendations = React.useCallback(() => {
    return photoProfileStorageManager.getOptimizationRecommendations();
  }, []);

  const forceCacheOptimization = React.useCallback(async (strategy = 'balanced') => {
    try {
      setIsRefreshing(true);
      const result = await photoProfileCacheOptimizer.optimizeEntireCache({ strategy });
      setIsRefreshing(false);
      return result;
    } catch (error) {
      setIsRefreshing(false);
      logger.error('Error durante optimización forzada', error);
      return { success: false, error: error.message };
    }
  }, []);

  const cleanupStorage = React.useCallback(async (targetReductionMB = 5) => {
    try {
      const result = await photoProfileSmartCleanup.executeSmartCleanup({
        targetReductionMB,
        urgency: 'normal'
      });
      return result;
    } catch (error) {
      logger.error('Error durante limpieza manual', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Función para obtener configuración de usuario actual
  const getUserStorageConfig = React.useCallback(() => {
    return PhotoProfileStorageConfig.getCurrentUserConfig(user);
  }, [user]);

  // Función para validar operación antes de ejecutarla
  const validateStorageOperation = React.useCallback((operationType, size = 0) => {
    const userConfig = PhotoProfileStorageConfig.getCurrentUserConfig(user);
    return PhotoProfileStorageConfig.validateOperation(userConfig, operationType, size);
  }, [user]);

  // Función para obtener estadísticas de compresión de imágenes
  const getCompressionStats = React.useCallback(() => {
    return photoProfileImageCompressor.getStorageUsage();
  }, []);

  // Exponer funciones avanzadas en el componente para acceso externo
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.FotoPerfilAdvanced = {
        getStorageStats,
        getOptimizationRecommendations,
        forceCacheOptimization,
        cleanupStorage,
        getCacheStats,
        clearImageCache,
        clearUserCache,
        getUserStorageConfig,
        validateStorageOperation,
        getCompressionStats,
        // Acceso directo a las utilidades para uso avanzado
        imageCompressor: photoProfileImageCompressor,
        storageManager: photoProfileStorageManager,
        smartCleanup: photoProfileSmartCleanup,
        cacheOptimizer: photoProfileCacheOptimizer,
        storageConfig: PhotoProfileStorageConfig
      };
    }
  }, [
    getStorageStats,
    getOptimizationRecommendations,
    forceCacheOptimization,
    cleanupStorage,
    getUserStorageConfig,
    validateStorageOperation,
    getCompressionStats
  ]);

  return (
    <div style={{ textAlign: "left", marginBottom: 0, position: 'relative' }}>
      {/* Indicador de carga durante subida */}
      {isUploading && (
        <div style={{
          position: 'absolute',
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: 'rgba(0, 0, 0, 0.6)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: '#fff',
          zIndex: 10,
          margin: "0 0 12px 0"
        }}>
          <span>⏳</span>
        </div>
      )}

      {/* Indicador de actualización en tiempo real */}
      {isRefreshing && !isUploading && (
        <div style={{
          position: 'absolute',
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: 'rgba(0, 123, 255, 0.2)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: '#007bff',
          zIndex: 9,
          margin: "0 0 12px 0",
          border: '2px solid #007bff',
          animation: 'spin 1s linear infinite'
        }}>
          <span>🔄</span>
        </div>
      )}

      {/* Indicador sutil de actualización reciente */}
      {lastUpdate && (Date.now() - lastUpdate < 3000) && !isUploading && !isRefreshing && (
        <div style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '12px',
          height: '12px',
          borderRadius: "50%",
          background: '#28a745',
          zIndex: 11,
          boxShadow: '0 0 4px rgba(40, 167, 69, 0.6)',
          animation: 'fadeInOut 2s ease-in-out'
        }} />
      )}
      {preview ? (
        <img
          src={preview}
          alt="Foto de perfil"
          style={{
            width: 'clamp(80px, 22vw, 120px)',
            height: 'clamp(80px, 22vw, 120px)',
            objectFit: "cover",
            borderRadius: "50%",
            border: editable ? "3px solid #1976d2" : "2px solid #ccc",
            boxShadow: editable ? "0 0 8px #1976d2" : undefined,
            display: "block",
            margin: "0 0 12px 0",
            cursor: editable && !isUploading ? "pointer" : "default",
            transition: "box-shadow 0.2s, border 0.2s",
            opacity: isUploading ? 0.7 : 1,
            filter: isUploading ? 'grayscale(50%)' : 'none'
          }}
          onClick={editable && !isUploading ? handleClick : undefined}
          title={editable && !isUploading ? "Haz clic para cambiar la foto" : isUploading ? "Subiendo foto..." : undefined}
          onMouseOver={e => {
            if (editable && !isUploading) e.currentTarget.style.boxShadow = "0 0 16px #1976d2";
          }}
          onMouseOut={e => {
            if (editable && !isUploading) e.currentTarget.style.boxShadow = "0 0 8px #1976d2";
          }}
        />
      ) : (
        <div style={{
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: isUploading ? '#b0b0b0' : '#e0e0e0',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          color: isUploading ? '#666' : '#888',
          margin: "0 0 12px 0",
          transition: "background-color 0.2s, color 0.2s"
        }}>
          <span>{isUploading ? '⏳' : '👤'}</span>
        </div>
      )}
      {editable && (
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleChange}
        />
      )}
      {msg && (
        <div style={{
          color: 'green',
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px',
          border: '1px solid #4caf50',
          fontSize: '14px'
        }}>
          ✅ {msg}
        </div>
      )}
      {error && (
        <div style={{
          color: 'red',
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          border: '1px solid #f44336',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}
      {isUploading && (
        <div style={{
          color: '#1976d2',
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          border: '1px solid #1976d2',
          fontSize: '14px'
        }}>
          ⏳ Subiendo foto de perfil...
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .refreshing-overlay {
          animation: spin 1s linear infinite;
        }

        .recent-update-indicator {
          animation: fadeInOut 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default FotoPerfil;
