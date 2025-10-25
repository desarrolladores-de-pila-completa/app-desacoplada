
import React from "react";
import GlobalChat from "../chat/GlobalChat";

function Feed({ feed }) {

  if (!feed || feed.length === 0) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <div>No hay textos completos disponibles en el feed.</div>
      </div>
    );
  }


  // Mostrar solo usuarios registrados
  const userRegistrations = feed.filter(row => row.mensaje);

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Chat Global */}
      <GlobalChat />

      <div id="registros" style={{ marginTop: "20px", border: "1px solid #ddd", padding: "10px", marginBottom: "20px" }}>
        <h4>Usuarios registrados</h4>
        {userRegistrations.length > 0 ? (
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
        ) : (
          <div>No hay entradas disponibles en el feed.</div>
        )}
      </div>
    </div>
  );
}

export default Feed;