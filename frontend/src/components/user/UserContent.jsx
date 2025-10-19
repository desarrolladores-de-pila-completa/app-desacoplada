import React from "react";
import ContentRenderer from "../ContentRenderer";

function UserContent({ paginaUser, renderContent }) {
  if (!paginaUser?.pagina?.contenido) return null;

  return (
    <div style={{
      padding: '32px',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e9ecef',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
      }}></div>

      <h3 style={{
        marginTop: '16px',
        marginBottom: '20px',
        color: '#2c3e50',
        fontSize: '1.5em',
        fontWeight: '600'
      }}>
        📄 {paginaUser?.pagina?.titulo || 'Página'}
      </h3>

      <div style={{
        marginBottom: '24px',
        lineHeight: '1.7',
        fontSize: '16px'
      }}>
        {(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('📦 [DEBUG] Página:', paginaUser?.pagina?.titulo);
          }
          return renderContent(paginaUser?.pagina?.contenido);
        })()}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #ecf0f1',
        fontSize: '0.9em',
        color: '#7f8c8d'
      }}>
        <span>📅 Publicado el {new Date(paginaUser?.pagina?.creado_en).toLocaleString()}</span>
        <span>ID: {paginaUser?.pagina?.id}</span>
      </div>
    </div>
  );
}

export default UserContent;