import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createRoot } from "react-dom/client";
import WinBox from "winbox/src/js/winbox.js";
import "winbox/dist/css/winbox.min.css";
import imageCompression from 'browser-image-compression';
import authService from "../../services/authService";
import { API_BASE } from '../../config/api';

function AgregarComentario({ paginaId, createCommentMutation, username }) {
  const isAuthenticated = authService.isLoggedIn();
  const [comentario, setComentario] = useState("");
  const [uploading, setUploading] = useState(false);
  const rootRef = useRef();
  const winboxRef = useRef();

  // Actualizar el formulario en el WinBox cuando cambie el estado
  useEffect(() => {
    if (rootRef.current && winboxRef.current) {
      // Preservar el foco del textarea antes de re-renderizar
      const activeElement = winboxRef.current.body.querySelector('textarea');
      const selectionStart = activeElement?.selectionStart;
      const selectionEnd = activeElement?.selectionEnd;
      
      rootRef.current.render(<Formulario />);
      
      // Restaurar el foco y posición del cursor después de re-renderizar
      if (activeElement && typeof selectionStart === 'number') {
        setTimeout(() => {
          const newTextarea = winboxRef.current.body.querySelector('textarea');
          if (newTextarea) {
            newTextarea.focus();
            newTextarea.setSelectionRange(selectionStart, selectionEnd);
          }
        }, 0);
      }
    }
  }, [comentario, uploading, createCommentMutation.isPending, createCommentMutation.isSuccess, createCommentMutation.isError]);

  // Función auxiliar para obtener CSRF token
  async function getCsrfToken() {
    const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
    const data = await res.json();
    return data.csrfToken;
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Opciones de compresión de imagen
      const options = {
        maxSizeMB: 1, // Máximo 1MB
        maxWidthOrHeight: 1200, // Máximo 1200px en ancho o alto
        useWebWorker: true, // Usar web worker para mejor rendimiento
        fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
      };

      // Comprimir la imagen
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagen original: ${file.size / 1024 / 1024} MB`);
      console.log(`Imagen comprimida: ${compressedFile.size / 1024 / 1024} MB`);

      const csrfToken = await getCsrfToken();
      const formData = new FormData();
      formData.append('upload', compressedFile);
      const response = await fetch(`${API_BASE}/upload-comment-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setComentario(prev => prev + (prev ? '\n' : '') + `<img src="${data.url}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 6px; cursor: pointer;" />\n`);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comentario.trim()) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        pageId: paginaId,
        comentario: comentario.trim(),
        username: username
      });

      setComentario("");
    } catch (error) {
      // El error ya se maneja en el mutation
      console.error('Error creating comment:', error);
    }
  };

  const Formulario = () => (
    <div style={{ boxSizing: 'border-box', background: '#f7f7f7', borderRadius: 8, padding: 8, direction: 'ltr', unicodeBidi: 'normal' }}>
      <label>Agregar comentario:</label>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Escribe tu comentario"
        rows={6}
        autoFocus
        dir="ltr"
        style={{ width: '100%', padding: 8, boxSizing: 'border-box', resize: 'none', textAlign: 'left', unicodeBidi: 'normal' }}
      ></textarea>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
        style={{ marginBottom: 8 }}
      />
      {uploading && <div>Subiendo imagen...</div>}
      <button
        onClick={handleSubmit}
        disabled={createCommentMutation.isPending || !comentario.trim()}
        style={{ width: 120, alignSelf: 'center', marginTop: 8 }}
      >
        {createCommentMutation.isPending ? "Agregando..." : "Agregar"}
      </button>
      {createCommentMutation.isSuccess && (
        <div style={{ color: "green", marginTop: 8, textAlign: 'center' }}>Comentario agregado!</div>
      )}
      {createCommentMutation.isError && (
        <div style={{ color: "red", marginTop: 8 }}>
          Error al agregar comentario
        </div>
      )}
    </div>
  );

  const abrirWinBox = () => {
    if (!rootRef.current) {
      const winbox = new WinBox({
        title: "Agregar Comentario",
        width: 600,
        height: 400,
        x: 'center',
        y: 'center',
        drag: false,
        keys: false,
        dir: 'ltr',
        onclose: () => {
          rootRef.current = null;
          winboxRef.current = null;
        },
      });
      winboxRef.current = winbox;
      winbox.body.innerHTML = '';
      winbox.body.style.direction = 'ltr';
      winbox.body.dir = 'ltr';
      const style = document.createElement('style');
      style.textContent = '* { direction: ltr !important; }';
      winbox.body.appendChild(style);
      const root = createRoot(winbox.body);
      rootRef.current = root;
      root.render(<Formulario />);
      setTimeout(() => {
        const input = winbox.body.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 100);
    }
  };
  
  if (!isAuthenticated) {
    return <div style={{ color: '#888', marginTop: 16 }}>Debes <Link to="/login">iniciar sesión</Link> para agregar un comentario.</div>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <a href="#" onClick={(e) => { e.preventDefault(); abrirWinBox(); }} style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
        Agregar comentario
      </a>
    </div>
  );
}

export default AgregarComentario;
