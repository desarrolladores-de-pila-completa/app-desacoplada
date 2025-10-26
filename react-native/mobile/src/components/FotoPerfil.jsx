import * as React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "http://192.168.1.135:3000";

// Función auxiliar para logging mejorado
const logger = {
  info: (message, data) => {
    console.log(`[FotoPerfilRN] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[FotoPerfilRN] ${message}`, error);
  },
  warn: (message, data) => {
    console.warn(`[FotoPerfilRN] ${message}`, data || '');
  }
};

// Función auxiliar para gestión de caché mejorada
const CACHE_KEY = 'fotoPerfil_cache_rn';
const CACHE_DURATION = 30 * 1000; // 30 segundos para actualización más rápida

const getCachedImage = async (userId) => {
  try {
    const cache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info('Usando imagen desde caché', { userId, age: Date.now() - cached.timestamp });
      return cached.url;
    } else if (cached) {
      logger.info('Caché expirado, eliminando entrada', { userId, age: Date.now() - cached.timestamp });
      delete cache[userId];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    logger.warn('Error al leer caché', error);
  }
  return null;
};

const setCachedImage = async (userId, url) => {
  try {
    const cache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');

    // Limpiar entradas antiguas si excede el límite (máximo 50 entradas)
    const entries = Object.keys(cache);
    if (entries.length >= 50) {
      const sortedEntries = entries.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      const toRemove = sortedEntries.slice(0, entries.length - 45); // Mantener solo las 45 más recientes
      toRemove.forEach(key => delete cache[key]);
      logger.info('Caché limpiado, entradas eliminadas:', toRemove.length);
    }

    cache[userId] = {
      url,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    logger.info('Imagen guardada en caché', { userId, totalEntries: Object.keys(cache).length });
  } catch (error) {
    logger.warn('Error al guardar en caché', error);
  }
};

const clearUserCache = async (userId) => {
  try {
    const cache = JSON.parse(await AsyncStorage.getItem(CACHE_KEY) || '{}');
    if (cache[userId]) {
      delete cache[userId];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      logger.info('Caché del usuario limpiado', { userId });
    }
  } catch (error) {
    logger.warn('Error al limpiar caché del usuario', error);
  }
};

const FotoPerfil = ({ userId, editable = false, onUpdate, style }) => {
  const [preview, setPreview] = React.useState("");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  const [forceRefreshKey, setForceRefreshKey] = React.useState(0);

  // Función avanzada para forzar recarga inmediata
  const forceImmediateRefresh = React.useCallback(async (targetUserId) => {
    const userIdToRefresh = targetUserId || userId;
    if (!userIdToRefresh) return;

    logger.info('Iniciando recarga inmediata forzada', { userId: userIdToRefresh });

    setIsRefreshing(true);

    try {
      // 1. Limpiar caché completamente para este usuario
      await clearUserCache(userIdToRefresh);

      // 2. Agregar timestamp único para evitar cualquier caché
      const timestamp = Date.now();
      const refreshUrl = `${API_URL}/api/auth/user/${userIdToRefresh}/foto?_t=${timestamp}&_refresh=${forceRefreshKey}`;

      const response = await fetch(refreshUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const previewUrl = URL.createObjectURL(blob);

        setPreview(previewUrl);
        await setCachedImage(userIdToRefresh, previewUrl);

        // Actualizar clave de refresh para futuras recargas
        setForceRefreshKey(prev => prev + 1);

        // Notificar actualización
        if (onUpdate) {
          onUpdate({
            userId: userIdToRefresh,
            previewUrl,
            timestamp,
            refreshKey: forceRefreshKey + 1
          });
        }

        // Emitir evento para otros componentes
        DeviceEventEmitter.emit('fotoPerfilImmediateUpdate', {
          userId: userIdToRefresh,
          previewUrl,
          timestamp,
          source: 'FotoPerfilRN-forceRefresh',
          forceUpdate: true,
          refreshKey: forceRefreshKey + 1
        });

        logger.info('Recarga inmediata completada exitosamente', { userId: userIdToRefresh });
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (error) {
      logger.error('Error durante recarga inmediata', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, forceRefreshKey, onUpdate]);

  // Efecto para cargar la imagen inicial
  React.useEffect(() => {
    const fetchFoto = async () => {
      if (!userId) {
        logger.warn('No se pudo obtener foto: ID de usuario no válido', { userId });
        return;
      }

      // Verificar caché primero
      const cachedUrl = await getCachedImage(userId);
      if (cachedUrl) {
        setPreview(cachedUrl);
        logger.info('Foto cargada desde caché', { userId });
        return;
      }

      logger.info('Obteniendo foto de perfil del servidor', { userId });

      try {
        const response = await fetch(`${API_URL}/api/auth/user/${userId}/foto`);
        if (response.ok) {
          const blob = await response.blob();
          const previewUrl = URL.createObjectURL(blob);

          setPreview(previewUrl);
          await setCachedImage(userId, previewUrl);
          logger.info('Foto de perfil obtenida exitosamente', { userId, size: blob.size });
        } else {
          logger.error('Error al obtener foto de perfil', { userId, status: response.status });
        }
      } catch (error) {
        logger.error('Error de red al obtener foto de perfil', error);
      }
    };

    fetchFoto();
  }, [userId, lastUpdate]);

  // Listener para sincronización entre componentes
  React.useEffect(() => {
    const handleImmediateUpdate = async (event) => {
      const { userId: eventUserId, previewUrl, timestamp, source, refreshKey } = event;

      // Si es una actualización inmediata para este usuario, aplicar inmediatamente
      if (eventUserId && String(eventUserId) === String(userId) && previewUrl) {
        logger.info('Aplicando actualización inmediata de foto de perfil', {
          userId,
          source,
          refreshKey,
          currentRefreshKey: forceRefreshKey
        });

        setPreview(previewUrl);
        await setCachedImage(userId, previewUrl);

        // Actualizar clave de refresh si se proporciona
        if (refreshKey && refreshKey > forceRefreshKey) {
          setForceRefreshKey(refreshKey);
        }

        setLastUpdate(timestamp);
        setIsRefreshing(false);
      }
    };

    const subscription = DeviceEventEmitter.addListener('fotoPerfilImmediateUpdate', handleImmediateUpdate);

    return () => {
      subscription.remove();
    };
  }, [userId, forceRefreshKey]);

  const handleRefresh = () => {
    if (editable) {
      forceImmediateRefresh();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={handleRefresh}
        disabled={!editable || isRefreshing}
        style={styles.touchable}
      >
        {preview ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: preview }}
              style={[
                styles.foto,
                isRefreshing && styles.refreshing,
                editable && styles.editable
              ]}
            />

            {/* Indicador de actualización en tiempo real */}
            {isRefreshing && (
              <View style={styles.refreshingOverlay}>
                <Text style={styles.refreshingText}>🔄</Text>
              </View>
            )}

            {/* Indicador sutil de actualización reciente */}
            {lastUpdate && (Date.now() - lastUpdate < 3000) && !isRefreshing && (
              <View style={styles.recentUpdateIndicator} />
            )}
          </View>
        ) : (
          <View style={[styles.foto, styles.placeholder, isRefreshing && styles.refreshing]}>
            <Text style={styles.placeholderText}>
              {isRefreshing ? '🔄' : '👤'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  container: {
    padding: 16,
  },
  touchable: {
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
  },
  editable: {
    borderWidth: 3,
    borderColor: '#1976d2',
  },
  refreshing: {
    opacity: 0.7,
  },
  refreshingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  refreshingText: {
    fontSize: 24,
    color: '#007bff',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 32,
    color: '#888',
  },
  recentUpdateIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745',
    zIndex: 2,
  },
});

export default FotoPerfil;
