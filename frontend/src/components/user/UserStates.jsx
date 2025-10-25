import React from "react";

function UserStates({ isLoadingPage, pageError, paginaUser, params }) {
  // Loading state
  if (isLoadingPage) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Error state
  if (pageError) {
    const isNotFound = pageError.message === 'User not found';
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>{isNotFound ? 'Usuario no encontrado' : 'Error al cargar'}</h2>
        <p>{isNotFound ? 'El usuario que buscas no existe o ha sido eliminado.' : pageError.message}</p>
      </div>
    );
  }

  // Lista de páginas públicas (estructura antigua)
  if (paginaUser && Array.isArray(paginaUser.paginas)) {
    const pages = paginaUser.paginas;
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>Páginas públicas de {params.username}</h2>
        {pages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
            <p>Este usuario no tiene páginas públicas disponibles.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {pages.map((page) => (
              <div key={page.id} style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "20px",
                background: "#fafafa"
              }}>
                <h3 style={{ marginTop: 0, color: "#333" }}>{page.titulo || "Página sin título"}</h3>
                {page.contenido && (
                  <div style={{
                    color: "#666",
                    lineHeight: "1.5",
                    marginBottom: "16px",
                    fontSize: "14px"
                  }}>
                    {(() => {
                      const plainText = page.contenido.replace(/<[^>]*>/g, '');
                      return plainText.length > 150 ? `${plainText.substring(0, 150)}...` : plainText;
                    })()}
                  </div>
                )}
                <div style={{ marginTop: "16px" }}>
                  <a
                    href={`/${params.username}/publicacion/${String(page.id)}`}
                    style={{
                      background: "#007bff",
                      color: "white",
                      padding: "8px 16px",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      display: "inline-block"
                    }}
                  >
                    Ver página completa
                  </a>
                </div>
                <p style={{
                  color: '#888',
                  fontSize: '0.8em',
                  marginTop: '12px',
                  marginBottom: 0
                }}>
                  {page.display_name && `Por: ${page.display_name} • `}
                  Creada el {(() => {
                    const dateValue = page.created_at || page.fecha_creacion;
                    if (!dateValue) return 'Fecha no disponible';
                    const date = new Date(dateValue);
                    return isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleDateString();
                  })()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Publicación específica (estructura nueva)
  if (paginaUser?.publicacion?.titulo && paginaUser?.publicacion?.contenido) {
    const publicacion = paginaUser.publicacion;
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>{publicacion.titulo}</h2>
        <div style={{ marginBottom: '20px' }}>
          {(() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('📦 [DEBUG] Publicación:', publicacion.titulo, `(${publicacion.id})`);
            }
            return <div dangerouslySetInnerHTML={{ __html: publicacion.contenido }} />;
          })()}
        </div>
        <p style={{ color: '#888', fontSize: '0.9em', borderTop: '1px solid #e9ecef', paddingTop: '8px' }}>
          Publicado el {new Date(publicacion.created_at).toLocaleString()}
        </p>
      </div>
    );
  }

  // No hay datos del usuario
  if (!paginaUser) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Página no encontrada</h2>
        <p>Esta página no existe.</p>
      </div>
    );
  }

  return null;
}

export default UserStates;