import React from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
function UserHeader({ paginaUser, username, authUserId, onUsernameChange }) {
  const params = useParams();
  const [newUsername, setNewUsername] = React.useState(username || paginaUser?.username || "");

  // Sincronizar el nombre de usuario cuando cambian las props
  React.useEffect(() => {
    setNewUsername(username || paginaUser?.username || "");
  }, [username, paginaUser?.username]);
  const h2Ref = React.useRef(null);
  const isOwner = authUserId && paginaUser?.user_id && String(authUserId) === String(paginaUser.user_id);
  const navigate = useNavigate();

  const handleBlur = async (e) => {
    let value = "";
    if (e.target.value !== undefined) {
      value = e.target.value.trim(); // input
    } else if (e.target.innerText !== undefined) {
      value = e.target.innerText.trim(); // h2
    }
    if (!value || value === paginaUser?.username) {
      setNewUsername(paginaUser?.username || "");
      setEditMode(false);
      return;
    }
    try {
      const res = await fetch("/api/csrf-token", { credentials: "include" });
      const data = await res.json();
      const csrfToken = data.csrfToken;
      const resp = await fetch(`http://localhost:3000/api/paginas/${paginaUser.id}/usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ username: value }),
        credentials: "include"
      });
      if (resp.ok) {
        setNewUsername(value);
        setEditMode(false);
        alert("Nombre de usuario actualizado correctamente");
        // Navegar por el nuevo username sanitizado
        const sanitized = value.replace(/\s+/g, '-');
        navigate(`/pagina/${sanitized}`);
        if (typeof onUsernameChange === "function") {
          onUsernameChange(value);
        }
      } else {
        setNewUsername(paginaUser?.username || "");
        setEditMode(false);
        alert("Error al actualizar el nombre de usuario");
      }
    } catch (err) {
      setNewUsername(paginaUser?.username || "");
      setEditMode(false);
      alert("Error de conexión al actualizar el nombre");
    }
  };

  // Si el usuario borra el nombre, mostrar campo vacío (no "usuario")
  const [editMode, setEditMode] = React.useState(false);
  // Prioridad: nombre de la URL > nombre editado > datos de página > email > texto ayuda
  let displayName = params.username || newUsername;
  if (!displayName) displayName = "Haz click aquí para poner tu nombre";

  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editMode]);

  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      {isOwner && editMode ? (
        <input
          ref={inputRef}
          type="text"
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          onBlur={handleBlur}
          style={{
            fontSize: "2rem",
            textAlign: "center",
            border: "2px solid #1976d2",
            borderRadius: 8,
            padding: "4px 12px",
            width: "60%"
          }}
        />
      ) : (
        <h2
          ref={h2Ref}
          style={{
            cursor: isOwner ? "pointer" : "default",
            border: isOwner ? "2px solid #1976d2" : "none",
            borderRadius: isOwner ? 8 : 0,
            padding: isOwner ? "4px 12px" : "0",
            display: "inline-block",
            outline: "none",
            textAlign: "center"
          }}
          onClick={() => {
            if (isOwner) {
              // Al entrar en modo edición, inicializar el input con el nombre actual si está vacío
              setNewUsername(paginaUser?.usuario || paginaUser?.username || "");
              setEditMode(true);
            }
          }}
        >
          {displayName}
        </h2>
      )}
    </div>
  );
}

export default UserHeader;
