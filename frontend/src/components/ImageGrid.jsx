const API_URL = "http://localhost:3000";
import React, { useRef, useState, useEffect } from "react";

const GRID_ROWS = 3;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

function ImageGrid({ paginaId, editable }) {
  const [images, setImages] = useState([]);
  const fileInputs = useRef([]);
  // Cargar imágenes guardadas en el backend
  useEffect(() => {
    setImages([]); // Limpiar imágenes al cambiar de usuario
    if (!paginaId) return;
    fetch(`/api/paginas/${paginaId}/imagenes`)
      .then(res => res.json())
      .then(data => {
        // Solo renderizar los que existen
        const imgs = [];
        data.forEach(img => {
          imgs[img.idx] = img.src;
        });
        setImages(imgs);
      })
      .catch(() => {});
  }, [paginaId]);

  const handleImageChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file || !paginaId) return;
    // Obtener token CSRF
    let csrfToken = "";
    try {
      const res = await fetch("/api/csrf-token", { credentials: "include" });
      const data = await res.json();
      csrfToken = data.csrfToken;
      console.log("[FRONTEND] Enviando CSRF token:", csrfToken);
    } catch {}
    // Subir imagen al backend
    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("index", index);
    fetch(`${API_URL}/api/paginas/${paginaId}/imagenes`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken
      },
      body: formData,
      credentials: "include"
    })
      .then(res => res.json())
      .then(() => {
        // Actualizar la cuadrícula tras subir
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImages = [...images];
          newImages[index] = e.target.result;
          setImages(newImages);
        };
        reader.readAsDataURL(file);
      });
  };

  return (
    <div style={{ width: "100%", maxWidth: 900, margin: "32px auto", display: "flex", justifyContent: "center", alignItems: "center", padding: '0 2vw', boxSizing: 'border-box' }}>
      <div style={{ width: "100%", background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #0001", padding: 'clamp(12px, 3vw, 24px)' }}>
        <h3 style={{ textAlign: "center", marginBottom: 24, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>Galería de imágenes</h3>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`,
          gridAutoRows: '120px',
          gap: "clamp(8px, 2vw, 16px)",
          justifyContent: "center",
          width: '100%'
        }}>
          {[...images, null].map((img, idx) => (
            idx < TOTAL_CELLS ? (
              <div key={idx} style={{
                border: "2px solid #1976d2",
                borderRadius: 8,
                background: "#f7f7f7",
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                maxWidth: 140,
                maxHeight: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative"
              }}>
                {img ? (
                  <img src={img} alt={`Imagen ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }} />
                ) : (
                  editable ? (
                    <button
                      style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: "8px 12px", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none", cursor: "pointer", fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}
                      onClick={() => fileInputs.current[idx].click()}
                    >
                      Subir
                    </button>
                  ) : (
                    <span style={{ color: '#888', fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>Solo el dueño puede subir imágenes</span>
                  )
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={el => fileInputs.current[idx] = el}
                  onChange={e => handleImageChange(idx, e)}
                  disabled={!editable}
                />
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageGrid;
