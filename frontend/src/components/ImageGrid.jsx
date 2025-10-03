import React, { useRef, useState, useEffect } from "react";

const GRID_ROWS = 3;
const GRID_COLS = 6;
const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

function ImageGrid({ paginaId }) {
  const [images, setImages] = useState(Array(TOTAL_CELLS).fill(null));
  const fileInputs = useRef([]);
  // Cargar imágenes guardadas en el backend
  useEffect(() => {
    if (!paginaId) return;
    fetch(`/api/paginas/${paginaId}/imagenes`)
      .then(res => res.json())
      .then(data => {
        const imgs = Array(TOTAL_CELLS).fill(null);
        data.forEach(img => {
          if (img.idx >= 0 && img.idx < TOTAL_CELLS) {
            imgs[img.idx] = img.src;
          }
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
    } catch {}
    // Subir imagen al backend
    const formData = new FormData();
    formData.append("imagen", file);
    formData.append("index", index);
    fetch(`/api/paginas/${paginaId}/imagenes`, {
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
    <div style={{ marginTop: 32 }}>
      <h3>Galería de imágenes</h3>
      <div style={{
        display: "grid",
        gridTemplateRows: `repeat(${GRID_ROWS}, 120px)`,
        gridTemplateColumns: `repeat(${GRID_COLS}, 120px)`,
        gap: "12px",
        justifyContent: "center"
      }}>
        {images.map((img, idx) => (
          <div key={idx} style={{
            border: "2px solid #1976d2",
            borderRadius: 8,
            background: "#f7f7f7",
            width: "120px",
            height: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            {img ? (
              <img src={img} alt={`Imagen ${idx + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }} />
            ) : (
              <button
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: "8px 12px", borderRadius: 6, background: "#1976d2", color: "#fff", border: "none", cursor: "pointer" }}
                onClick={() => fileInputs.current[idx].click()}
              >
                Subir
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={el => fileInputs.current[idx] = el}
              onChange={e => handleImageChange(idx, e)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGrid;
