import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import ImageGrid from "./ImageGrid";
import FotoPerfil from "./FotoPerfil";
import UserHeader from "./UserHeader";
import ComentariosList from "./ComentariosList";
import AgregarComentario from "./AgregarComentario";
import ContentRenderer from "./ContentRenderer";
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

  // Renderizar contenido HTML mejorado con el nuevo sistema
  const renderContent = (content) => {
    if (!content) return null;

    console.log('🔍 [UserPage] Renderizando contenido con nuevo sistema:', {
      length: content.length,
      preview: content.substring(0, 200)
    });

    return (
      <ContentRenderer
        content={content}
        className="user-page-content"
        style={{
          lineHeight: '1.6',
          fontSize: '16px',
          color: '#333'
        }}
        options={{
          sanitize: true,
          processEntities: true,
          enhanceContent: true,
          allowHTML: true
        }}
        showDebugInfo={process.env.NODE_ENV === 'development'}
        onContentProcessed={(result) => {
          console.log('✅ [UserPage] Contenido procesado exitosamente:', {
            type: result.analysis.type,
            needsHTML: result.needsHTML,
            isSafe: result.isSafe,
            elementsCount: result.analysis.elements.length
          });
        }}
        onError={(error) => {
          console.error('❌ [UserPage] Error procesando contenido:', error);
        }}
      />
    );
  };
  return (
  <>
    <Navbar />
    <div style={{    maxWidth: '100vw', minHeight: windowSize.height, margin: 0, background: '#fff', padding: 'clamp(8px, 4vw, 24px)', borderRadius: 0, boxShadow: 'none', position: 'relative', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', marginTop: '80px' }}>
      <div style={{  maxWidth: 900, margin: '0 auto', boxSizing: 'border-box', padding: '0 5vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <FotoPerfil user={authUser} setUser={() => {}} editable={authUser?.id === paginaUser?.user_id} authUserId={authUser?.id} id={paginaUser?.user_id || username} />
          {/* Botón de prueba para debugging - SOLO PARA DESARROLLO */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                console.log('🧪 [TEST] Creando página de prueba con contenido HTML...');
                const testHtml = `
                  <h2>Título de Prueba</h2>
                  <p>Este es un párrafo de prueba con <strong>texto en negrita</strong> y <em>cursiva</em>.</p>
                  <ul>
                    <li>Elemento de lista 1</li>
                    <li>Elemento de lista 2</li>
                    <li>Elemento de lista 3</li>
                  </ul>
                  <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px;">
                    <p>Contenido con estilos CSS inline</p>
                  </div>
                  <p>Más contenido después del div.</p>
                `;

                // Simular datos de prueba
                const testData = {
                  titulo: 'Página de Prueba HTML',
                  contenido: testHtml,
                  created_at: new Date().toISOString()
                };

                console.log('📝 [TEST] Datos de prueba:', {
                  titulo: testData.titulo,
                  contenidoLength: testData.contenido.length,
                  hasHtmlTags: /<\/?[a-z][\s\S]*>/i.test(testData.contenido),
                  preview: testData.contenido.substring(0, 200)
                });
              }}
              style={{
                background: '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🧪 Test HTML
            </button>
          )}
        </div>
        <UserHeader paginaUser={paginaUser} username={params.username} authUserId={authUser?.id} onUsernameChange={() => {}} />

        {/* Mostrar contenido de la página si existe */}
        {paginaUser?.contenido && (
          <div style={{
            width: '100%',
            maxWidth: '100%',
            marginBottom: '32px',
            padding: '24px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>
              {paginaUser.titulo || 'Página'}
            </h3>
            <div style={{ marginBottom: '20px' }}>
              {(() => {
                console.log('📦 [DEBUG] Datos recibidos del backend:', {
                  titulo: paginaUser.titulo,
                  contenidoLength: paginaUser.contenido?.length,
                  contenidoPreview: paginaUser.contenido?.substring(0, 300),
                  contenidoType: typeof paginaUser.contenido,
                  hasContenido: !!paginaUser.contenido
                });
                return renderContent(paginaUser.contenido);
              })()}
            </div>
            <p style={{
              color: '#888',
              fontSize: '0.9em',
              marginTop: '16px',
              borderTop: '1px solid #e9ecef',
              paddingTop: '8px'
            }}>
              Publicado el {new Date(paginaUser.created_at).toLocaleString()}
            </p>
          </div>
        )}

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