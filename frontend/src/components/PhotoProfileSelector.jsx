import React, { useRef, useCallback } from 'react';
import usePhotoProfileUpload from '../hooks/usePhotoProfileUpload';

/**
 * Componente simplificado para selección y subida inmediata de fotos de perfil
 * Implementa el flujo completo solicitado: selección → petición → actualización → refresco visual
 */
const PhotoProfileSelector = ({
  children,
  onUploadComplete,
  onUploadError,
  onUploadStart,
  disabled = false,
  className = '',
  style = {},
  acceptedFileTypes = 'image/*',
  maxFileSize = 5 * 1024 * 1024, // 5MB
  showPreview = true,
  autoClose = false
}) => {
  const fileInputRef = useRef(null);
  const {
    uploadPhoto,
    isUploading,
    progress,
    error,
    success,
    clearState,
    stats
  } = usePhotoProfileUpload();

  // Función para abrir el selector de archivos
  const openFileSelector = useCallback(() => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.click();
    }
  }, [disabled, isUploading]);

  // Función para manejar la selección de archivo
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Limpiar el input
    event.target.value = '';

    // Validar tamaño del archivo
    if (file.size > maxFileSize) {
      const errorMsg = `El archivo es demasiado grande. Máximo ${Math.round(maxFileSize / 1024 / 1024)}MB permitido.`;
      if (onUploadError) {
        onUploadError(new Error(errorMsg));
      }
      return;
    }

    // Callback de inicio
    if (onUploadStart) {
      onUploadStart(file);
    }

    console.log('[PhotoProfileSelector] Iniciando subida directa', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Subir archivo directamente
    const result = await uploadPhoto(file);

    if (result.success) {
      console.log('[PhotoProfileSelector] Subida completada exitosamente');

      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Auto-cerrar si está habilitado
      if (autoClose) {
        setTimeout(() => {
          clearState();
        }, 2000);
      }
    } else {
      console.error('[PhotoProfileSelector] Error en subida:', result.error);

      if (onUploadError) {
        onUploadError(new Error(result.error));
      }
    }
  }, [uploadPhoto, maxFileSize, onUploadStart, onUploadComplete, onUploadError, autoClose, clearState]);

  // Clonar children y añadir props necesarios
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onClick: openFileSelector,
        disabled: disabled || isUploading,
        'data-uploading': isUploading,
        'data-progress': progress,
        'data-error': !!error,
        'data-success': success,
        style: {
          ...child.props.style,
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          opacity: isUploading ? 0.7 : 1,
          ...style
        }
      });
    }
    return child;
  });

  return (
    <div className={`photo-profile-selector ${className}`}>
      {/* Trigger element (children) */}
      <div onClick={openFileSelector}>
        {enhancedChildren}
      </div>

      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {/* Indicador flotante de progreso */}
      {isUploading && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: '200px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⏳</span>
            <span>Subiendo foto de perfil...</span>
          </div>
          <div style={{
            marginTop: '8px',
            width: '100%',
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'rgba(255,255,255,0.8)',
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            {progress}% completado
          </div>
        </div>
      )}

      {/* Indicador flotante de éxito */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          animation: 'slideInFromRight 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span>
            <span>Foto de perfil actualizada</span>
          </div>
        </div>
      )}

      {/* Indicador flotante de error */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
        onClick={clearState}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❌</span>
            <span>Error al subir foto</span>
          </div>
          <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.9 }}>
            Haz clic para cerrar
          </div>
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .photo-profile-selector {
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default PhotoProfileSelector;