import React from "react";

function UserData({ userData, params, refreshUserData }) {
  if (!userData) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      marginBottom: '32px',
      padding: '24px',
      background: '#e8f5e8',
      borderRadius: '8px',
      border: '1px solid #4caf50'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2e7d32' }}>
        👤 Datos del Usuario (/:username)
      </h3>
      <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        <p><strong>🔹 Username:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{userData.username}</code></p>
        <p><strong>🔹 Display Name:</strong> {userData.display_name || <em style={{ color: '#666' }}>No configurado</em>}</p>
        <p><strong>🔹 Foto de Perfil:</strong> {userData.foto_perfil ? <span style={{ color: '#4caf50' }}>✅ Disponible</span> : <span style={{ color: '#f44336' }}>❌ No disponible</span>}</p>
        <p><strong>🔹 Fuente:</strong> <code style={{ background: '#fff3e0', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>/{params.username}</code></p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#fff3e0', borderRadius: '4px', fontSize: '12px' }}>
          <p><strong>📊 Información de Debug:</strong></p>
          <p>URL: <code>{`http://localhost:3000/api/pagina/${params.username}?action=info`}</code></p>
          <p>Estado: <span style={{ color: '#4caf50' }}>✅ Funcionando correctamente</span></p>
          <button
            onClick={refreshUserData}
            style={{
              background: '#ff9800',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              marginTop: '8px'
            }}
          >
            🔄 Refrescar Datos
          </button>
        </div>
      )}
    </div>
  );
}

export default UserData;