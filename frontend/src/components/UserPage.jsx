


import React from "react";
import ImageGrid from "./ImageGrid";
import { useParams } from "react-router-dom";

function UserPage() {
  // Handler para eliminar usuario y página
  const handleDeleteProfile = async () => {
    if (!authUserId) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar tu perfil y página? Esta acción no se puede deshacer.")) return;
    try {
      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      const res = await fetch(`/api/auth/user/${authUserId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include"
      });
      if (res.ok) {
        alert("Perfil y página eliminados correctamente.");
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar perfil.");
      }
    } catch {
      alert("Error de red o servidor al eliminar perfil.");
    }
  };
  const [showUsernameEdit, setShowUsernameEdit] = React.useState(false);
  // Estados de visibilidad por campo
  const [visCampos, setVisCampos] = React.useState({
    visible_titulo: true,
    visible_contenido: true,
    visible_descripcion: true,
    visible_usuario: true,
    visible_comentarios: true
  });
  // Estados para edición de campos de página
  const [descripcion, setDescripcion] = React.useState("visible");
  const [usuario, setUsuario] = React.useState("");
  const [comentariosResumen, setComentariosResumen] = React.useState("");
  // Estados y hooks dentro de la función UserPage
  const [visibilidad, setVisibilidad] = React.useState({ oculto: false });
  const [oculto, setOculto] = React.useState(false);
  const [visError, setVisError] = React.useState("");
  const [visSuccess, setVisSuccess] = React.useState("");
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [nuevoEmail, setNuevoEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState(""); // Usado en handleEmailSubmit
  const [emailSuccess, setEmailSuccess] = React.useState(""); // Usado en handleEmailSubmit
  const [comentarios, setComentarios] = React.useState([]);
  const { id } = useParams();
  const [user, setUser] = React.useState(null);
  const [pagina, setPagina] = React.useState(null);
  const [, setPropietario] = React.useState(false);
  const [authUserId, setAuthUserId] = React.useState(null);

  // Handler para cambiar correo
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!nuevoEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nuevoEmail)) {
      setEmailError("Correo electrónico inválido.");
      return;
    }
    try {
      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      const res = await fetch(`/api/auth/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ email: nuevoEmail }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Error al cambiar el correo.");
      } else {
        setEmailSuccess("Correo actualizado correctamente.");
        setUser((prev) => ({ ...prev, email: nuevoEmail }));
        setShowEmailForm(false);
      }
    } catch {
      setEmailError("Error de red o servidor.");
    }
  };

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/auth/user/${id}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error al obtener usuario:", err);
      }
    }
    fetchUser();
  }, [id]);

  React.useEffect(() => {
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

  // Hook para obtener la página
  React.useEffect(() => {
    async function fetchPagina() {
      try {
        const res = await fetch(`/api/paginas?user_id=${id}`);
        if (res.ok) {
          const data = await res.json();
          // El endpoint devuelve un array, tomamos el primero
          setPagina(Array.isArray(data) && data.length > 0 ? data[0] : null);
        }
      } catch (err) {
        console.error("Error al obtener página:", err);
      }
    }
    fetchPagina();
  }, [id]);

  // Hook para obtener comentarios
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

  // Hook para consultar visibilidad y oculto de la página
  React.useEffect(() => {
    async function fetchVisibilidad() {
      if (!pagina || !pagina.id) return;
      try {
        const res = await fetch(`/api/paginas/${pagina.id}/visibilidad`);
        if (res.ok) {
          const data = await res.json();
          setVisibilidad({ oculto: !!data.oculto });
          setOculto(!!data.oculto);
        }
      } catch (err) {
        console.error("Error al consultar visibilidad:", err);
      }
    }
    fetchVisibilidad();
    // Obtener visibilidad de cada campo
    async function fetchVisCampos() {
      if (!pagina || !pagina.id) return;
      try {
        const res = await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`);
        if (res.ok) {
          const data = await res.json();
          setVisCampos({
            visible_titulo: !!data.visible_titulo,
            visible_contenido: !!data.visible_contenido,
            visible_descripcion: !!data.visible_descripcion,
            visible_usuario: !!data.visible_usuario,
            visible_comentarios: !!data.visible_comentarios
          });
        }
      } catch (err) {
        console.error("Error al consultar visibilidad de campos:", err);
      }
    }
    fetchVisCampos();
  }, [id, pagina]);

  const esDueno = authUserId && pagina && String(pagina.user_id) === String(authUserId);

  // Eliminado: función de guardar cambios

  const [nuevoUsername, setNuevoUsername] = React.useState("");
  const [usernameError, setUsernameError] = React.useState("");
  const [usernameSuccess, setUsernameSuccess] = React.useState("");

  const handleUsernameChange = (e) => {
    setNuevoUsername(e.target.value);
    setUsernameError("");
    setUsernameSuccess("");
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");
    if (!nuevoUsername || nuevoUsername.trim().length < 3) {
      setUsernameError("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }
    try {
      // Obtener el token CSRF
      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      const res = await fetch(`/api/auth/username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ username: nuevoUsername }),
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error || "Error al cambiar el nombre de usuario.");
      } else {
        setUsernameSuccess("Nombre de usuario actualizado correctamente.");
        setUser((prev) => ({ ...prev, username: nuevoUsername }));
      }
  } catch {
      setUsernameError("Error de red o servidor.");
    }
  };

  if (!user) return <div>No se encontró el usuario.</div>;
  // Si la página está oculta y no eres el dueño, no mostrar contenido
  if (pagina && visibilidad.oculto && !esDueno) {
    return <div>Esta página está oculta por el propietario.</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
      <h2>Página personal de usuario</h2>
  {/* Eliminado el mensaje de ID de usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Correo: <strong>{user?.email}</strong></span>
        {esDueno && (
          <button type="button" onClick={() => setShowEmailForm(true)} style={{ padding: '2px 8px', fontSize: '0.95em', cursor: 'pointer' }}>
            Editar
          </button>
        )}
      </div>

      {/* Formulario para cambiar correo */}
      {esDueno && showEmailForm && (
        <form onSubmit={handleEmailSubmit} style={{ marginBottom: '16px' }}>
          <label>
            Nuevo correo:
            <input
              type="email"
              value={nuevoEmail}
              onChange={e => setNuevoEmail(e.target.value)}
              style={{ marginLeft: '8px' }}
              required
            />
          </label>
          <button type="submit" style={{ marginLeft: '8px' }}>Actualizar correo</button>
          <button type="button" style={{ marginLeft: '8px' }} onClick={() => setShowEmailForm(false)}>Cancelar</button>
          {emailError && <div style={{ color: 'red' }}>{emailError}</div>}
          {emailSuccess && <div style={{ color: 'green' }}>{emailSuccess}</div>}
        </form>
      )}
  <p>Username: <strong>{user?.username}</strong></p>
      {esDueno && (
        <span style={{ marginLeft: 8 }}>
          <button
            type="button"
            style={{ padding: "2px 8px", fontSize: "0.95em", cursor: "pointer" }}
            onClick={() => setShowUsernameEdit(true)}
          >Editar</button>
        </span>
      )}

      {esDueno && showUsernameEdit && (
        <form onSubmit={handleUsernameSubmit} style={{ marginTop: "16px" }}>
          <label>
            <input
              type="text"
              value={nuevoUsername}
              onChange={handleUsernameChange}
              placeholder="Nuevo nombre de usuario"
              style={{ marginLeft: "8px" }}
            />
          </label>
          <button type="submit" style={{ marginLeft: "8px" }}>Guardar</button>
          <button type="button" style={{ marginLeft: "8px" }} onClick={() => setShowUsernameEdit(false)}>Cancelar</button>
          {usernameError && <div style={{ color: "red" }}>{usernameError}</div>}
          {usernameSuccess && <div style={{ color: "green" }}>{usernameSuccess}</div>}
        </form>
      )}
      {esDueno && (
        <div style={{ color: 'green', fontWeight: 'bold', marginTop: '8px' }}>ERES EL DUEÑO</div>
      )}
  {/* Cuadrícula de imágenes 3x6 */}
  <ImageGrid paginaId={pagina?.id} />
      {pagina && (
        <div style={{ marginTop: 32 }}>
          <h3>{pagina.titulo}</h3>
          <p>{pagina.contenido}</p>
          {/* El formulario de comentario solo es visible para usuarios autenticados */}
          {authUserId ? (
            <AgregarComentario paginaId={pagina.id} />
          ) : (
            <div style={{ color: '#888', marginTop: 16 }}>
              Debes iniciar sesión para agregar un comentario.
            </div>
          )}
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
        </div>
      )}
    </div>
  );
}

// Componente para agregar comentario
function AgregarComentario({ paginaId }) {
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
// Aseguramos que el archivo termina con las llaves de cierre correctas
// y los exports al nivel superior

export { AgregarComentario };