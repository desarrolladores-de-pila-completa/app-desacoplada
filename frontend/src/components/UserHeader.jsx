import React from "react";
function UserHeader({ paginaUser, username, authUserId }) {
  const [newUsername, setNewUsername] = React.useState(username || paginaUser?.username || "");
  const h2Ref = React.useRef(null);
  const isOwner = authUserId && paginaUser?.user_id && String(authUserId) === String(paginaUser.user_id);

  const handleBlur = async (e) => {
    let value = "";
    if (e.target.value !== undefined) {
      value = e.target.value.trim(); // input
    } else if (e.target.innerText !== undefined) {
      value = e.target.innerText.trim(); // h2
    }
    if (value !== paginaUser?.username) {
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
          body: JSON.stringify({ usuario: value }),
          credentials: "include"
        });
        if (resp.ok) {
          setNewUsername(value);
        } else {
          setNewUsername(paginaUser?.username || "");
        }
      } catch (err) {
        setNewUsername(paginaUser?.username || "");
      }
    } else {
      setNewUsername(paginaUser?.username || "");
    }
  };

  // Si el usuario borra el nombre, mostrar campo vacío (no "usuario")
  const [editMode, setEditMode] = React.useState(false);
  let displayName = newUsername;
  if (!displayName && paginaUser?.email) displayName = paginaUser.email;

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
          onBlur={async (e) => {
            setEditMode(false);
            await handleBlur(e);
          }}
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
          onClick={() => { if (isOwner) setEditMode(true); }}
        >
          {displayName}
        </h2>
      )}
    </div>
  );
}

export default UserHeader;
