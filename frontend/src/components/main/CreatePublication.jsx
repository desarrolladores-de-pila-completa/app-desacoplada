import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

function CreatePublication() {
  const { username } = useParams();
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState("Nueva Publicación");
  const [puckData, setPuckData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verificar que el usuario autenticado es el propietario
  if (!user || user.username !== username) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h2>No autorizado</h2>
        <p>Solo puedes crear publicaciones en tu propio perfil.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Obtener CSRF token
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      // Crear la publicación usando la ruta correcta
      const response = await fetch(`/api/publicaciones/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          titulo,
          contenido: puckData,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear publicación');
      }

      const result = await response.json();

      // Redirigir a la página de usuario para ver todas las publicaciones
      const sanitizedUsername = String(username || '').replace(/\s+/g, '-');
      if (sanitizedUsername.trim()) {
        navigate(`/pagina/${sanitizedUsername}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '80vw', height: '100vh', background: "#fff", position: 'fixed', top: 0, left: '10vw', zIndex: 1000 }}>
      <div style={{ padding: 32 }}>
        <h2>Crear Nueva Publicación</h2>
      </div>

      <textarea
        value={puckData}
        onChange={(e) => setPuckData(e.target.value)}
        placeholder="Escribe el contenido de tu publicación aquí..."
        style={{
          width: '100%',
          height: '60vh',
          padding: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          resize: 'vertical'
        }}
      />

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '10vw',
        right: '10vw',
        background: '#fff',
        padding: '16px 32px',
        borderTop: '1px solid #e0e0e0',
        zIndex: 1001
      }}>
        {error && (
          <div style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '12px 24px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creando...' : 'Crear Publicación'}
        </button>
      </div>
    </div>
  );
}

export default CreatePublication;