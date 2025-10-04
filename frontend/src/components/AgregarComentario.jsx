import React from "react";
import useAuthUser from "../hooks/useAuthUser";
const API_URL = "http://localhost:3000";

function AgregarComentario({ paginaId }) {
  const { authUserId } = useAuthUser();
  const [comentario, setComentario] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      // Obtener el token CSRF desde el endpoint y usar el valor del JSON
      const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      const res = await fetch(`${API_URL}/api/paginas/${paginaId}/comentarios`, {
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
    }
  };

  if (!authUserId) {
    return <div style={{ color: '#888', marginTop: 16 }}>Debes iniciar sesión para agregar un comentario.</div>;
  }
  return (
    <form onSubmit={handleSubmit} style={{ margin: '24px auto', width: 400, height: 300, maxWidth: 400, maxHeight: 300, minWidth: 400, minHeight: 300, boxSizing: 'border-box', background: '#f7f7f7', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <label>Agregar comentario:</label>
      <textarea
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        rows={8}
        style={{ width: "100%", height: 180, marginBottom: 8, resize: "none", boxSizing: 'border-box', borderRadius: 6, border: '1px solid #ccc', padding: 8 }}
      />
      <button type="submit" style={{ width: 120, alignSelf: 'center', marginTop: 8 }}>Agregar</button>
      {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </form>
  );
}

export default AgregarComentario;
