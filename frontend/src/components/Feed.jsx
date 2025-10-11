
import React from "react";

function Feed({ feed }) {

  if (!feed || feed.length === 0) {
    return (
      <div id="section-feed" style={{ marginBottom: "32px" }}>
        <h3>Feed público</h3>
        <div>No hay textos completos disponibles en el feed.</div>
      </div>
    );
  }

  // Mostrar solo usuarios registrados en el feed
  const userRegistrations = feed.filter(row => row.mensaje);

  return (
    <div id="section-feed" style={{ marginBottom: "32px" }}>
      <h3>Feed público</h3>

      {/* Sección de usuarios registrados */}
      {userRegistrations.length > 0 ? (
        <div>
          <h4>Usuarios registrados</h4>
          <ul>
            {userRegistrations.map((row) => (
              <li key={row.id}>
                <span dangerouslySetInnerHTML={{ __html: row.mensaje }}></span>
                {row.creado_en && (
                  <span style={{ color: '#888', marginLeft: '8px' }}>{new Date(row.creado_en).toLocaleString()}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>No hay entradas disponibles en el feed.</div>
      )}
    </div>
  );
}

export default Feed;