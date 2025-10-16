import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import "./PageBuilder.css";

// Componente para mensaje de sesión expirada
const SessionExpiredMessage = ({ onClose }) => {
  return (
    <div className="session-expired-message">
      <div className="session-expired-content">
        <div className="session-expired-text">
          <strong className="session-expired-title">Sesión expirada</strong>
          <p className="session-expired-description">
            Tu sesión ha expirado. Por favor,
            <a href="/login" className="session-expired-link">
              inicia sesión nuevamente
            </a>
            .
          </p>
        </div>
        <button onClick={onClose} className="session-expired-close">
          ×
        </button>
      </div>
    </div>
  );
};

// Componente para el editor HTML
const HtmlEditor = ({ content, onSave, onClose, isOpen }) => {
  const [editorContent, setEditorContent] = useState(content);

  useEffect(() => {
    if (isOpen) {
      setEditorContent(content);
    }
  }, [isOpen, content]);

  const handleSave = useCallback(() => {
    onSave(editorContent);
    onClose();
  }, [editorContent, onSave, onClose]);

  const handleContentChange = useCallback((e) => {
    setEditorContent(e.target.value);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="html-editor-modal">
      <div className="html-editor-modal-content">
        <div className="html-editor-modal-header">
          <h3>Editor HTML</h3>
          <button onClick={onClose} className="html-editor-modal-close">
            ×
          </button>
        </div>
        <div className="html-editor-modal-body">
          <textarea
            value={editorContent}
            onChange={handleContentChange}
            className="html-editor-textarea"
            placeholder="Escribe tu HTML aquí..."
          />
          <div className="html-editor-modal-actions">
            <button onClick={onClose} className="html-editor-btn-cancel">
              Cancelar
            </button>
            <button onClick={handleSave} className="html-editor-btn-save">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para elemento editable
const EditableElement = ({
  element,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onUpdate,
}) => {
  const handleContentChange = (newContent) => {
    onUpdate(element.id, newContent);
  };

  const handleEdit = () => onEdit(element.id);
  const handleDelete = () => onDelete(element.id);
  const handleSave = onSave;

  return (
    <div className="editable-element">
      <div className="editable-element-header">
        <small className="editable-element-type">
          {element.type.toUpperCase()}
        </small>
        <div className="editable-element-actions">
          <button
            onClick={handleEdit}
            className="editable-element-btn-edit"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="editable-element-btn-delete"
          >
            🗑️
          </button>
        </div>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={element.content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="editable-element-editor"
          />
          <button onClick={handleSave} className="editable-element-save-btn">
            ✓ Guardar
          </button>
        </div>
      ) : (
        <div
          className="editable-element-preview"
          dangerouslySetInnerHTML={{ __html: element.html }}
        />
      )}
    </div>
  );
};

function PageBuilder() {
  const { username } = useParams();
  const { user } = useAuthStore();

  // All hooks must be called before any early returns
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Nueva Página");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elements, setElements] = useState([]);
  const [editingElement, setEditingElement] = useState(null);
  const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const editorRef = useRef(null);

  // Memoized element templates - moved after all state hooks
  const elementTemplates = useMemo(
    () => ({
      heading: {
        type: "heading",
        content: "Título de sección",
        html: `<h2 style="color: #333; margin: 20px 0;">Título de sección</h2>`,
      },
      paragraph: {
        type: "paragraph",
        content:
          "Este es un párrafo de texto. Puedes editar este contenido y agregar más párrafos según necesites.",
        html: `<p style="line-height: 1.6; margin: 10px 0;">Este es un párrafo de texto. Puedes editar este contenido y agregar más párrafos según necesites.</p>`,
      },
      image: {
        type: "image",
        content: "Imagen",
        html: `<div style="text-align: center; margin: 20px 0;">
      <img src="https://via.placeholder.com/600x300?text=Imagen" alt="Imagen" style="max-width: 100%; height: auto; border-radius: 8px;" />
    </div>`,
      },
      button: {
        type: "button",
        content: "Botón",
        html: `<div style="text-align: center; margin: 20px 0;">
      <button style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">Botón</button>
    </div>`,
      },
      divider: {
        type: "divider",
        content: "Separador",
        html: `<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />`,
      },
      link: {
        type: "link",
        content: "Enlace de ejemplo",
        html: `<a href="#" style="color: #007bff; text-decoration: none;">Enlace de ejemplo</a>`,
      },
      list: {
        type: "list",
        content: "Lista",
        html: `<ul style="margin: 20px 0; padding-left: 20px;">
      <li>Elemento de lista 1</li>
      <li>Elemento de lista 2</li>
      <li>Elemento de lista 3</li>
    </ul>`,
      },
      quote: {
        type: "quote",
        content: "Cita destacada",
        html: `<blockquote style="border-left: 4px solid #007bff; padding-left: 16px; margin: 20px 0; font-style: italic; color: #666;">
      "Esta es una cita destacada que puedes usar para resaltar contenido importante."
    </blockquote>`,
      },
    }),
    []
  );

  // Verificar que el usuario autenticado es el propietario
  if (!user || user.username !== username) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
        <h2>No autorizado</h2>
        <p>Solo puedes crear páginas en tu propio perfil.</p>
      </div>
    );
  }

  const handleSave = async () => {
    // Validación básica
    if (!title.trim()) {
      setError("El título de la página es obligatorio");
      return;
    }

    if (elements.length === 0) {
      setError("Debes agregar al menos un elemento a la página");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Obtener CSRF token
      const csrfRes = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      if (!csrfRes.ok) {
        throw new Error("Error al obtener token de seguridad");
      }
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;

      // Crear la página
      const response = await fetch(`/api/paginas/${username}/publicar/1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          titulo: title.trim(),
          contenido: content,
          descripcion: "visible",
        }),
        credentials: "include",
      });

      if (response.status === 401) {
        setShowSessionExpired(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }

      const result = await response.json().catch(() => ({}));
      alert("Página guardada exitosamente");

      // Limpiar estado después de guardar exitosamente
      setTitle("Nueva Página");
      setElements([]);
      setContent("");
      setEditingElement(null);
    } catch (err) {
      console.error("Error al guardar página:", err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setShowSessionExpired(true);
      } else {
        setError(err.message || "Error desconocido al guardar la página");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateContentFromElements = useCallback((elementsList) => {
    const html = elementsList.map((el) => el.html).join("\n");
    setContent(html);
  }, []);

  const insertElement = useCallback(
    (elementType) => {
      const template = elementTemplates[elementType];
      if (!template) {
        console.warn("Tipo de elemento no válido:", elementType);
        return;
      }

      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...template,
      };

      setElements((prev) => {
        const updatedElements = [...prev, newElement];
        updateContentFromElements(updatedElements);
        return updatedElements;
      });
    },
    [elementTemplates, updateContentFromElements]
  );

  const updateElement = useCallback(
    (id, newContent) => {
      // Validación básica del contenido
      if (typeof newContent !== "string") {
        console.warn("Contenido inválido para elemento:", newContent);
        return;
      }

      const sanitizedContent = newContent.trim();

      setElements((prevElements) => {
        const newElements = prevElements.map((el) => {
          if (el.id === id) {
            // Actualizar el contenido y regenerar HTML
            const updated = { ...el, content: sanitizedContent };
            if (el.type === "heading") {
              updated.html = `<h2 style="color: #333; margin: 20px 0;">${
                sanitizedContent || "Título"
              }</h2>`;
            } else if (el.type === "paragraph") {
              updated.html = `<p style="line-height: 1.6; margin: 10px 0;">${
                sanitizedContent || "Contenido del párrafo"
              }</p>`;
            } else if (el.type === "button") {
              updated.html = `<div style="text-align: center; margin: 20px 0;">
              <button style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">${
                sanitizedContent || "Botón"
              }</button>
            </div>`;
            } else if (el.type === "link") {
              updated.html = `<a href="#" style="color: #007bff; text-decoration: none;">${
                sanitizedContent || "Enlace"
              }</a>`;
            }
            return updated;
          }
          return el;
        });
        updateContentFromElements(newElements);
        return newElements;
      });
    },
    [updateContentFromElements]
  );

  const removeElement = useCallback(
    (id) => {
      setElements((prevElements) => {
        const newElements = prevElements.filter((el) => el.id !== id);
        updateContentFromElements(newElements);
        return newElements;
      });
    },
    [updateContentFromElements]
  );

  // Componente para el editor HTML - movido arriba
  // Componente para elemento editable - movido arriba

  return (
    <div className="page-builder-container">
      {/* Mensaje de sesión expirada */}
      {showSessionExpired && (
        <SessionExpiredMessage onClose={() => setShowSessionExpired(false)} />
      )}

      {/* Barra superior */}
      <div className="page-builder-header">
        <div>
          <h3 className="page-builder-title">Editor de Páginas</h3>
          <small className="page-builder-subtitle">
            Arrastra elementos desde la barra lateral
          </small>
        </div>
        <div className="page-builder-controls">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la página"
            className="page-builder-title-input"
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="page-builder-save-btn"
          >
            {loading ? "Guardando..." : "Guardar Página"}
          </button>
        </div>
      </div>

      <div className="page-builder-main">
        {/* Barra lateral con herramientas */}
        <div className="page-builder-sidebar">
          <h4>Elementos</h4>

          <div className="page-builder-elements-grid">
            {Object.entries(elementTemplates).map(
              ([elementType, template], index) => (
                <div
                  key={elementType}
                  className="page-builder-element-btn"
                  onClick={() => insertElement(elementType)}
                  title="Haz clic para agregar elemento"
                >
                  <div className="page-builder-element-content">
                    {elementType === "heading" && <strong>H2 - Título</strong>}
                    {elementType === "paragraph" && <strong>Párrafo</strong>}
                    {elementType === "image" && <strong>🖼️ Imagen</strong>}
                    {elementType === "button" && <strong>🔘 Botón</strong>}
                    {elementType === "divider" && <strong>━ Separador</strong>}
                    {elementType === "link" && <strong>🔗 Enlace</strong>}
                    {elementType === "list" && <strong>📝 Lista</strong>}
                    {elementType === "quote" && <strong>💬 Cita</strong>}
                    <br />
                    <small>
                      {elementType === "heading" && "Para títulos de sección"}
                      {elementType === "paragraph" && "Texto normal"}
                      {elementType === "image" && "Insertar imagen"}
                      {elementType === "button" && "Botón interactivo"}
                      {elementType === "divider" && "Línea divisoria"}
                      {elementType === "link" && "Hipervínculo"}
                      {elementType === "list" && "Lista de elementos"}
                      {elementType === "quote" && "Bloque de cita"}
                    </small>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Área de edición */}
        <div className="page-builder-content">
          {error && <div className="page-builder-error">{error}</div>}

          {/* Vista previa editable con drag & drop */}
          <div className="page-builder-preview">
            <h4 className="page-builder-preview-header">
              Vista Previa (Editable - Drag & Drop):
            </h4>

            <div className="page-builder-droppable">
              {elements.length === 0 ? (
                <div className="page-builder-empty-state">
                  <div className="page-builder-empty-icon">📄</div>
                  <p>
                    Haz clic en los elementos de la barra lateral para
                    agregarlos
                  </p>
                  <small>
                    Los elementos se agregarán automáticamente al canvas
                  </small>
                </div>
              ) : (
                elements.map((element, index) => (
                  <EditableElement
                    key={element.id}
                    element={element}
                    isEditing={editingElement === element.id}
                    onEdit={setEditingElement}
                    onSave={() => setEditingElement(null)}
                    onDelete={removeElement}
                    onUpdate={updateElement}
                  />
                ))
              )}
            </div>
          </div>

          {/* Editor de código - Ahora modal React */}
          <div
            onClick={() => setHtmlEditorOpen(true)}
            className="page-builder-html-editor"
          >
            <h4>
              Editor HTML: <small>Haz clic para abrir en modal</small>
            </h4>
            <div className="page-builder-html-textarea-container">
              <textarea
                ref={editorRef}
                value={content}
                readOnly
                placeholder="Haz clic aquí para abrir el editor HTML en un modal..."
                className="page-builder-html-textarea"
              />
              <div
                className={`page-builder-html-placeholder ${
                  content ? "page-builder-html-placeholder--hidden" : ""
                }`}
              >
                📝 Haz clic para editar HTML
              </div>
            </div>
          </div>

          {/* Modal del editor HTML */}
          <HtmlEditor
            content={content}
            onSave={setContent}
            onClose={() => setHtmlEditorOpen(false)}
            isOpen={htmlEditorOpen}
          />
        </div>
      </div>
    </div>
  );
}

export default PageBuilder;
