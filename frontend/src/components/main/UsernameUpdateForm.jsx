import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

function UsernameUpdateForm() {
  const user = authService.getCurrentUser();
  const isAuthenticated = authService.isLoggedIn();

  // Estados del formulario
  const [newUsername, setNewUsername] = useState('');
  const [validation, setValidation] = useState({ isValid: true, errors: [], warnings: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Estados del modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados de estadísticas
  const [statistics, setStatistics] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Validación en tiempo real
  useEffect(() => {
    if (newUsername) {
      const validationResult = {
        isValid: newUsername.length >= 3 && newUsername.length <= 20,
        errors: newUsername.length < 3 ? ['El nombre de usuario debe tener al menos 3 caracteres'] : [],
        warnings: newUsername.length > 15 ? ['El nombre de usuario es muy largo'] : []
      };
      setValidation(validationResult);
    } else {
      setValidation({ isValid: true, errors: [], warnings: [] });
    }
  }, [newUsername]);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadStatistics();
    }
  }, [isAuthenticated, user]);

  const loadStatistics = async () => {
    setIsLoadingStats(true);
    setError('');

    try {
      // Simular estadísticas básicas
      setStatistics({
        totalUpdates: 0,
        redirectsActive: 0,
        lastUpdate: null,
        updatesHistory: []
      });
    } catch (error) {
      setError('Error al cargar estadísticas: ' + error.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handlePreview = async () => {
    if (!newUsername || !validation.isValid) return;

    setIsLoadingPreview(true);
    setError('');

    try {
      // Simular preview básico
      setPreviewData({
        oldUsername: user.username,
        newUsername: newUsername,
        warnings: validation.warnings,
        executionTimeMs: 100
      });
      setShowPreview(true);
    } catch (error) {
      setError('Error al obtener preview: ' + error.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError('');

    try {
      const result = await authService.updateUsername(newUsername);
      if (result.success) {
        setSuccess('Nombre de usuario actualizado correctamente');
        setNewUsername('');
        setShowPreview(false);
        setShowConfirmModal(false);
        setPreviewData(null);

        // Recargar estadísticas
        await loadStatistics();
      } else {
        setError('Error al actualizar: ' + result.error);
      }
    } catch (error) {
      setError('Error al actualizar: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const openConfirmModal = () => {
    if (previewData && validation.isValid) {
      setShowConfirmModal(true);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '120px auto',
        textAlign: 'center',
        background: '#fff',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 4px 24px #0002'
      }}>
        <p>Debes iniciar sesión para cambiar tu nombre de usuario.</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 800,
      margin: '120px auto',
      background: '#fff',
      padding: 32,
      borderRadius: 12,
      boxShadow: '0 4px 24px #0002'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32, color: '#1a202c' }}>
        Cambiar Nombre de Usuario
      </h2>

      {/* Información del usuario actual */}
      <div style={{
        background: '#f7fafc',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#2d3748', fontSize: '1.1em' }}>
          Usuario Actual
        </h3>
        <p style={{ margin: 0, color: '#4a5568' }}>
          <strong>Nombre de usuario:</strong> {user?.username}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#4a5568' }}>
          <strong>Email:</strong> {user?.email}
        </p>
      </div>

      {/* Formulario principal */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="newUsername"
            style={{
              display: 'block',
              marginBottom: 8,
              fontWeight: '600',
              color: '#2d3748'
            }}
          >
            Nuevo Nombre de Usuario:
          </label>
          <input
            id="newUsername"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Ingresa tu nuevo nombre de usuario"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: validation.isValid ? '2px solid #e2e8f0' : '2px solid #e53e3e',
              fontSize: '16px',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            disabled={isLoading}
          />
        </div>

        {/* Mensajes de validación */}
        {validation.errors.length > 0 && (
          <div style={{
            background: '#fed7d7',
            border: '1px solid #feb2b2',
            color: '#c53030',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Errores de validación:
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.errors.map((error, index) => (
                <li key={index} style={{ fontSize: '14px' }}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div style={{
            background: '#fef5e7',
            border: '1px solid #fbbf24',
            color: '#b7791f',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
              Advertencias:
            </h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.warnings.map((warning, index) => (
                <li key={index} style={{ fontSize: '14px' }}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <div style={{
            background: '#fed7d7',
            border: '1px solid #feb2b2',
            color: '#c53030',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#c6f6d5',
            border: '1px solid #9ae6b4',
            color: '#276749',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}>
            {success}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 16
        }}>
          <button
            onClick={handlePreview}
            disabled={!newUsername || !validation.isValid || isLoadingPreview || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: !newUsername || !validation.isValid || isLoadingPreview || isLoading ? '#cbd5e0' : '#3182ce',
              color: !newUsername || !validation.isValid || isLoadingPreview || isLoading ? '#a0aec0' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '16px',
              fontWeight: '600',
              cursor: !newUsername || !validation.isValid || isLoadingPreview || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flex: 1,
              minWidth: 150
            }}
          >
            {isLoadingPreview ? 'Obteniendo Preview...' : 'Vista Previa'}
          </button>

          <button
            onClick={openConfirmModal}
            disabled={!previewData || !validation.isValid || isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: !previewData || !validation.isValid || isLoading ? '#cbd5e0' : '#38a169',
              color: !previewData || !validation.isValid || isLoading ? '#a0aec0' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '16px',
              fontWeight: '600',
              cursor: !previewData || !validation.isValid || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flex: 1,
              minWidth: 150
            }}
          >
            Aplicar Cambios
          </button>
        </div>
      </div>

      {/* Sección de Preview */}
      {showPreview && previewData && (
        <div style={{
          background: '#edf2f7',
          padding: 20,
          borderRadius: 8,
          marginBottom: 24,
          border: '1px solid #cbd5e0'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>
            Vista Previa de Cambios
          </h3>

          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <strong style={{ color: '#4a5568' }}>Nombre actual:</strong>
              <span style={{ marginLeft: 8, color: '#2d3748' }}>{previewData.oldUsername}</span>
            </div>
            <div>
              <strong style={{ color: '#4a5568' }}>Nuevo nombre:</strong>
              <span style={{ marginLeft: 8, color: '#2d3748' }}>{previewData.newUsername}</span>
            </div>

            {previewData.warnings && previewData.warnings.length > 0 && (
              <div>
                <strong style={{ color: '#d69e2e' }}>Advertencias:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
                  {previewData.warnings.map((warning, index) => (
                    <li key={index} style={{ color: '#744210', fontSize: '14px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {previewData.executionTimeMs && (
              <div>
                <strong style={{ color: '#4a5568' }}>Tiempo estimado:</strong>
                <span style={{ marginLeft: 8, color: '#2d3748' }}>{previewData.executionTimeMs}ms</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div style={{
        background: '#f7fafc',
        padding: 20,
        borderRadius: 8,
        marginBottom: 24,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#2d3748' }}>
            Estadísticas de Actualizaciones
          </h3>
          <button
            onClick={loadStatistics}
            disabled={isLoadingStats}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoadingStats ? '#cbd5e0' : '#3182ce',
              color: isLoadingStats ? '#a0aec0' : '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '14px',
              cursor: isLoadingStats ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoadingStats ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {statistics ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <strong style={{ color: '#4a5568' }}>Total de actualizaciones:</strong>
                <span style={{ marginLeft: 8, color: '#2d3748' }}>{statistics.totalUpdates || 0}</span>
              </div>

              {statistics.redirectsActive !== undefined && (
                <div>
                  <strong style={{ color: '#4a5568' }}>Redirecciones activas:</strong>
                  <span style={{ marginLeft: 8, color: '#2d3748' }}>{statistics.redirectsActive}</span>
                </div>
              )}

              {statistics.lastUpdate && (
                <div>
                  <strong style={{ color: '#4a5568' }}>Última actualización:</strong>
                  <span style={{ marginLeft: 8, color: '#2d3748' }}>
                    {new Date(statistics.lastUpdate).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>

            {statistics.updatesHistory && statistics.updatesHistory.length > 0 && (
              <div>
                <strong style={{ color: '#4a5568', display: 'block', marginBottom: 8 }}>
                  Historial reciente:
                </strong>
                <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {statistics.updatesHistory.slice(0, 5).map((update, index) => (
                    <div key={index} style={{
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: 4,
                      marginBottom: 4,
                      fontSize: '14px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div><strong>{update.oldUsername}</strong> → <strong>{update.newUsername}</strong></div>
                      <div style={{ color: '#718096', fontSize: '12px' }}>
                        {new Date(update.timestamp).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: '#718096', textAlign: 'center', margin: 0 }}>
            {isLoadingStats ? 'Cargando estadísticas...' : 'No hay estadísticas disponibles'}
          </p>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 32,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a202c' }}>
              Confirmar Cambio de Nombre de Usuario
            </h3>

            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 16px 0', color: '#2d3748' }}>
                Estás a punto de cambiar tu nombre de usuario. Esta acción:
              </p>

              <ul style={{ margin: 0, paddingLeft: 20, color: '#4a5568' }}>
                <li>Actualizará tu nombre de usuario en todo el sistema</li>
                <li>Podría afectar enlaces existentes a tu perfil</li>
                <li>Se registrará en el historial de cambios</li>
                {previewData?.warnings && previewData.warnings.length > 0 && (
                  <li>Generará las siguientes advertencias que debes revisar</li>
                )}
              </ul>
            </div>

            <div style={{
              background: '#edf2f7',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: '#4a5568' }}>De:</strong>
                <span style={{ marginLeft: 8, color: '#2d3748' }}>{previewData?.oldUsername}</span>
              </div>
              <div>
                <strong style={{ color: '#4a5568' }}>A:</strong>
                <span style={{ marginLeft: 8, color: '#2d3748' }}>{previewData?.newUsername}</span>
              </div>
            </div>

            {previewData?.warnings && previewData.warnings.length > 0 && (
              <div style={{
                background: '#fef5e7',
                border: '1px solid #fbbf24',
                color: '#744210',
                padding: 12,
                borderRadius: 6,
                marginBottom: 24
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  Advertencias importantes:
                </h4>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {previewData.warnings.map((warning, index) => (
                    <li key={index} style={{ fontSize: '14px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeConfirmModal}
                disabled={isUpdating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#e2e8f0',
                  color: '#4a5568',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '16px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isUpdating ? '#cbd5e0' : '#38a169',
                  color: isUpdating ? '#a0aec0' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isUpdating ? 'not-allowed' : 'pointer'
                }}
              >
                {isUpdating ? 'Aplicando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsernameUpdateForm;