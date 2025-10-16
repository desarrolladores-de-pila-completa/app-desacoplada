import React from "react";
import { Link } from "react-router-dom";
import { createRoot } from "react-dom/client";
import WinBox from "winbox/src/js/winbox.js";
import "winbox/dist/css/winbox.min.css";
import useAuthStore from "../stores/authStore";
import { useDeleteComment } from "../hooks/useFeed";

function formatUUID(uuid) {
  if (!uuid || uuid.length !== 32) return uuid;
  return `${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`;
}

function ComentariosList({ comentarios, pageId }) {
  const { user } = useAuthStore();
  const deleteCommentMutation = useDeleteComment();

  const openImageInWinBox = (src, alt) => {
    const maxWidth = window.innerWidth * 0.9;
    const maxHeight = window.innerHeight * 0.8;
    const winbox = new WinBox({
      title: alt || "Imagen",
      width: Math.min(800, maxWidth),
      height: Math.min(600, maxHeight),
      x: 'center',
      y: 'center',
      drag: true,
      keys: true,
    });
    winbox.body.innerHTML = `<img src="${src}" alt="${alt}" style="width: 100%; height: 100%; object-fit: contain;" />`;
  };

  const processCommentHTML = (html) => {
    // Replace img tags with clickable versions
    return html.replace(/<img([^>]+)>/g, (match, attrs) => {
      const srcMatch = attrs.match(/src="([^"]+)"/);
      const altMatch = attrs.match(/alt="([^"]*)"/);
      const src = srcMatch ? srcMatch[1] : '';
      const alt = altMatch ? altMatch[1] : '';
      return `<img${attrs} onclick="window.commentImageClick && window.commentImageClick('${src}', '${alt}')" style="cursor: pointer;" />`;
    });
  };

  React.useEffect(() => {
    window.commentImageClick = openImageInWinBox;
    return () => {
      delete window.commentImageClick;
    };
  }, []);

  const handleDelete = async (commentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      try {
        await deleteCommentMutation.mutateAsync({ pageId, commentId });
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error al eliminar el comentario');
      }
    }
  };
  return (
    <div style={{ marginTop: 24 }}>
      <h4>Comentarios({comentarios.length}):</h4>
      {comentarios.length === 0 ? (
        <div style={{ color: '#888' }}>No hay comentarios aún.</div>
      ) : (
        comentarios.map(com => (
          <div key={com.id} className="comentario" style={{ position: 'relative' }}>
            {user && user.id === com.user_id && (
              <button
                onClick={() => handleDelete(com.id)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  width: 20,
                  height: 20,
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Eliminar comentario"
              >
                ×
              </button>
            )}
            <div style={{ background: '#f7f7f7', margin: '8px 0', padding: '12px', borderRadius: 6, wordWrap: 'break-word' }}>
              <div dangerouslySetInnerHTML={{ __html: processCommentHTML(com.comentario) }}></div>
              <div style={{ fontSize: '0.9em', color: '#555' }}>
                Publicado por: {com.user_id ? (
                  <Link to={com.username ? `/pagina/${encodeURIComponent(com.username.replace(/\s+/g, '-'))}` : `/pagina/${encodeURIComponent(com.user_id.replace(/-/g, ""))}`} style={{ color: '#007bff', textDecoration: 'underline' }}>
                    {com.username || com.user_id}
                  </Link>
                ) : 'Anónimo'}
                {' | '}
                {new Date(com.creado_en).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ComentariosList;
