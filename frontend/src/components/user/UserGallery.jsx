import React, { useState, useEffect } from "react";
import ImageGrid from "../content/ImageGrid";
import { API_BASE } from "../../config/api";

function UserGallery({ paginaUser, authUser }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPublicaciones = async () => {
      if (!paginaUser?.usuario?.username) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/publicar/${paginaUser.usuario.username}/publicaciones`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Error al cargar publicaciones: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('La respuesta no es JSON válido');
        }

        const data = await response.json();
        setPublicaciones(data.publicaciones || []);
      } catch (err) {
        console.error('Error cargando publicaciones:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarPublicaciones();
  }, [paginaUser?.usuario?.username]);

  return (
    <>
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

      {/* Sección de Publicaciones */}
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
          background: 'linear-gradient(90deg, #3498db 0%, #2980b9 100%)'
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
          📝 Publicaciones
        </h3>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
          }}>
            Cargando publicaciones...
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && publicaciones.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#7f8c8d'
          }}>
            No hay publicaciones aún.
          </div>
        )}

        {!loading && !error && publicaciones.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {publicaciones.map((pub, index) => (
              <div key={pub.id || index} style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                borderLeft: '4px solid #3498db',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s ease'
              }}>
                <a
                  href={`/publicar/${paginaUser.usuario.username}/publicaciones/${pub.id}`}
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#3498db',
                    textDecoration: 'none',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => e.target.parentElement.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.parentElement.style.transform = 'translateY(0)'}
                >
                  {index + 1}. {pub.titulo || 'Sin título'}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default UserGallery;