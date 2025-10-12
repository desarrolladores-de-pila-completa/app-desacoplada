import React from "react";

function Footer({ feed }) {
  if (!feed || feed.length === 0) {
    return null;
  }

  // Mostrar solo usuarios registrados en el footer
  const userRegistrations = feed.filter(row => row.mensaje);

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      borderTop: '1px solid #ddd',
      padding: '16px',
      zIndex: 1000
    }}>
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
  );
}

export default Footer;