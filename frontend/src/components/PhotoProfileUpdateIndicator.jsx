// Componente avanzado para indicadores visuales de actualización de foto de perfil
import React from 'react';
import photoProfileEventManager from '../utils/PhotoProfileEventManager';

const PhotoProfileUpdateIndicator = ({
  userId,
  position = 'top-right',
  size = 'medium',
  showProgress = true,
  showTimestamp = true,
  style = {}
}) => {
  const [updateStatus, setUpdateStatus] = React.useState({
    isUpdating: false,
    lastUpdate: null,
    progress: 0,
    error: null,
    updateType: null
  });

  // Configuración de estilos basada en el tamaño
  const sizeConfig = {
    small: {
      indicatorSize: 8,
      fontSize: 10,
      padding: 4
    },
    medium: {
      indicatorSize: 12,
      fontSize: 12,
      padding: 6
    },
    large: {
      indicatorSize: 16,
      fontSize: 14,
      padding: 8
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Configuración de posición
  const positionStyles = {
    'top-right': {
      top: 2,
      right: 2
    },
    'top-left': {
      top: 2,
      left: 2
    },
    'bottom-right': {
      bottom: 2,
      right: 2
    },
    'bottom-left': {
      bottom: 2,
      left: 2
    },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  };

  // Manejar eventos de actualización
  React.useEffect(() => {
    const handleUpdate = (eventData) => {
      if (eventData.userId === userId) {
        setUpdateStatus(prev => ({
          ...prev,
          isUpdating: eventData.action === 'immediateUpdate' || eventData.action === 'upload',
          lastUpdate: eventData.timestamp,
          updateType: eventData.action,
          error: null
        }));
      }
    };

    const handleProgress = (eventData) => {
      if (eventData.userId === userId) {
        setUpdateStatus(prev => ({
          ...prev,
          progress: eventData.progress,
          isUpdating: true
        }));
      }
    };

    const handleError = (eventData) => {
      if (eventData.userId === userId) {
        setUpdateStatus(prev => ({
          ...prev,
          isUpdating: false,
          error: eventData.error,
          lastUpdate: Date.now()
        }));
      }
    };

    // Suscribirse a eventos
    const unsubscribeUpdate = photoProfileEventManager.on('photoProfileUpdate', handleUpdate);
    const unsubscribeImmediate = photoProfileEventManager.on('photoProfileImmediateUpdate', handleUpdate);
    const unsubscribeProgress = photoProfileEventManager.on('photoProfileUploadProgress', handleProgress);
    const unsubscribeError = photoProfileEventManager.on('photoProfileError', handleError);

    return () => {
      unsubscribeUpdate();
      unsubscribeImmediate();
      unsubscribeProgress();
      unsubscribeError();
    };
  }, [userId]);

  // No renderizar nada si no hay actividad reciente
  if (!updateStatus.isUpdating && !updateStatus.lastUpdate && !updateStatus.error) {
    return null;
  }

  // Calcular tiempo transcurrido desde la última actualización
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Determinar el tipo de indicador basado en el estado
  const getIndicatorContent = () => {
    if (updateStatus.error) {
      return {
        icon: '❌',
        color: '#dc3545',
        bgColor: 'rgba(220, 53, 69, 0.2)',
        text: 'Error'
      };
    }

    if (updateStatus.isUpdating) {
      if (showProgress && updateStatus.progress > 0) {
        return {
          icon: '⏳',
          color: '#ffc107',
          bgColor: 'rgba(255, 193, 7, 0.2)',
          text: `${updateStatus.progress}%`
        };
      }

      return {
        icon: '🔄',
        color: '#007bff',
        bgColor: 'rgba(0, 123, 255, 0.2)',
        text: 'Actualizando...'
      };
    }

    if (updateStatus.lastUpdate) {
      const timeAgo = getTimeAgo(updateStatus.lastUpdate);
      return {
        icon: '✅',
        color: '#28a745',
        bgColor: 'rgba(40, 167, 69, 0.2)',
        text: timeAgo
      };
    }

    return {
      icon: '📷',
      color: '#6c757d',
      bgColor: 'rgba(108, 117, 125, 0.2)',
      text: 'Listo'
    };
  };

  const indicator = getIndicatorContent();

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: `${config.padding}px`,
        padding: `${config.padding}px`,
        backgroundColor: indicator.bgColor,
        borderRadius: `${config.indicatorSize}px`,
        border: `1px solid ${indicator.color}`,
        fontSize: `${config.fontSize}px`,
        color: indicator.color,
        fontWeight: '500',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        animation: updateStatus.isUpdating ? 'pulse 1.5s ease-in-out infinite' : 'fadeIn 0.3s ease-in-out',
        pointerEvents: 'none',
        ...style
      }}
    >
      {/* Icono de estado */}
      <span style={{
        fontSize: `${config.indicatorSize}px`,
        lineHeight: 1
      }}>
        {indicator.icon}
      </span>

      {/* Texto de estado */}
      {(showProgress || showTimestamp) && (
        <span style={{
          whiteSpace: 'nowrap',
          minWidth: showProgress ? '35px' : 'auto',
          textAlign: 'center'
        }}>
          {indicator.text}
        </span>
      )}

      {/* Indicador de progreso circular para uploads */}
      {showProgress && updateStatus.isUpdating && updateStatus.progress > 0 && (
        <div style={{
          position: 'relative',
          width: `${config.indicatorSize}px`,
          height: `${config.indicatorSize}px`
        }}>
          <svg
            width={config.indicatorSize}
            height={config.indicatorSize}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Círculo de fondo */}
            <circle
              cx={config.indicatorSize / 2}
              cy={config.indicatorSize / 2}
              r={(config.indicatorSize - 2) / 2}
              fill="none"
              stroke={indicator.color}
              strokeWidth="1"
              opacity="0.3"
            />
            {/* Círculo de progreso */}
            <circle
              cx={config.indicatorSize / 2}
              cy={config.indicatorSize / 2}
              r={(config.indicatorSize - 2) / 2}
              fill="none"
              stroke={indicator.color}
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * ((config.indicatorSize - 2) / 2)}`}
              strokeDashoffset={`${2 * Math.PI * ((config.indicatorSize - 2) / 2) * (1 - updateStatus.progress / 100)}`}
              style={{
                transition: 'stroke-dashoffset 0.3s ease-in-out'
              }}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Componente wrapper que incluye el indicador con la imagen
export const PhotoProfileWithIndicator = ({
  userId,
  indicatorProps = {},
  children,
  ...photoProps
}) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <PhotoProfileUpdateIndicator
        userId={userId}
        {...indicatorProps}
      />
    </div>
  );
};

export default PhotoProfileUpdateIndicator;