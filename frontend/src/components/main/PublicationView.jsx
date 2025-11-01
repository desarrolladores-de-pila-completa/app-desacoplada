import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";

function PublicationView() {
  const { username, id } = useParams();
  const navigate = useNavigate();
  const [publicacion, setPublicacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPublicacion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/publicar/${username}/publicaciones/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Publicación no encontrada');
          }
          throw new Error(`Error al cargar publicación: ${response.status}`);
        }

        const data = await response.json();
        setPublicacion(data);
      } catch (err) {
        console.error('Error cargando publicación:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarPublicacion();
  }, [username, id]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Cargando publicación...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center',
        background: '#fee',
        color: '#c33',
        borderRadius: '8px',
        border: '1px solid #fcc'
      }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(`/pagina/${username}`)}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          Volver a la página del usuario
        </button>
      </div>
    );
  }

  if (!publicacion) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Publicación no encontrada</h2>
        <button
          onClick={() => navigate(`/pagina/${username}`)}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '15px'
          }}
        >
          Volver a la página del usuario
        </button>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      margin: 0,
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#333'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }}>
        <button
          onClick={() => navigate(`/pagina/${username}`)}
          style={{
            display: 'inline-block',
            marginBottom: '20px',
            color: '#3498db',
            textDecoration: 'none',
            fontWeight: 'bold',
            padding: '10px 15px',
            borderRadius: '5px',
            background: 'rgba(52, 152, 219, 0.1)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(52, 152, 219, 0.2)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(52, 152, 219, 0.1)'}
        >
          ← Volver a la página
        </button>

        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            color: '#2c3e50',
            fontSize: '2.5em',
            margin: '0 0 10px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            📄 {publicacion.titulo || 'Sin título'}
          </h1>
          <div style={{
            color: '#7f8c8d',
            fontSize: '1em'
          }}>
            Por {username} • {new Date(publicacion.created_at || publicacion.creado_en).toLocaleDateString('es-ES')}
          </div>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '30px',
          borderRadius: '12px',
          borderLeft: '5px solid #3498db',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          lineHeight: '1.7',
          fontSize: '16px',
          color: '#555'
        }}>
          <div dangerouslySetInnerHTML={{ __html: publicacion.contenido || 'Sin contenido' }} />
        </div>
      </div>
    </div>
  );
}

export default PublicationView;