import React from "react";
import ImageGrid from "../content/ImageGrid";

function UserGallery({ paginaUser, authUser }) {
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
        background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
      }}></div>

      <h3 style={{
        marginTop: '16px',
        marginBottom: '20px',
        color: '#2c3e50',
        fontSize: '1.3em',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🖼️ Galería de Imágenes
      </h3>

      <div style={{
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <ImageGrid
          pageId={paginaUser?.pagina?.id}
          username={paginaUser?.usuario?.username}
          editable={authUser?.id === paginaUser?.usuario?.id}
          images={paginaUser?.galeria}
        />
      </div>
    </div>
  );
}

export default UserGallery;