
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
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Enlace a página</th>
            <th>Título</th>
            <th>Contenido</th>
            <th>Creado en</th>
          </tr>
        </thead>
        <tbody>
          {feed.map((row) => (
            <tr key={row.id}>
              <td>
                <a href={`/usuario/${row.user_id}`}>Ver página</a>
              </td>
              <td>{row.visible_titulo ? row.titulo : <span style={{ color: '#888' }}>Oculto</span>}</td>
              <td>{row.visible_contenido ? row.contenido : <span style={{ color: '#888' }}>Oculto</span>}</td>
              <td>{row.creado_en}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Feed;