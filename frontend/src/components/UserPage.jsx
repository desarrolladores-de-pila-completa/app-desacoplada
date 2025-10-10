import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import ImageGrid from "./ImageGrid";
import FotoPerfil from "./FotoPerfil";
import UserHeader from "./UserHeader";
import ComentariosList from "./ComentariosList";
import AgregarComentario from "./AgregarComentario";
import useAuthStore from "../stores/authStore";
import { useUserPage, useComments } from "../hooks/useFeed";

function UserPage() {
  const { username } = useParams();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Usar React Query para obtener datos
  const { data: paginaUser, isLoading: isLoadingPage, error: pageError } = useUserPage(username);
  const { data: comentarios = [], isLoading: isLoadingComments } = useComments(paginaUser?.id);

  // Borrado de usuario
  const handleDeleteUser = async () => {
    if (!paginaUser?.user_id || authUser?.id !== paginaUser.user_id) return;
    if (!window.confirm("¿Seguro que quieres borrar tu perfil y todo tu rastro? Esta acción es irreversible.")) return;

    try {
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      const res = await fetch(`/api/auth/user/${paginaUser.user_id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken
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

  if (isLoadingPage) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <p>Cargando página...</p>
      </div>
    );
  }

  if (pageError || !paginaUser) {
    return (
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
  }
  return (
  <>
    <Navbar />
    <div style={{    maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', marginTop: '80px' }}>
      <div style={{  maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FotoPerfil user={authUser} setUser={() => {}} editable={authUser?.id === paginaUser?.user_id} authUserId={authUser?.id} id={paginaUser?.user_id || username} />
        <UserHeader paginaUser={paginaUser} username={paginaUser?.usuario} authUserId={authUser?.id} onUsernameChange={() => {}} />
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
          <ImageGrid paginaId={paginaUser?.id} editable={authUser?.id === paginaUser?.user_id} />
        </div>
        <div style={{ marginTop: 32 }}>
          {isAuthenticated ? (
            <AgregarComentario paginaId={paginaUser.id} />
          ) : (
            <div style={{ color: '#888', marginTop: 16 }}>
              Debes <Link to="/login">iniciar sesión</Link> para agregar un comentario.
            </div>
          )}
          <ComentariosList comentarios={comentarios} pageId={paginaUser.id} />
        </div>
      </div>
      {/* Botón de borrado al final */}
      {authUser?.id === paginaUser?.user_id && (
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
  </>
  );
}

export default UserPage;