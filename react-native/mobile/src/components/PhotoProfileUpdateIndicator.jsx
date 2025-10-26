// Componente avanzado para indicadores visuales de actualización de foto de perfil (React Native)
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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

  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  const fadeAnimation = React.useRef(new Animated.Value(0)).current;

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

  // Animación de pulso para actualizaciones activas
  React.useEffect(() => {
    if (updateStatus.isUpdating) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 750,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();

      // Animación de aparición
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();

      return () => {
        pulseLoop.stop();
      };
    } else {
      // Animación de desaparición
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [updateStatus.isUpdating, pulseAnimation, fadeAnimation]);

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

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyles[position],
        {
          padding: config.padding,
          backgroundColor: indicator.bgColor,
          borderColor: indicator.color,
          fontSize: config.fontSize,
          opacity: fadeAnimation,
          transform: [{ scale: pulseAnimation }]
        },
        style
      ]}
    >
      {/* Icono de estado */}
      <Text style={[
        styles.icon,
        {
          fontSize: config.indicatorSize,
          color: indicator.color
        }
      ]}>
        {indicator.icon}
      </Text>

      {/* Texto de estado */}
      {(showProgress || showTimestamp) && (
        <Text style={[
          styles.text,
          {
            fontSize: config.fontSize,
            color: indicator.color,
            minWidth: showProgress ? 35 : 'auto'
          }
        ]}>
          {indicator.text}
        </Text>
      )}

      {/* Indicador de progreso circular para uploads */}
      {showProgress && updateStatus.isUpdating && updateStatus.progress > 0 && (
        <View style={[
          styles.progressContainer,
          {
            width: config.indicatorSize,
            height: config.indicatorSize
          }
        ]}>
          <View style={[
            styles.progressCircle,
            {
              borderColor: indicator.color,
              borderWidth: 1,
              opacity: 0.3
            }
          ]} />
          <View style={[
            styles.progressArc,
            {
              borderTopColor: indicator.color,
              borderRightColor: indicator.color,
              transform: [{ rotate: `${(updateStatus.progress / 100) * 360}deg` }]
            }
          ]} />
        </View>
      )}
    </Animated.View>
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
    <View style={styles.wrapper}>
      {children}
      <PhotoProfileUpdateIndicator
        userId={userId}
        {...indicatorProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative'
  },
  container: {
    position: 'absolute',
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  icon: {
    lineHeight: 16
  },
  text: {
    fontWeight: '500'
  },
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100
  },
  progressArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2
  }
});

export default PhotoProfileUpdateIndicator;