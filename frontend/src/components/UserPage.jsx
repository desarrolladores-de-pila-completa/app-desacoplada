  import React from "react";
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
        const res = await fetch(`/api/paginas/usuario/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPagina(data);
           // Sincronizar estados editables con los datos de la página
           setPropietario(!!data.propietario);
           setDescripcion(data.descripcion || "visible");
           setUsuario(data.usuario || "");
           setComentariosResumen(data.comentarios || "");
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
          {pagina && (
        <div style={{ marginTop: 32 }}>
          {visCampos.visible_titulo && <h3>{pagina.titulo}</h3>}
          {visCampos.visible_contenido && <p>{pagina.contenido}</p>}
          {visCampos.visible_usuario && <p><strong>Usuario:</strong> {pagina.usuario || user?.username}</p>}
          <p><strong>Propietario:</strong> {pagina.propietario ? "Sí" : "No"}</p>
          {visCampos.visible_descripcion && <p><strong>Descripción:</strong> {pagina.descripcion}</p>}
          {/* Edición de campos solo para el dueño */}
          {esDueno && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setVisError("");
                setVisSuccess("");
                try {
                  const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                  const csrfData = await csrfRes.json();
                  const csrfToken = csrfData.csrfToken;
                  // Actualizar descripción
                  await fetch(`/api/paginas/${pagina.id}/descripcion`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({ descripcion }),
                    credentials: "include"
                  });
                  // Actualizar usuario
                  await fetch(`/api/paginas/${pagina.id}/usuario`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({ usuario }),
                    credentials: "include"
                  });
                  // Actualizar comentarios resumen
                  await fetch(`/api/paginas/${pagina.id}/comentarios-resumen`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({ comentarios }),
                    credentials: "include"
                  });
                  // Actualizar oculto
                  await fetch(`/api/paginas/${pagina.id}/visibilidad`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-CSRF-Token": csrfToken
                    },
                    body: JSON.stringify({ oculto }),
                    credentials: "include"
                  });
                  setVisSuccess("Campos actualizados correctamente.");
                } catch {
                  setVisError("Error de red o servidor.");
                }
              }}
              style={{ marginBottom: 16, marginTop: 16 }}
            >
              {/* Selectores de visibilidad por campo */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ marginRight: 16 }}>
                  Título visible:
                  <select value={visCampos.visible_titulo ? "1" : "0"} onChange={async e => {
                    const nuevo = { ...visCampos, visible_titulo: e.target.value === "1" };
                    setVisCampos(nuevo);
                    if (pagina && pagina.id) {
                      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                      const csrfData = await csrfRes.json();
                      const csrfToken = csrfData.csrfToken;
                      await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(nuevo),
                        credentials: "include"
                      });
                    }
                  }} style={{ marginLeft: 8 }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label style={{ marginRight: 16 }}>
                  Contenido visible:
                  <select value={visCampos.visible_contenido ? "1" : "0"} onChange={async e => {
                    const nuevo = { ...visCampos, visible_contenido: e.target.value === "1" };
                    setVisCampos(nuevo);
                    if (pagina && pagina.id) {
                      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                      const csrfData = await csrfRes.json();
                      const csrfToken = csrfData.csrfToken;
                      await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(nuevo),
                        credentials: "include"
                      });
                    }
                  }} style={{ marginLeft: 8 }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label style={{ marginRight: 16 }}>
                  Descripción visible:
                  <select value={visCampos.visible_descripcion ? "1" : "0"} onChange={async e => {
                    const nuevo = { ...visCampos, visible_descripcion: e.target.value === "1" };
                    setVisCampos(nuevo);
                    if (pagina && pagina.id) {
                      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                      const csrfData = await csrfRes.json();
                      const csrfToken = csrfData.csrfToken;
                      await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(nuevo),
                        credentials: "include"
                      });
                    }
                  }} style={{ marginLeft: 8 }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label style={{ marginRight: 16 }}>
                  Usuario visible:
                  <select value={visCampos.visible_usuario ? "1" : "0"} onChange={async e => {
                    const nuevo = { ...visCampos, visible_usuario: e.target.value === "1" };
                    setVisCampos(nuevo);
                    if (pagina && pagina.id) {
                      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                      const csrfData = await csrfRes.json();
                      const csrfToken = csrfData.csrfToken;
                      await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(nuevo),
                        credentials: "include"
                      });
                    }
                  }} style={{ marginLeft: 8 }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
                <label style={{ marginRight: 16 }}>
                  Comentarios visibles:
                  <select value={visCampos.visible_comentarios ? "1" : "0"} onChange={async e => {
                    const nuevo = { ...visCampos, visible_comentarios: e.target.value === "1" };
                    setVisCampos(nuevo);
                    if (pagina && pagina.id) {
                      const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                      const csrfData = await csrfRes.json();
                      const csrfToken = csrfData.csrfToken;
                      await fetch(`/api/paginas/${pagina.id}/visibilidad-campos`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken
                        },
                        body: JSON.stringify(nuevo),
                        credentials: "include"
                      });
                    }
                  }} style={{ marginLeft: 8 }}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </select>
                </label>
              </div>
              <label style={{ marginRight: 16 }}>
                Oculto:
                <select value={oculto ? "1" : "0"} onChange={e => setOculto(e.target.value === "1")}
                  style={{ marginLeft: 8 }}>
                  <option value="0">No</option>
                  <option value="1">Sí</option>
                </select>
              </label>
              <label style={{ marginRight: 16 }}>
                <select
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="visible">Visible</option>
                  <option value="oculto">Oculto</option>
                </select>
                Descripción
              </label>
              <label style={{ marginRight: 16 }}>
                Usuario: <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} style={{ marginLeft: 8 }} />
              </label>
              <label style={{ marginRight: 16 }}>
                Comentarios resumen: <input type="text" value={comentariosResumen} onChange={e => setComentariosResumen(e.target.value)} style={{ marginLeft: 8 }} />
              </label>
              {visError && <div style={{ color: "red" }}>{visError}</div>}
              {visSuccess && <div style={{ color: "green" }}>{visSuccess}</div>}
            </form>
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
          {/* Botón para cerrar sesión */}
          {esDueno && (
            <div style={{ marginTop: 32, display: 'flex', gap: '16px' }}>
              <button
                onClick={async () => {
                  try {
                    // Obtener el token CSRF
                    const csrfRes = await fetch("/api/csrf-token", { credentials: "include" });
                    const csrfData = await csrfRes.json();
                    const csrfToken = csrfData.csrfToken;
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                      },
                      credentials: "include"
                    });
                    setAuthUserId(null); // Limpiar autenticación
                    window.location.href = "/";
                  } catch {
                    alert("Error al cerrar sesión");
                  }
                }}
                style={{ marginTop: 16, padding: "8px 20px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Cerrar sesión
              </button>
              <button
                onClick={handleDeleteProfile}
                style={{ marginTop: 16, padding: "8px 20px", background: "#b71c1c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Eliminar perfil y página
              </button>
            </div>
          )}
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