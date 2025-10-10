import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { useCreateComment } from "../hooks/useFeed";
import TextEditor from "./TextEditor";

function AgregarComentario({ paginaId }) {
  const { isAuthenticated } = useAuthStore();
  const [comentario, setComentario] = React.useState("");
  const createCommentMutation = useCreateComment();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comentario.trim()) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        pageId: paginaId,
        comentario: comentario.trim()
      });

      setComentario("");
    } catch (error) {
      // El error ya se maneja en el mutation
      console.error('Error creating comment:', error);
    }
  };

  if (!isAuthenticated) {
    return <div style={{ color: '#888', marginTop: 16 }}>Debes <Link to="/login">iniciar sesión</Link> para agregar un comentario.</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ margin: '24px auto', width: 400, height: 300, maxWidth: 400, maxHeight: 300, minWidth: 400, minHeight: 300, boxSizing: 'border-box', background: '#f7f7f7', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <label>Agregar comentario:</label>
      <TextEditor
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Escribe tu comentario..."
        rows={8}
        style={{ height: 180, marginBottom: 8, resize: "none" }}
      />
      <button
        type="submit"
        disabled={createCommentMutation.isPending || !comentario.trim()}
        style={{ width: 120, alignSelf: 'center', marginTop: 8 }}
      >
        {createCommentMutation.isPending ? "Agregando..." : "Agregar"}
      </button>
      {createCommentMutation.isSuccess && (
        <div style={{ color: "green", marginTop: 8 }}>Comentario agregado!</div>
      )}
      {createCommentMutation.isError && (
        <div style={{ color: "red", marginTop: 8 }}>
          Error al agregar comentario
        </div>
      )}
    </form>
  );
}

export default AgregarComentario;
