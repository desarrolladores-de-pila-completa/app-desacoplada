import React from "react";
const API_URL = "http://localhost:3000";




// Función simple para revocar URLs de objetos
const revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Error al revocar URL de objeto', { url, error });
    }
  }
};


function FotoPerfil({
  user,
  setUser,
  editable,
  authUserId,
  id,
  fotoPerfil
}) {
  const inputRef = React.useRef();
  const [preview, setPreview] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [error, setError] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  console.log('[FotoPerfil] Renderizando FotoPerfil', {
    editable,
    id,
    authUserId,
    userId: user?.id,
    hasInputRef: !!inputRef.current,
    isUploading,
    preview: preview ? 'presente' : 'ausente',
    previewUrl: preview,
    userFotoPerfil: user?.fotoPerfil
  });



  React.useEffect(() => {
    console.log('[FotoPerfil] useEffect activado para id:', id, 'fotoPerfil:', fotoPerfil);
    // Si se proporciona fotoPerfil directamente, usarla
    if (fotoPerfil) {
      console.log('[FotoPerfil] Usando fotoPerfil proporcionada:', fotoPerfil);
      if (preview && preview.startsWith('blob:')) {
        revokeObjectURL(preview);
      }
      setPreview(fotoPerfil);
      return;
    }

    // Hacer petición al servidor sin caché
    async function fetchFoto() {
      if (!id) {
        console.warn('No se pudo obtener foto: ID de usuario no válido', { id });
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/user/${id}/foto?t=${Date.now()}`);
        console.log('[FotoPerfil] Respuesta del fetch inicial:', res.status, res.ok);
        if (res.ok) {
          const blob = await res.blob();
          const previewUrl = URL.createObjectURL(blob);
          console.log('[FotoPerfil] Nueva preview URL creada:', previewUrl);

          if (preview && preview.startsWith('blob:')) {
            revokeObjectURL(preview);
          }

          setPreview(previewUrl);
          console.log('[FotoPerfil] Preview actualizada en useEffect');
        } else {
          setPreview("");
        }
      } catch (error) {
        console.error('Error al obtener foto de perfil', error);
        setPreview("");
      }
    }
    fetchFoto();
  }, [id, fotoPerfil]);

  // Auto-ocultar mensajes después de 4 segundos
  React.useEffect(() => {
    if (msg) {
      console.log('[FotoPerfil] Programando auto-ocultado de mensaje de éxito en 4s');
      const timer = setTimeout(() => {
        console.log('[FotoPerfil] Auto-ocultando mensaje de éxito');
        setMsg("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  React.useEffect(() => {
    if (error) {
      console.log('[FotoPerfil] Programando auto-ocultado de mensaje de error en 5s');
      const timer = setTimeout(() => {
        console.log('[FotoPerfil] Auto-ocultando mensaje de error');
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  const handleClick = () => {
    console.log('[FotoPerfil] Clic en foto detectado', { editable, hasInputRef: !!inputRef.current, isUploading });
    if (editable && inputRef.current) {
      console.log('[FotoPerfil] Abriendo selector de archivos');
      inputRef.current.value = "";
      inputRef.current.click();
    } else {
      console.log('[FotoPerfil] No se puede abrir selector: editable=', editable, 'inputRef=', !!inputRef.current);
    }
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;


    // Código simplificado
    console.log('[FotoPerfil] Limpiando mensajes anteriores');
    setMsg("");
    setError("");

    // Validar ID del usuario antes de proceder
    if (!id) {
      console.log('[FotoPerfil] Error establecido: ID de usuario no válido');
      setError("ID de usuario no válido. No se puede subir la foto.");
      return;
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('[FotoPerfil] Error establecido: Archivo demasiado grande');
      setError("El archivo es demasiado grande. Máximo 5MB permitido.");
      return;
    }

    setIsUploading(true);

    try {
      // Crear FormData con la imagen original
      const formData = new FormData();
      formData.append("photo", file, file.name);

      // Subir foto sin CSRF
      const res = await fetch(`${API_URL}/api/pagina/${user.username}/foto`, {
        method: "PUT",
        credentials: "include",
        body: formData
      });

      if (res.ok) {
        console.log('[FotoPerfil] Mensaje de éxito establecido:', "Foto de perfil actualizada correctamente.");
        setMsg("Foto de perfil actualizada correctamente.");

        // Recargar foto directamente
        const refreshRes = await fetch(`${API_URL}/api/auth/user/${id}/foto?t=${Date.now()}`);
        console.log('[FotoPerfil] Respuesta del fetch de refresco:', refreshRes.status, refreshRes.ok);
        if (refreshRes.ok) {
          const blob = await refreshRes.blob();
          const previewUrl = URL.createObjectURL(blob);
          console.log('[FotoPerfil] Nueva preview URL después de subida:', previewUrl);

          if (preview && preview.startsWith('blob:')) {
            revokeObjectURL(preview);
          }

          setPreview(previewUrl);
          console.log('[FotoPerfil] Preview actualizada después de subida');

          // Actualizar estado global
          if (setUser && typeof setUser === 'function') {
            setUser(prevUser => {
              const newUser = {
                ...prevUser,
                fotoPerfil: previewUrl
              };
              console.log('[FotoPerfil] Estado global actualizado:', newUser);
              return newUser;
            });
          } else {
            console.warn('[FotoPerfil] setUser no disponible o no es función');
          }
        } else {
          console.error('[FotoPerfil] Error en fetch de refresco:', refreshRes.status);
        }
      } else {
        console.log('[FotoPerfil] Error establecido: Error al subir foto', { status: res.status });
        setError(`Error al subir la foto de perfil: ${res.status === 413 ? 'Archivo demasiado grande' : 'Error del servidor'}`);
      }
    } catch (error) {
      console.error('Error durante subida de foto', error);
      console.log('[FotoPerfil] Error establecido: Error de conexión');
      setError("Error de conexión al subir la foto. Verifica tu conexión a internet.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };


  return (
    <div style={{ textAlign: "left", marginBottom: 0, position: 'relative' }}>
      {/* Indicador de carga durante subida */}
      {isUploading && (
        <div style={{
          position: 'absolute',
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: 'rgba(0, 0, 0, 0.6)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: '#fff',
          zIndex: 10,
          margin: "0 0 12px 0"
        }}>
          <span>⏳</span>
        </div>
      )}


      {preview ? (
        <img
          key={preview}
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
            cursor: editable && !isUploading ? "pointer" : "default",
            transition: "box-shadow 0.2s, border 0.2s",
            opacity: isUploading ? 0.7 : 1,
            filter: isUploading ? 'grayscale(50%)' : 'none'
          }}
          onClick={editable && !isUploading ? handleClick : undefined}
          title={editable && !isUploading ? "Haz clic para cambiar la foto" : isUploading ? "Subiendo foto..." : undefined}
          onMouseOver={e => {
            if (editable && !isUploading) e.currentTarget.style.boxShadow = "0 0 16px #1976d2";
          }}
          onMouseOut={e => {
            if (editable && !isUploading) e.currentTarget.style.boxShadow = "0 0 8px #1976d2";
          }}
        />
      ) : (
        <div style={{
          width: 'clamp(80px, 22vw, 120px)',
          height: 'clamp(80px, 22vw, 120px)',
          borderRadius: "50%",
          background: isUploading ? '#b0b0b0' : '#e0e0e0',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          color: isUploading ? '#666' : '#888',
          margin: "0 0 12px 0",
          transition: "background-color 0.2s, color 0.2s"
        }}>
          <span>{isUploading ? '⏳' : '👤'}</span>
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
      {msg && (
        <div className="toast-enter" style={{
          position: 'fixed',
          top: error ? '90px' : '20px',
          right: '20px',
          color: 'green',
          padding: '12px 16px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #4caf50',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {console.log('[FotoPerfil] Renderizando mensaje de éxito flotante:', msg)}
          ✅ {msg}
        </div>
      )}
      {error && (
        <div className="toast-enter" style={{
          position: 'fixed',
          top: msg ? '90px' : '20px',
          right: '20px',
          color: 'red',
          padding: '12px 16px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          border: '1px solid #f44336',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {console.log('[FotoPerfil] Renderizando mensaje de error flotante:', error)}
          ❌ {error}
        </div>
      )}
      {isUploading && (
        <div style={{
          color: '#1976d2',
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          border: '1px solid #1976d2',
          fontSize: '14px'
        }}>
          ⏳ Subiendo foto de perfil...
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes slideInRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .refreshing-overlay {
          animation: spin 1s linear infinite;
        }

        .recent-update-indicator {
          animation: fadeInOut 2s ease-in-out;
        }

        .toast-enter {
          animation: slideInRight 0.3s ease-out;
        }

        .toast-exit {
          animation: slideOutRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default FotoPerfil;