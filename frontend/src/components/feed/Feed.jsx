
import React, { useState, useEffect } from "react";
import GlobalChat from "../chat/GlobalChat";
import { API_BASE } from "../../config/api.js";

function Feed() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/users`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Error al obtener usuarios');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div>Cargando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Chat Global */}
      <GlobalChat />

      <div id="registros" style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px", marginBottom: "20px" }}>
        <h4>Usuarios registrados</h4>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <img
                  src={`${API_BASE}/auth/user/${user.id}/foto`}
                  alt="Foto de perfil"
                  style={{ width: "32px", height: "32px", borderRadius: "50%", verticalAlign: "middle", marginRight: "8px" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <a href={`/pagina/${user.username}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                  {user.display_name}
                </a>
                {user.creado_en && (
                  <span style={{ color: '#888', marginLeft: '8px' }}>{new Date(user.creado_en).toLocaleString()}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div>No hay usuarios registrados.</div>
        )}
      </div>
    </div>
  );
}

export default Feed;