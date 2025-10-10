function formatUUID(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return `${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`;
}

import React from "react";
import { Link } from "react-router-dom";

function ComentariosList({ comentarios }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h4>Comentarios:</h4>
      {comentarios.length === 0 ? (
        <div style={{ color: '#888' }}>No hay comentarios aún.</div>
      ) : (
        comentarios.map(com => (
          <div key={com.id} style={{ background: '#f7f7f7', margin: '8px 0', padding: '8px', borderRadius: 6 }}>
            <div dangerouslySetInnerHTML={{ __html: com.comentario }}></div>
            <div style={{ fontSize: '0.9em', color: '#555' }}>
              Publicado por: {com.user_id ? (
                <Link to={com.username ? `/pagina/${encodeURIComponent(com.username.replace(/\s+/g, '-'))}` : `/pagina/${encodeURIComponent(com.user_id.replace(/-/g, ""))}`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                  {com.username || com.user_id}
                </Link>
              ) : 'Anónimo'}
              {' | '}
              {new Date(com.creado_en).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ComentariosList;
