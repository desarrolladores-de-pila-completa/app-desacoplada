import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageGrid from "./ImageGrid";
import FotoPerfil from "./FotoPerfil";
import UserHeader from "./UserHeader";
import ComentariosList from "./ComentariosList";
import AgregarComentario from "./AgregarComentario";
import useAuthUser from "../hooks/useAuthUser";
const API_URL = "http://localhost:3000";

function UserPage() {
  // Logout y recarga tras cambio de nombre
  // Ya no se hace logout ni redirección aquí, solo actualizar estado si es necesario
  const handleUsernameChange = (nuevoNombre) => {
    // Si necesitas actualizar algún estado, hazlo aquí
  };
  // Borrado de usuario
  const handleDeleteUser = async () => {
    if (!paginaUser?.user_id || String(authUserId) !== String(paginaUser.user_id)) return;
    if (!window.confirm("¿Seguro que quieres borrar tu perfil y todo tu rastro? Esta acción es irreversible.")) return;
    try {
      // Obtener token CSRF
      const csrfRes = await fetch(`${API_URL}/api/csrf-token`, { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      const res = await fetch(`${API_URL}/api/paginas/usuario/${paginaUser.user_id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": csrfToken
        }
      });
      if (res.ok) {
        alert("Tu perfil y todos tus datos han sido eliminados.");
        window.location.href = "/";
      } else {
        alert("Error al borrar el usuario.");
      }
    } catch {
      alert("Error de conexión al borrar el usuario.");
    }
  };
  const { id, username } = useParams();
  const [paginaUser, setPaginaUser] = React.useState(null);
  const [comentarios, setComentarios] = React.useState([]);
  const { authUser, authUserId } = useAuthUser();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  React.useEffect(() => {
    async function fetchPagina() {
      let pagina = null;
      try {
        if (id) {
          // Consulta por user_id (UUID sin guiones) usando /pagina/{user_id}
          const res = await fetch(`${API_URL}/api/paginas/${id}`);
          if (res.ok) {
            pagina = await res.json();
          }
        } else if (username) {
          // Consulta por username (nuevo endpoint)
          const res = await fetch(`${API_URL}/api/paginas/pagina/${username}`);
          if (res.ok) {
            pagina = await res.json();
          }
        }
        setPaginaUser(pagina);
        if (pagina && pagina.id) {
          const comentariosRes = await fetch(`${API_URL}/api/paginas/${pagina.id}/comentarios`);
          if (comentariosRes.ok) {
            const comentariosData = await comentariosRes.json();
            setComentarios(comentariosData);
          } else {
            setComentarios([]);
          }
        } else {
          setComentarios([]);
        }
      } catch {
        setPaginaUser(null);
        setComentarios([]);
      }
    }
    fetchPagina();
  }, [id, username]);

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  if (!paginaUser) return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
      <h2>Página de usuario no encontrada</h2>
      <p>Este usuario aún no ha creado su página o el enlace es incorrecto.</p>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: '#e0e0e0',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
        color: '#888',
        margin: "24px auto"
      }}>
        <span>👤</span>
      </div>
    </div>
  );
  return (
  <div style={{ width: '100vw', maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', background: '#ffeeba', color: '#333', padding: '8px 24px', position: 'sticky', top: 0, zIndex: 999, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
        <strong>DEBUG:</strong> Ancho de la página: {windowSize.width}px | Margen izquierdo: {Math.round(windowSize.width * 0.1)}px | Margen derecho: {Math.round(windowSize.width * 0.1)}px
      </div>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FotoPerfil user={authUser} setUser={() => {}} editable={String(authUserId) === String(paginaUser?.user_id)} authUserId={authUserId} id={paginaUser?.user_id || id || username} />
        <UserHeader paginaUser={paginaUser} username={paginaUser?.usuario} authUserId={authUserId} onUsernameChange={handleUsernameChange} />
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <ImageGrid paginaId={paginaUser?.id} editable={String(authUserId) === String(paginaUser?.user_id)} />
        </div>
        <div style={{ marginTop: 32, width: '100%' }}>
          {authUserId ? (
            <AgregarComentario paginaId={paginaUser.id} />
          ) : (
            <div style={{ color: '#888', marginTop: 16 }}>
              Debes iniciar sesión para agregar un comentario.
            </div>
          )}
          <ComentariosList comentarios={comentarios} />
        </div>
        {/* Botón de borrado al final */}
        {String(authUserId) === String(paginaUser?.user_id) && (
          <button
            onClick={handleDeleteUser}
            style={{
              background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', marginTop: 48, fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem', alignSelf: 'center'
            }}
          >
            Borrar mi perfil y todos mis datos
          </button>
        )}
      </div>
    </div>
  );
}

export default UserPage;