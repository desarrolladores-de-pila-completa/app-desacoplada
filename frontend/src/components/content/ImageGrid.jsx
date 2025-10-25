import React, { useRef, useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { createRoot } from "react-dom/client";
import WinBox from "winbox/src/js/winbox.js";
import "winbox/dist/css/winbox.min.css";
import { API_BASE } from "../../config/api.js";

// Hook para obtener datos de la página del usuario
const useUserPage = (path) => {
  return useQuery({
    queryKey: ['userPage', path],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/pagina/${path}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Error fetching user page: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!path,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.message === 'User not found') return false;
      return failureCount < 3;
    },
  });
};

const GRID_ROWS = 3;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

function ImageGrid({ username, editable, images: externalImages }) {
  const [images, setImages] = useState([]);
  const fileInputs = useRef([]);

  // Usar hook para obtener datos si no hay imágenes externas
  const { data: pageData, refetch } = useUserPage(username);

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
  // Cargar imágenes desde el hook useUserPage o imágenes externas
  useEffect(() => {
    // Si se proporcionan imágenes externas (desde nueva estructura), usarlas directamente
    if (externalImages && externalImages.length > 0) {
      setImages(externalImages);
      return;
    }

    // Si no, usar datos del hook useUserPage
    if (pageData?.galeria && username) {
      // Convertir el array de galería al formato esperado por el componente
      const imgs = [];
      pageData.galeria.forEach(img => {
        imgs[img.idx] = img.src;
      });
      setImages(imgs);
    } else {
      setImages([]);
    }
  }, [username, externalImages, pageData]);

  const handleImageChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file || !username) return;

    // Crear FormData para subir la imagen
    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("index", index);

    try {
      // Obtener token CSRF usando el endpoint estándar
      const csrfResponse = await fetch(`${API_BASE}/csrf-token`, { credentials: "include" });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;

      // Subir imagen usando la API estándar
      const uploadResponse = await fetch(`${API_BASE}/paginas/${username}/imagenes`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken
        },
        body: formData,
        credentials: "include"
      });

      if (uploadResponse.ok) {
        // Refrescar los datos usando el hook useUserPage
        refetch();
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: '0 2vw' }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 'clamp(12px, 3vw, 24px)' }}>
        <h3 style={{ textAlign: "center", marginBottom: 24, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>Galería de imágenes</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "clamp(8px, 2vw, 16px)"
        }}>
          {images.map((img, idx) => (
            <div key={idx} style={{
              aspectRatio: "1",
              border: "2px solid #1976d2",
              borderRadius: 8,
              background: "#f7f7f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <img
                src={img}
                alt={`Imagen ${idx + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                onClick={() => openImageInWinBox(img, `Imagen ${idx + 1}`)}
              />
            </div>
          ))}
          {editable && (
            <div style={{
              aspectRatio: "1",
              border: "2px dashed #1976d2",
              borderRadius: 8,
              background: "#f7f7f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <button
                style={{ padding: "8px 12px", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none", cursor: "pointer", fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}
                onClick={() => fileInputs.current[images.length]?.click()}
              >
                Subir
              </button>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={el => fileInputs.current[images.length] = el}
                onChange={e => handleImageChange(images.length, e)}
                disabled={!editable}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageGrid;
