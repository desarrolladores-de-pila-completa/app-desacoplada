import React from "react";
const API_URL = "http://localhost:3000";

function FotoPerfil({ user, setUser, editable, authUserId, id }) {
  const inputRef = React.useRef();
  const [preview, setPreview] = React.useState(() => {
    const nombre = user?.username || user?.email || "Usuario";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}`;
  });
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    async function fetchFoto() {
      if (!id) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/user/${id}/foto`);
        if (res.ok) {
          const blob = await res.blob();
          setPreview(URL.createObjectURL(blob));
        } else {
          const nombre = user?.username || user?.email || "Usuario";
          setPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}`);
        }
      } catch {
        const nombre = user?.username || user?.email || "Usuario";
        setPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}`);
      }
    }
    fetchFoto();
  }, [id, user?.username, user?.email]);

  const handleClick = () => {
    if (editable && inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  const handleChange = async (e) => {
    setMsg("");
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("foto", file);
    try {
      const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      const res = await fetch(`${API_URL}/api/auth/me/foto`, {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
        body: formData
      });
      if (res.ok) {
        const blob = await res.blob();
        setPreview(URL.createObjectURL(blob));
        setMsg("Foto de perfil actualizada correctamente.");
      } else {
        setError("Error al subir la foto de perfil.");
      }
    } catch {
      setError("Error de red al subir la foto.");
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setUser && setUser((prev) => ({ ...prev, fotoPerfil: ev.target.result }));
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <img
        src={preview}
        alt="Foto de perfil"
        style={{
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          objectFit: "cover",
          borderRadius: "50%",
          border: editable ? "3px solid #1976d2" : "2px solid #ccc",
          boxShadow: editable ? "0 0 8px #1976d2" : undefined,
          display: "block",
          margin: "0 auto 12px auto",
          cursor: editable ? "pointer" : "default",
          transition: "box-shadow 0.2s, border 0.2s"
        }}
        onClick={editable ? handleClick : undefined}
        title={editable ? "Haz clic para cambiar la foto" : undefined}
        onMouseOver={e => {
          if (editable) e.currentTarget.style.boxShadow = "0 0 16px #1976d2";
        }}
        onMouseOut={e => {
          if (editable) e.currentTarget.style.boxShadow = "0 0 8px #1976d2";
        }}
      />
      {editable && (
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleChange}
        />
      )}
      {msg && <div style={{ color: 'green', marginTop: 8 }}>{msg}</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default FotoPerfil;
