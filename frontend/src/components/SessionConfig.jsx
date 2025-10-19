import React, { useState } from 'react';
import useAuthStore from '../stores/authStore';

const SessionConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,123,255,0.3)',
          fontSize: '20px'
        }}
      >
        ⚙️
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1001,
      minWidth: '250px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, color: '#333' }}>Estado de Sesión</h4>
        <button
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#333' }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>Estado:</strong> {isAuthenticated ? 'Autenticado' : 'No autenticado'}
        </div>

        {isAuthenticated && user && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Usuario:</strong> {user.username}
          </div>
        )}

        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
          <p><em>Sistema de autenticación simplificado</em></p>
          <p>Funciones avanzadas de sesión deshabilitadas</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default SessionConfig;