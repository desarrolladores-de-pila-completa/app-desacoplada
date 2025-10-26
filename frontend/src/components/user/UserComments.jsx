import React from "react";
import { Link } from "react-router-dom";
import ComentariosList from "../content/ComentariosList";
import AgregarComentario from "../content/AgregarComentario";

function UserComments({ paginaUser, comentarios, isAuthenticated, createCommentMutation, deleteCommentMutation, username }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: '32px',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e9ecef',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
      }}></div>

      <h3 style={{
        marginTop: '16px',
        marginBottom: '24px',
        color: '#2c3e50',
        fontSize: '1.3em',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💬 Comentarios
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {isAuthenticated ? (
          <div style={{
            padding: '20px',
            background: '#f8f9ff',
            borderRadius: '12px',
            border: '1px solid #e3e8ff'
          }}>
            <AgregarComentario paginaId={paginaUser?.pagina?.id} createCommentMutation={createCommentMutation} username={username} />
          </div>
        ) : (
          <div style={{
            padding: '20px',
            background: '#fff5f5',
            borderRadius: '12px',
            border: '1px solid #ffe3e3',
            textAlign: 'center',
            color: '#e74c3c'
          }}>
            🔒 Debes <Link to="/login" style={{ color: '#e74c3c', textDecoration: 'underline' }}>iniciar sesión</Link> para agregar un comentario.
          </div>
        )}

        <div style={{
          marginTop: '8px'
        }}>
          <ComentariosList comentarios={comentarios} pageId={paginaUser?.pagina?.id} deleteCommentMutation={deleteCommentMutation} username={username} />
        </div>
      </div>
    </div>
  );
}

export default UserComments;