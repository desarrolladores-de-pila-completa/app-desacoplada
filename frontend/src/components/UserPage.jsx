


import React from "react";
import { useParams } from "react-router-dom";

function UserPage() {
  const [comentarios, setComentarios] = React.useState([]);
  const { id } = useParams();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [pagina, setPagina] = React.useState(null);
  // Eliminado: edición de página
  const [authUserId, setAuthUserId] = React.useState(null);

  React.useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/auth/user/${id}`);
        setUser(res.ok ? await res.json() : null);
      } catch (err) {
        setUser(null);
        console.error("Error al obtener usuario:", err);
      }
      setLoading(false);
    }
    fetchUser();

    async function fetchAuthUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAuthUserId(data.id);
        }
      } catch (err) {
        console.error("Error al obtener usuario autenticado:", err);
      }
    }
    fetchAuthUser();
  }, [id]);

  React.useEffect(() => {
    async function fetchPagina() {
      try {
        const res = await fetch(`/api/paginas/usuario/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPagina(data);
        }
      } catch (err) {
        console.error("Error al obtener página:", err);
      }
    }
    fetchPagina();
  }, [id]);

  React.useEffect(() => {
    if (pagina && pagina.id) {
      (async () => {
        try {
          const res = await fetch(`/api/paginas/${pagina.id}/comentarios`);
          if (res.ok) {
            const data = await res.json();
            setComentarios(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error("Error al obtener comentarios:", err);
        }
      })();
    }
  }, [pagina]);

  const esDueno = authUserId && pagina && String(pagina.user_id) === String(authUserId);

  // Eliminado: función de guardar cambios

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No se encontró el usuario.</div>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <h2>Página personal de usuario</h2>
      <p>Bienvenido, tu ID de usuario es: <strong>{user?.id}</strong></p>
      <p>Correo: <strong>{user?.email}</strong></p>
      <p>Username: <strong>{user?.username}</strong></p>
      {esDueno ? (
        <div style={{ color: 'green', fontWeight: 'bold', marginTop: '8px' }}>ERES EL DUEÑO</div>
      ) : (
        <div style={{ color: 'red', fontWeight: 'bold', marginTop: '8px' }}>NO ERES EL DUEÑO</div>
      )}
      {pagina && (
        <div style={{ marginTop: 32 }}>
          <h3>{pagina.titulo}</h3>
          <p>{pagina.contenido}</p>
          {esDueno && (
            <>
              <AgregarComentario paginaId={pagina.id} />
              {/* Comentarios debajo del mensaje de dueño */}
              <div style={{ marginTop: 24 }}>
                <h4>Comentarios:</h4>
                {comentarios.length === 0 ? (
                  <div style={{ color: '#888' }}>No hay comentarios aún.</div>
                ) : (
                  comentarios.map(com => (
                    <div key={com.id} style={{ background: '#f7f7f7', margin: '8px 0', padding: '8px', borderRadius: 6 }}>
                      <strong>{com.comentario}</strong>
                      <div style={{ fontSize: '0.9em', color: '#555' }}>Publicado: {new Date(com.creado_en).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para agregar comentario
export function AgregarComentario({ paginaId }) {
  const [comentario, setComentario] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      // Obtener el token CSRF antes de la petición
      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
      const { csrfToken } = await csrfRes.json();
      const res = await fetch(`/api/paginas/${paginaId}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ comentario }),
        credentials: "include"
      });
      if (res.ok) {
        setMsg("Comentario agregado!");
        setComentario("");
      } else {
        setError("Error al agregar comentario");
      }
    } catch (err) {
      setError("Error de red o servidor");
      console.error("Error al agregar comentario:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <label>Agregar comentario:</label>
      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button type="submit">Agregar</button>
      {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </form>
  );
}

export default UserPage;