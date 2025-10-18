import React from "react";
const API_URL = "http://localhost:3000";

function FotoPerfil({ user, setUser, editable, authUserId, id, fotoPerfil }) {
  const inputRef = React.useRef();
  const [preview, setPreview] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Si se proporciona fotoPerfil directamente (base64), usarla
    if (fotoPerfil) {
      setPreview(fotoPerfil);
      return;
    }

    // Si no, hacer petición al servidor
    async function fetchFoto() {
      if (!id) return;
      try {
        const res = await fetch(`${API_URL}/api/auth/user/${id}/foto`);
        if (res.ok) {
          const blob = await res.blob();
          setPreview(URL.createObjectURL(blob));
        } else {
          setPreview("");
        }
      } catch {
        setPreview("");
      }
    }
    fetchFoto();
  }, [id, fotoPerfil]);

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
        setMsg("Foto de perfil actualizada correctamente.");
        // Volver a consultar la foto persistida en el backend
        if (id) {
          const fotoRes = await fetch(`${API_URL}/api/auth/user/${id}/foto`);
          if (fotoRes.ok) {
            const blob = await fotoRes.blob();
            setPreview(URL.createObjectURL(blob));
          }
        }
      } else {
        setError("Error al subir la foto de perfil.");
      }
    } catch {
      setError("Error de red al subir la foto.");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ textAlign: "left", marginBottom: 0 }}>
      {preview ? (
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
            margin: "0 0 12px 0",
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
      ) : (
        <div style={{
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: '#e0e0e0',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          color: '#888',
          margin: "0 0 12px 0"
        }}>
          <span>👤</span>
        </div>
      )}
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
