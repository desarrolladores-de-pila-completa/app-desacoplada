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
  const { id } = useParams();
  const [paginaUser, setPaginaUser] = React.useState(null);
  const [comentarios, setComentarios] = React.useState([]);
  const { authUser, authUserId } = useAuthUser();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  React.useEffect(() => {
    async function fetchPagina() {
      if (!id) return;
      try {
        const res = await fetch(`${API_URL}/api/paginas?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          const pagina = Array.isArray(data) ? data[0] : null;
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
        } else {
          setPaginaUser(null);
          setComentarios([]);
        }
      } catch {
        setPaginaUser(null);
        setComentarios([]);
      }
    }
    fetchPagina();
  }, [id]);

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
      <p>Este usuario aún no ha creado su página personal o el enlace es incorrecto.</p>
      <img src="https://ui-avatars.com/api/?name=Usuario" alt="Avatar" style={{ width: 120, borderRadius: "50%", margin: "24px auto" }} />
    </div>
  );
  return (
    <div style={{ width: '100vw', maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', background: '#ffeeba', color: '#333', padding: '8px 24px', position: 'sticky', top: 0, zIndex: 999, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
        <strong>DEBUG:</strong> Ancho de la página: {windowSize.width}px | Margen izquierdo: {Math.round(windowSize.width * 0.1)}px | Margen derecho: {Math.round(windowSize.width * 0.1)}px
      </div>
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FotoPerfil user={authUser} setUser={() => {}} editable={String(authUserId) === String(paginaUser?.user_id)} authUserId={authUserId} id={id} />
        <UserHeader paginaUser={paginaUser} />
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
      </div>
    </div>
  );
}

export default UserPage;