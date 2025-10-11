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
  const params = useParams();
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Determinar el path para la API
  let path;
  if (params.username && params.pagina && params.pagina.match(/^\d+$/)) {
    // Si :pagina es numérico, es una publicación específica
    path = `${params.username}/publicar/${params.pagina}`;
  } else if (params.username && params.pagina) {
    // Para cualquier :pagina no numérico, devolver lista de páginas
    path = `${params.username}/list`;
  } else if (params.username) {
    // Ruta sin número de página: /:username/publicar -> usar página 1
    path = `${params.username}/1`;
  } else {
    path = '';
  }

  // Usar React Query para obtener datos
  const { data: paginaUser, isLoading: isLoadingPage, error: pageError } = useUserPage(path);
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
        <p>Cargando...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Error al cargar</h2>
        <p>{pageError.message}</p>
      </div>
    );
  }

  // Si es lista de páginas
  if (Array.isArray(paginaUser)) {
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>Páginas de {params.username}</h2>
        <ul>
          {paginaUser.map((page) => (
            <li key={page.id}>
              <h3>{page.titulo}</h3>
              <p>{page.contenido?.substring(0, 100)}...</p>
              <Link to={`/${params.username}/publicar/${page.id}`}>Ver página</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Si es una publicación específica
  if (paginaUser?.publicacion) {
    const pub = paginaUser.publicacion;
    return (
      <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002" }}>
        <h2>{pub.titulo}</h2>
        <p>{pub.contenido}</p>
        <p style={{ color: '#888', fontSize: '0.9em' }}>Publicado el {new Date(pub.created_at).toLocaleString()}</p>
      </div>
    );
  }

  // Si es página individual
  if (!paginaUser) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0002", textAlign: "center" }}>
        <h2>Página no encontrada</h2>
        <p>Esta página no existe.</p>
      </div>
    );
  }
  return (
  <>
    <Navbar />
    <div style={{    maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', marginTop: '80px' }}>
      <div style={{  maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <FotoPerfil user={authUser} setUser={() => {}} editable={authUser?.id === paginaUser?.user_id} authUserId={authUser?.id} id={paginaUser?.user_id || username} />
        </div>
        <UserHeader paginaUser={paginaUser} username={params.username} authUserId={authUser?.id} onUsernameChange={() => {}} />
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