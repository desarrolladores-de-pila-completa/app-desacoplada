import React, { useRef, useCallback, useEffect } from 'react';
import FotoPerfil from './FotoPerfil';
import usePhotoProfileUpload from '../hooks/usePhotoProfileUpload';
import photoProfileEventManager from '../utils/PhotoProfileEventManager';

/**
 * Componente wrapper avanzado que integra FotoPerfil con el sistema de subida automático
 * Maneja completamente el flujo: selección → petición → actualización → refresco visual
 */
const PhotoProfileUploadManager = ({
  user,
  setUser,
  editable = true,
  showProgressIndicator = true,
  showSuccessIndicator = true,
  showErrorIndicator = true,
  autoRefreshOnUpdate = true,
  className = '',
  style = {},
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  onUploadProgress,
  ...fotoPerfilProps
}) => {
  const fileInputRef = useRef(null);
  const {
    uploadPhoto,
    cancelUpload,
    retryUpload,
    clearState,
    isUploading,
    progress,
    error,
    success,
    stats,
    user: authUser,
    isAuthenticated
  } = usePhotoProfileUpload();

  // ID del usuario para usar (prioriza el usuario autenticado sobre el prop user)
  const targetUserId = authUser?.id || user?.id;

  // Función para manejar la selección de archivo
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Callback de inicio
    if (onUploadStart) {
      onUploadStart({ file, userId: targetUserId });
    }

    console.log('[PhotoProfileUploadManager] Archivo seleccionado, iniciando subida', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: targetUserId
    });

    // Iniciar subida
    const result = await uploadPhoto(file);

    if (result.success) {
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Actualizar el estado del usuario si setUser está disponible
      if (setUser && result.previewUrl) {
        setUser(prevUser => ({
          ...prevUser,
          fotoPerfil: result.previewUrl,
          lastFotoUpdate: result.timestamp
        }));
      }

      // Auto-refresh si está habilitado
      if (autoRefreshOnUpdate) {
        setTimeout(() => {
          photoProfileEventManager.emitPhotoImmediateUpdate(targetUserId, {
            previewUrl: result.previewUrl,
            timestamp: result.timestamp,
            source: 'PhotoProfileUploadManager-autoRefresh'
          });
        }, 100);
      }
    } else {
      if (onUploadError) {
        onUploadError(result);
      }
    }
  }, [uploadPhoto, targetUserId, onUploadStart, onUploadSuccess, onUploadError, setUser, autoRefreshOnUpdate]);

  // Función para abrir el selector de archivos
  const openFileSelector = useCallback(() => {
    if (fileInputRef.current && editable && !isUploading) {
      fileInputRef.current.click();
    }
  }, [editable, isUploading]);

  // Función para manejar errores de validación del componente FotoPerfil
  const handleFotoPerfilError = useCallback((error) => {
    console.error('[PhotoProfileUploadManager] Error en FotoPerfil:', error);
    if (onUploadError) {
      onUploadError({ error: error.message || error });
    }
  }, [onUploadError]);

  // Función para manejar eventos de progreso
  useEffect(() => {
    if (onUploadProgress && progress > 0) {
      onUploadProgress({ progress, isUploading, stats });
    }
  }, [progress, isUploading, stats, onUploadProgress]);

  // Función para limpiar errores cuando el usuario intenta de nuevo
  const handleRetry = useCallback(() => {
    clearState();
  }, [clearState]);

  // Función para cancelar subida
  const handleCancel = useCallback(() => {
    cancelUpload();
  }, [cancelUpload]);

  // Renderizar indicador de progreso personalizado
  const renderProgressIndicator = () => {
    if (!showProgressIndicator || (!isUploading && !success && !error)) {
      return null;
    }

    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        zIndex: 1000,
        color: 'white',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {isUploading ? (
          <>
            <div style={{ marginBottom: '8px' }}>
              {progress < 100 ? '⏳' : '✅'}
            </div>
            <div style={{ fontSize: '12px' }}>
              {progress}%
            </div>
            {progress > 0 && (
              <div style={{
                width: '60px',
                height: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '4px'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </>
        ) : success ? (
          <>
            <div style={{ color: '#28a745', fontSize: '24px' }}>✅</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>¡Completado!</div>
          </>
        ) : error ? (
          <>
            <div style={{ color: '#dc3545', fontSize: '20px' }}>❌</div>
            <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center', padding: '0 8px' }}>
              Error
            </div>
          </>
        ) : null}
      </div>
    );
  };

  // Renderizar indicador de estado flotante
  const renderStatusIndicator = () => {
    if (!showSuccessIndicator && !showErrorIndicator) return null;

    if (success && showSuccessIndicator) {
      return (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#28a745',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          ✓
        </div>
      );
    }

    if (error && showErrorIndicator) {
      return (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#dc3545',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          cursor: 'pointer'
        }}
        onClick={handleRetry}
        title="Haz clic para reintentar">
          ⚠
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`photo-profile-upload-manager ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      {/* Indicadores de estado */}
      {renderProgressIndicator()}
      {renderStatusIndicator()}

      {/* Componente FotoPerfil mejorado */}
      <div style={{ position: 'relative' }}>
        <FotoPerfil
          {...fotoPerfilProps}
          user={user}
          setUser={setUser}
          editable={editable && isAuthenticated && !isUploading}
          id={targetUserId}
          onClick={openFileSelector}
          onError={handleFotoPerfilError}
          style={{
            cursor: editable && isAuthenticated && !isUploading ? 'pointer' : 'default',
            opacity: isUploading ? 0.8 : 1,
            transition: 'opacity 0.2s ease',
            ...fotoPerfilProps.style
          }}
        />
      </div>

      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Panel de información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (isUploading || error || success) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: '11px',
          borderRadius: '4px',
          zIndex: 1002
        }}>
          <div><strong>Estado:</strong> {isUploading ? 'Subiendo...' : success ? 'Éxito' : 'Error'}</div>
          {isUploading && <div><strong>Progreso:</strong> {progress}%</div>}
          {error && <div><strong>Error:</strong> {error}</div>}
          <div><strong>User ID:</strong> {targetUserId || 'No disponible'}</div>
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .photo-profile-upload-manager:hover .status-indicator {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default PhotoProfileUploadManager;