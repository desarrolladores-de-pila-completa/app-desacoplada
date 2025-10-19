import React from "react";

function UserActions({ authUser, paginaUser, handleDeleteUser }) {
  if (authUser?.id !== paginaUser?.usuario?.id) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '24px',
      background: '#ffffff',
      borderRadius: '16px',
      border: '2px solid #dc3545',
      boxShadow: '0 4px 20px rgba(220, 53, 69, 0.15)',
      position: 'relative',
      overflow: 'hidden',
      marginTop: '32px'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: '#dc3545'
      }}></div>

      <h3 style={{
        marginTop: '16px',
        marginBottom: '16px',
        color: '#dc3545',
        fontSize: '1.2em',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ⚠️ Zona de Peligro
      </h3>

      <p style={{
        color: '#6c757d',
        marginBottom: '20px',
        lineHeight: '1.6'
      }}>
        Esta acción eliminará permanentemente tu perfil y todos tus datos asociados. <strong>Esta acción es irreversible.</strong>
      </p>

      <button
        onClick={handleDeleteUser}
        style={{
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 32px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 69, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 69, 0.3)';
        }}
      >
        🗑️ Borrar mi perfil y todos mis datos
      </button>
    </div>
  );
}

export default UserActions;