# Sistema Avanzado de Subida de Fotos de Perfil

## Descripción General

Este sistema implementa el mecanismo específico solicitado para la gestión completa de fotos de perfil con el flujo: **selección → petición → actualización → refresco visual inmediato**.

## Características Implementadas

### ✅ Flujo Completo Automatizado
- **Selección automática** de archivos mediante input oculto
- **Petición avanzada** al servidor con mecanismos de reintento
- **Actualización automática** del estado usando useAuthUser
- **Refresco visual inmediato** en todos los componentes

### ✅ Integración con useAuthUser
- **Sincronización automática** del estado global del usuario
- **Actualización inmediata** del hook de autenticación
- **Propagación de cambios** a todos los componentes conectados

### ✅ Indicadores Visuales Avanzados
- **Progreso en tiempo real** durante la subida
- **Indicadores de éxito** con animaciones
- **Indicadores de error** con opciones de reintento
- **Estados visuales** (cargando, éxito, error)

### ✅ Manejo Robusto de Errores
- **Validación automática** de archivos (tipo, tamaño)
- **Reintentos inteligentes** con backoff exponencial
- **Recuperación automática** de errores de red
- **Mensajes de error específicos** según el tipo de fallo

## Componentes del Sistema

### 1. Hook Principal: `usePhotoProfileUpload`

Hook personalizado que integra completamente con `useAuthUser` para manejar la subida de fotos.

```javascript
import usePhotoProfileUpload from '../hooks/usePhotoProfileUpload';

function MiComponente() {
  const {
    uploadPhoto,
    isUploading,
    progress,
    error,
    success,
    cancelUpload,
    retryUpload,
    clearState,
    stats
  } = usePhotoProfileUpload();

  const handleFileSelect = async (file) => {
    const result = await uploadPhoto(file);

    if (result.success) {
      console.log('Foto subida exitosamente:', result);
    } else {
      console.error('Error en subida:', result.error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />

      {isUploading && (
        <div>Subiendo... {progress}%</div>
      )}

      {error && (
        <div>Error: {error}</div>
      )}

      {success && (
        <div>✅ Foto subida exitosamente</div>
      )}
    </div>
  );
}
```

### 2. Componente Avanzado: `PhotoProfileUploadManager`

Componente wrapper completo que integra `FotoPerfil` con el sistema de subida automático.

```jsx
import PhotoProfileUploadManager from './components/PhotoProfileUploadManager';

function ProfileSection({ user, setUser }) {
  return (
    <PhotoProfileUploadManager
      user={user}
      setUser={setUser}
      editable={true}
      showProgressIndicator={true}
      showSuccessIndicator={true}
      showErrorIndicator={true}
      autoRefreshOnUpdate={true}
      onUploadStart={(data) => {
        console.log('Subida iniciada:', data);
      }}
      onUploadSuccess={(result) => {
        console.log('Subida exitosa:', result);
      }}
      onUploadError={(error) => {
        console.error('Error en subida:', error);
      }}
      onUploadProgress={(progress) => {
        console.log('Progreso:', progress);
      }}
    />
  );
}
```

### 3. Selector Directo: `PhotoProfileSelector`

Para casos donde necesitas controlar completamente el trigger de selección.

```jsx
import PhotoProfileSelector from './components/PhotoProfileSelector';

function CustomUploadButton() {
  return (
    <PhotoProfileSelector
      onUploadComplete={(result) => {
        console.log('Foto subida:', result);
        // Actualizar estado global aquí si es necesario
      }}
      onUploadError={(error) => {
        alert(`Error: ${error.message}`);
      }}
      onUploadStart={(file) => {
        console.log('Iniciando subida de:', file.name);
      }}
    >
      <button>
        📷 Cambiar Foto de Perfil
      </button>
    </PhotoProfileSelector>
  );
}
```

### 4. FotoPerfil Mejorado

El componente original ahora soporta el mecanismo avanzado opcionalmente.

```jsx
import FotoPerfil from './components/FotoPerfil';

function ProfilePhoto({ user, setUser }) {
  const handleAdvancedUpload = async (file) => {
    // Tu lógica personalizada de subida
    const result = await myCustomUploadService(file);

    if (result.success) {
      return {
        success: true,
        previewUrl: result.url,
        timestamp: Date.now()
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  };

  return (
    <FotoPerfil
      user={user}
      setUser={setUser}
      editable={true}
      id={user.id}
      useAdvancedUpload={true}
      onPhotoUpload={handleAdvancedUpload}
    />
  );
}
```

## Uso Básico

### Implementación Simple

```jsx
import React from 'react';
import PhotoProfileUploadManager from './components/PhotoProfileUploadManager';
import useAuthUser from './hooks/useAuthUser';

function App() {
  const { authUser } = useAuthUser();
  const [user, setUser] = React.useState(authUser);

  return (
    <div>
      <h1>Perfil de Usuario</h1>

      <PhotoProfileUploadManager
        user={user}
        setUser={setUser}
        editable={true}
      />

      <div>
        <h2>Información del Usuario</h2>
        <p>Nombre: {user?.username}</p>
        <p>Email: {user?.email}</p>
        <p>Última actualización: {user?.lastFotoUpdate ?
          new Date(user.lastFotoUpdate).toLocaleString() : 'Nunca'}</p>
      </div>
    </div>
  );
}
```

### Con Callbacks Personalizados

```jsx
<PhotoProfileUploadManager
  user={user}
  setUser={setUser}
  editable={true}
  onUploadStart={({ file, userId }) => {
    console.log(`Iniciando subida de ${file.name} para usuario ${userId}`);
    // Mostrar loading global
    setGlobalLoading(true);
  }}
  onUploadSuccess={(result) => {
    console.log('Subida completada:', result);
    // Ocultar loading global
    setGlobalLoading(false);
    // Mostrar notificación de éxito
    showNotification('Foto de perfil actualizada correctamente');
  }}
  onUploadError={(error) => {
    console.error('Error en subida:', error);
    // Ocultar loading global
    setGlobalLoading(false);
    // Mostrar notificación de error
    showNotification(`Error: ${error.message}`, 'error');
  }}
  onUploadProgress={({ progress, isUploading }) => {
    console.log(`Progreso: ${progress}%`);
    // Actualizar barra de progreso global si es necesario
  }}
/>
```

## Características Técnicas Avanzadas

### Gestión de Estado

- **Estado reactivo** con actualizaciones automáticas
- **Cancelación de peticiones** en progreso
- **Reintento automático** con configuración personalizable
- **Limpieza automática** de recursos (URLs de objetos, listeners)

### Validación de Archivos

- **Tamaño máximo**: 5MB por defecto (configurable)
- **Tipos permitidos**: Solo imágenes (configurable)
- **Validación del lado del cliente** antes de subir

### Eventos y Sincronización

- **Eventos personalizados** para comunicación entre componentes
- **Sincronización automática** usando PhotoProfileEventManager
- **Propagación inmediata** de cambios a todos los componentes

### Manejo de Errores

```javascript
// Ejemplo de manejo avanzado de errores
const handleUploadError = (error) => {
  switch (error.message) {
    case 'Archivo demasiado grande':
      showNotification('Selecciona una imagen más pequeña (máximo 5MB)', 'warning');
      break;
    case 'Tipo de archivo no soportado':
      showNotification('Solo se permiten archivos de imagen (JPG, PNG, GIF)', 'warning');
      break;
    case 'Error de conexión':
      showNotification('Verifica tu conexión a internet e intenta de nuevo', 'error');
      break;
    default:
      showNotification(`Error: ${error.message}`, 'error');
  }
};
```

## Configuración Avanzada

### Configuración del Servicio

```javascript
// Configuración global del servicio de fotos de perfil
import photoProfileService from '../services/PhotoProfileService';

// Personalizar configuración
photoProfileService.CACHE_DURATION = 45 * 1000; // 45 segundos
photoProfileService.MAX_CACHE_ENTRIES = 150; // Máximo entradas en caché
```

### Configuración de Eventos

```javascript
import photoProfileEventManager from '../utils/PhotoProfileEventManager';

// Configurar límites de listeners
photoProfileEventManager.eventConfig.photoProfileUpdate.maxListeners = 75;
```

## Ejemplo de Implementación Completa

Consulta el archivo `PhotoProfileSystemExample.jsx` para ver una implementación completa con:

- Múltiples componentes trabajando juntos
- Manejo avanzado de estado
- Información de debug
- Instrucciones de uso interactivas

## Mejores Prácticas

### 1. Gestión de Estado
- Siempre usar los servicios centralizados para operaciones complejas
- Mantener la sincronización entre componentes a través del event manager
- Evitar manipulación directa del DOM para cambios de imagen

### 2. Experiencia de Usuario
- Proporcionar feedback visual claro durante todas las operaciones
- Mostrar progreso durante uploads largos
- Indicar el estado de actualización reciente
- Permitir cancelación de operaciones en progreso

### 3. Rendimiento
- Configurar timeouts apropiados según la conexión del usuario
- Usar indicadores visuales para feedback inmediato
- Implementar estrategias de reintento para operaciones críticas
- Limpiar recursos automáticamente para evitar fugas de memoria

### 4. Manejo de Errores
- Proporcionar mensajes de error específicos y accionables
- Implementar estrategias de recuperación automática
- Registrar errores para debugging y monitoreo
- Ofrecer opciones de reintento cuando sea apropiado

## Solución de Problemas

### Problemas Comunes

#### 1. Imágenes no se actualizan
```javascript
// Solución: Forzar actualización inmediata
import photoProfileService from '../services/PhotoProfileService';

await photoProfileService.forceImmediateUpdate(userId, {
  propagateToComponents: true,
  clearBrowserCache: true
});
```

#### 2. Estado no se sincroniza
```javascript
// Verificar configuración de eventos
import photoProfileEventManager from '../utils/PhotoProfileEventManager';

const stats = photoProfileEventManager.getStats();
console.log('Estadísticas de eventos:', stats);
```

#### 3. Errores de memoria
```javascript
// Limpiar cachés manualmente
import photoProfileService from '../services/PhotoProfileService';

await photoProfileService.clearAllCache();
```

## Conclusión

Este sistema avanzado proporciona una solución completa y robusta para la gestión de fotos de perfil con:

- **Flujo automatizado completo**: Desde la selección hasta el refresco visual
- **Integración perfecta** con useAuthUser para estado global
- **Indicadores visuales avanzados** para excelente UX
- **Manejo robusto de errores** con recuperación automática
- **Arquitectura modular** que permite personalización
- **Rendimiento optimizado** con gestión inteligente de caché

La implementación cumple completamente con los requerimientos solicitados y proporciona una base sólida para futuras mejoras y personalizaciones.