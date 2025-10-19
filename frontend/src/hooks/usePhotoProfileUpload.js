import { useState, useCallback, useRef } from 'react';
import useAuthUser from './useAuthUser';
import photoProfileService from '../services/PhotoProfileService';
import photoProfileEventManager from '../utils/PhotoProfileEventManager';

/**
 * Hook personalizado para manejar la subida de fotos de perfil
 * Integra completamente con useAuthUser para actualización automática del estado global
 */
export default function usePhotoProfileUpload() {
  const { authUser, refreshAuth } = useAuthUser();
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    previewUrl: null
  });

  const abortControllerRef = useRef(null);

  // Función para limpiar el estado
  const clearState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      previewUrl: null
    });

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Función para actualizar el progreso
  const updateProgress = useCallback((progress) => {
    setUploadState(prev => ({
      ...prev,
      progress: Math.round(progress)
    }));
  }, []);

  // Función principal para subir foto de perfil
  const uploadPhoto = useCallback(async (file) => {
    // Validar parámetros
    if (!file) {
      const error = new Error('Archivo no proporcionado');
      setUploadState(prev => ({
        ...prev,
        error: error.message,
        isUploading: false
      }));
      return { success: false, error: error.message };
    }

    if (!authUser?.id) {
      const error = new Error('Usuario no autenticado');
      setUploadState(prev => ({
        ...prev,
        error: error.message,
        isUploading: false
      }));
      return { success: false, error: error.message };
    }

    // Limpiar estado anterior
    clearState();

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = new Error('El archivo es demasiado grande. Máximo 5MB permitido.');
      setUploadState(prev => ({
        ...prev,
        error: error.message,
        isUploading: false
      }));
      return { success: false, error: error.message };
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      const error = new Error('Solo se permiten archivos de imagen');
      setUploadState(prev => ({
        ...prev,
        error: error.message,
        isUploading: false
      }));
      return { success: false, error: error.message };
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      success: false
    }));

    // Crear AbortController para permitir cancelación
    abortControllerRef.current = new AbortController();

    try {
      console.log('[usePhotoProfileUpload] Iniciando subida de foto de perfil', {
        userId: authUser.id,
        fileSize: file.size,
        fileType: file.type
      });

      // Subir foto usando el servicio avanzado
      const result = await photoProfileService.uploadProfilePhoto(
        authUser.id,
        file,
        {
          timeout: 30000,
          retries: 3,
          onProgress: updateProgress,
          signal: abortControllerRef.current.signal
        }
      );

      if (result.success) {
        console.log('[usePhotoProfileUpload] Foto subida exitosamente');

        // Crear preview temporal de la imagen subida
        const previewUrl = URL.createObjectURL(file);

        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          success: true,
          previewUrl,
          progress: 100
        }));

        // Actualizar el estado global del usuario usando useAuthUser
        try {
          await refreshAuth();
          console.log('[usePhotoProfileUpload] Estado global actualizado');
        } catch (refreshError) {
          console.warn('[usePhotoProfileUpload] Error al actualizar estado global:', refreshError);
          // No es crítico, continuar con el flujo
        }

        // Emitir evento de actualización inmediata para sincronizar otros componentes
        photoProfileEventManager.emitPhotoImmediateUpdate(authUser.id, {
          previewUrl,
          timestamp: Date.now(),
          source: 'usePhotoProfileUpload',
          fileSize: file.size,
          fileType: file.type
        });

        // Limpiar preview después de un tiempo para evitar fugas de memoria
        setTimeout(() => {
          URL.revokeObjectURL(previewUrl);
          setUploadState(prev => ({
            ...prev,
            previewUrl: null
          }));
        }, 5000);

        return {
          success: true,
          message: 'Foto de perfil actualizada correctamente',
          previewUrl,
          timestamp: Date.now()
        };
      } else {
        throw new Error(result.message || 'Error desconocido al subir la foto');
      }

    } catch (error) {
      console.error('[usePhotoProfileUpload] Error durante subida de foto:', error);

      let errorMessage = 'Error de conexión al subir la foto';

      if (error.name === 'AbortError') {
        errorMessage = 'Subida cancelada por el usuario';
      } else if (error.message.includes('413')) {
        errorMessage = 'Archivo demasiado grande para el servidor';
      } else if (error.message.includes('415')) {
        errorMessage = 'Tipo de archivo no soportado';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Tiempo agotado. Verifica tu conexión a internet';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
        success: false,
        progress: 0
      }));

      // Emitir evento de error
      photoProfileEventManager.emitPhotoError(authUser.id, error, {
        source: 'usePhotoProfileUpload',
        fileSize: file.size,
        fileType: file.type
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }, [authUser, refreshAuth, updateProgress, clearState]);

  // Función para cancelar subida en progreso
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: 'Subida cancelada por el usuario',
        progress: 0
      }));

      console.log('[usePhotoProfileUpload] Subida cancelada por el usuario');
    }
  }, []);

  // Función para reintentar subida con el mismo archivo
  const retryUpload = useCallback(async (file) => {
    if (!file) return { success: false, error: 'Archivo no disponible para reintento' };

    clearState();
    return await uploadPhoto(file);
  }, [uploadPhoto, clearState]);

  // Función para obtener estadísticas de uso
  const getStats = useCallback(() => {
    return {
      isUploading: uploadState.isUploading,
      progress: uploadState.progress,
      hasError: !!uploadState.error,
      hasSuccess: uploadState.success,
      canCancel: !!abortControllerRef.current,
      userId: authUser?.id
    };
  }, [uploadState, authUser]);

  return {
    // Estado actual
    ...uploadState,

    // Funciones principales
    uploadPhoto,
    cancelUpload,
    retryUpload,
    clearState,

    // Información adicional
    stats: getStats(),

    // Estado del usuario autenticado
    user: authUser,
    isAuthenticated: !!authUser,

    // Cleanup
    cleanup: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  };
}

export default usePhotoProfileUpload;