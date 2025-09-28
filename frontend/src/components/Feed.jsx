import React from "react";

function Feed({ feed }) {
  return (
    <div id="section-feed" style={{ marginBottom: "32px" }}>
      <h3>Feed público</h3>
      <div id="listaFeed">
        {feed.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Título</th>
                <th>Contenido</th>
                <th>Creado en</th>
                <th>Elementos</th>
              </tr>
            </thead>
            <tbody>
              {feed.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.user_id}</td>
                  <td>{row.titulo}</td>
                  <td>{row.contenido}</td>
                  <td>{row.creado_en}</td>
                  <td>{row.elementos ? JSON.stringify(row.elementos) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No hay textos completos disponibles en el feed.</div>
        )}
      </div>
    </div>
  );
}

export default Feed;