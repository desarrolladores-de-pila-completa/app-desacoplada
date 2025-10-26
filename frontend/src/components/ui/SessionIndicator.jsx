import React from 'react';
import authService from '../../services/authService';

const SessionIndicator = () => {
  const isAuthenticated = authService.isLoggedIn();
  const user = authService.getCurrentUser();

  // Si no está autenticado, no mostrar indicador
  if (!isAuthenticated) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isAuthenticated) {
      return {
        color: '#6c757d',
        message: 'No autenticado',
        status: 'inactive'
      };
    }

    return {
      color: '#28a745',
      message: `Hola, ${user?.username || 'Usuario'}`,
      status: 'active'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="session-indicator" style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: statusInfo.color,
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        opacity: statusInfo.status === 'active' ? 1 : 0.7
      }} />

      <span>{statusInfo.message}</span>
    </div>
  );
};

export default SessionIndicator;