
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
  return (
    <div id="section-feed" style={{ marginBottom: "32px" }}>
      <h3>Feed público</h3>
      <ul>
        {feed.map((row) => (
          <li key={row.id}>
            <span dangerouslySetInnerHTML={{ __html: row.mensaje }} />
            {row.creado_en && (
              <span style={{ color: '#888', marginLeft: '8px' }}>{new Date(row.creado_en).toLocaleString()}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Feed;