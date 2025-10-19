import React, { useState } from 'react';
import FotoPerfil from './FotoPerfil';
import PhotoProfileUploadManager from './PhotoProfileUploadManager';
import PhotoProfileSelector from './PhotoProfileSelector';
import useAuthUser from '../hooks/useAuthUser';

/**
 * Ejemplo completo de implementación del sistema avanzado de fotos de perfil
 * Demuestra el flujo completo: selección → petición → actualización → refresco visual
 */
const PhotoProfileSystemExample = () => {
  const { authUser, isAuthenticated } = useAuthUser();
  const [currentUser, setCurrentUser] = useState(authUser);
  const [systemStatus, setSystemStatus] = useState('ready');

  // Función para manejar la subida usando el componente avanzado
  const handleAdvancedUpload = async (file) => {
    setSystemStatus('uploading');

    try {
      // Aquí podrías usar el hook usePhotoProfileUpload directamente
      // o cualquier lógica personalizada de subida

      console.log('Procesando archivo con sistema avanzado:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular éxito
      const previewUrl = URL.createObjectURL(file);

      return {
        success: true,
        message: 'Foto subida exitosamente con sistema avanzado',
        previewUrl,
        timestamp: Date.now(),
        fileSize: file.size,
        fileType: file.type
      };
    } catch (error) {
      console.error('Error en subida avanzada:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido en subida avanzada'
      };
    } finally {
      setSystemStatus('ready');
    }
  };

  // Función para manejar eventos del componente UploadManager
  const handleUploadManagerEvents = {
    onUploadStart: (data) => {
      console.log('[Ejemplo] Subida iniciada:', data);
      setSystemStatus('uploading');
    },

    onUploadSuccess: (result) => {
      console.log('[Ejemplo] Subida exitosa:', result);
      setSystemStatus('success');

      // Actualizar estado del usuario
      if (result.previewUrl) {
        setCurrentUser(prev => ({
          ...prev,
          fotoPerfil: result.previewUrl,
          lastFotoUpdate: result.timestamp
        }));
      }
    },

    onUploadError: (error) => {
      console.error('[Ejemplo] Error en subida:', error);
      setSystemStatus('error');
    },

    onUploadProgress: (progress) => {
      console.log('[Ejemplo] Progreso de subida:', progress);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Sistema Avanzado de Fotos de Perfil</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Ejemplo completo del flujo: selección → petición → actualización → refresco visual
      </p>

      {/* Estado del sistema */}
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: systemStatus === 'uploading' ? '#e3f2fd' :
                        systemStatus === 'success' ? '#e8f5e8' :
                        systemStatus === 'error' ? '#ffebee' : '#f5f5f5',
        border: `1px solid ${systemStatus === 'uploading' ? '#2196f3' :
                           systemStatus === 'success' ? '#4caf50' :
                           systemStatus === 'error' ? '#f44336' : '#ddd'}`,
        borderRadius: '4px'
      }}>
        <strong>Estado del Sistema:</strong> {systemStatus === 'uploading' ? '⏳ Subiendo...' :
                                           systemStatus === 'success' ? '✅ Éxito' :
                                           systemStatus === 'error' ? '❌ Error' : '✅ Listo'}
      </div>

      {/* Ejemplo 1: Uso básico con componente avanzado */}
      <section style={{ marginBottom: '40px' }}>
        <h2>1. Componente Avanzado (PhotoProfileUploadManager)</h2>
        <p>Componente completo con indicadores visuales y gestión automática del estado.</p>

        <PhotoProfileUploadManager
          user={currentUser}
          setUser={setCurrentUser}
          editable={isAuthenticated}
          showProgressIndicator={true}
          showSuccessIndicator={true}
          showErrorIndicator={true}
          autoRefreshOnUpdate={true}
          {...handleUploadManagerEvents}
          style={{
            filter: systemStatus === 'uploading' ? 'grayscale(50%)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        />
      </section>

      {/* Ejemplo 2: Uso con selector directo */}
      <section style={{ marginBottom: '40px' }}>
        <h2>2. Selector Directo (PhotoProfileSelector)</h2>
        <p>Para casos donde necesitas controlar completamente el trigger de selección.</p>

        <PhotoProfileSelector
          onUploadComplete={(result) => {
            console.log('Foto subida exitosamente:', result);
            setCurrentUser(prev => ({
              ...prev,
              fotoPerfil: result.previewUrl,
              lastFotoUpdate: result.timestamp
            }));
          }}
          onUploadError={(error) => {
            console.error('Error en subida:', error);
            alert(`Error: ${error.message}`);
          }}
          onUploadStart={(file) => {
            console.log('Iniciando subida directa:', file.name);
          }}
        >
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            📷 Seleccionar Nueva Foto
          </button>
        </PhotoProfileSelector>
      </section>

      {/* Ejemplo 3: FotoPerfil tradicional mejorado */}
      <section style={{ marginBottom: '40px' }}>
        <h2>3. FotoPerfil Mejorado (Compatible hacia atrás)</h2>
        <p>El componente original ahora soporta el mecanismo avanzado opcionalmente.</p>

        <FotoPerfil
          user={currentUser}
          setUser={setCurrentUser}
          editable={isAuthenticated}
          id={currentUser?.id}
          useAdvancedUpload={true}
          onPhotoUpload={handleAdvancedUpload}
          uploadProps={{
            showProgress: true,
            showSuccess: true
          }}
        />
      </section>

      {/* Información de debug */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Información de Debug</h2>
        <details style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          border: '1px solid #dee2e6'
        }}>
          <summary style={{
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '10px'
          }}>
            Ver detalles técnicos
          </summary>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            fontSize: '14px'
          }}>
            <div>
              <strong>Usuario Autenticado:</strong>
              <div style={{ color: isAuthenticated ? '#28a745' : '#dc3545' }}>
                {isAuthenticated ? '✅ Sí' : '❌ No'}
              </div>
            </div>

            <div>
              <strong>ID de Usuario:</strong>
              <div>{currentUser?.id || 'No disponible'}</div>
            </div>

            <div>
              <strong>Estado del Sistema:</strong>
              <div>{systemStatus}</div>
            </div>

            <div>
              <strong>Última Actualización:</strong>
              <div>
                {currentUser?.lastFotoUpdate
                  ? new Date(currentUser.lastFotoUpdate).toLocaleString()
                  : 'Nunca'
                }
              </div>
            </div>
          </div>

          {currentUser && (
            <div style={{ marginTop: '15px' }}>
              <strong>Datos del Usuario:</strong>
              <pre style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '150px'
              }}>
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </div>
          )}
        </details>
      </section>

      {/* Instrucciones de uso */}
      <section style={{
        backgroundColor: '#e3f2fd',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #2196f3'
      }}>
        <h3>📋 Cómo usar el sistema:</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li><strong>Selecciona una imagen</strong> haciendo clic en cualquier foto de perfil o botón</li>
          <li><strong>Observa el progreso</strong> con los indicadores visuales en tiempo real</li>
          <li><strong>Espera la actualización automática</strong> del estado global usando useAuthUser</li>
          <li><strong>Ve el refresco inmediato</strong> en todos los componentes de la aplicación</li>
        </ol>

        <div style={{ marginTop: '15px', fontSize: '14px', color: '#1976d2' }}>
          <strong>Características implementadas:</strong>
          <ul style={{ marginTop: '5px' }}>
            <li>✅ Integración completa con useAuthUser</li>
            <li>✅ Indicadores visuales de progreso</li>
            <li>✅ Manejo robusto de errores</li>
            <li>✅ Sincronización automática entre componentes</li>
            <li>✅ Gestión avanzada de caché</li>
            <li>✅ Eventos de actualización en tiempo real</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default PhotoProfileSystemExample;