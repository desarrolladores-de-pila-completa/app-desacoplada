import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import authService from "../../services/authService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../../components/ui/PageBuilder.css";

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


// Función para obtener el ícono de cada tipo de elemento
const getElementIcon = (type) => {
  const icons = {
    // Elementos básicos de texto
    heading: '📝',
    subheading: '📄',
    paragraph: '📃',

    // Elementos multimedia
    image: '🖼️',
    video: '🎥',
    audio: '🎵',

    // Elementos de diseño
    divider: '━',
    spacer: '⬜',
    card: '🃏',

    // Elementos tipográficos
    quote: '💬',
    code: '💻',
    highlight: '✨',

    // Elementos interactivos
    button: '🔘',
    link: '🔗',

    // Elementos de lista y datos
    list: '📋',
    orderedList: '🔢',
    table: '📊',

    // Elementos de formulario
    form: '📝',
    input: '📝',
    textarea: '📝',
    select: '📋',
    checkbox: '☑️',
    radio: '🔘',

    // Elementos avanzados
    alert: '⚠️',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️',

    // Elementos de navegación y estructura
    tabs: '📑',
    accordion: '🪗',
    progress: '📊',

    // Elementos sociales y embebidos
    social: '👥',
    iframe: '🖥️',

    // Elementos de contenido avanzado
    gallery: '🖼️',
    testimonial: '💬',
    rating: '⭐'
  };
  return icons[type] || '📦';
};

// Componente mejorado para elemento editable con drag & drop usando @dnd-kit
const SortableItem = ({
  element,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onUpdate,
  onSelect,
  selectedElement,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleContentChange = useCallback((newContent) => {
    onUpdate(element.id, newContent);
  }, [element.id, onUpdate]);

  const handleEdit = useCallback(() => onEdit(element.id), [element.id, onEdit]);
  const handleDelete = useCallback(() => onDelete(element.id), [element.id, onDelete]);
  const handleSave = useCallback(() => onSave(), [onSave]);

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    onSelect(element.id);
  }, [element.id, onSelect]);

  const isSelected = selectedElement === element.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`editable-element ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      <div className="editable-element-header">
        <div className="editable-element-info">
          <span className="editable-element-icon">
            {getElementIcon(element.type)}
          </span>
          <small className="editable-element-type">
            {element.type.toUpperCase()}
          </small>
          {isSelected && (
            <span className="editable-element-selected-badge">
              ✓ Seleccionado
            </span>
          )}
        </div>
        <div className="editable-element-actions">
          <div
            className="editable-element-drag-handle"
            {...attributes}
            {...listeners}
            title="Arrastrar elemento"
          >
            ⋮⋮
          </div>
          <button
            onClick={handleEdit}
            className="editable-element-btn-edit"
            title="Editar elemento"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="editable-element-btn-delete"
            title="Eliminar elemento"
          >
            🗑️
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="editable-element-editor-container">
          <textarea
            value={element.content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="editable-element-editor"
            placeholder={`Editar ${element.type}...`}
          />
          <div className="editable-element-editor-actions">
            <button onClick={handleSave} className="editable-element-save-btn">
              ✓ Guardar
            </button>
            <button onClick={() => onEdit(null)} className="editable-element-cancel-btn">
              ✕ Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div
          className="editable-element-preview"
          dangerouslySetInnerHTML={{ __html: element.html }}
          onClick={handleEdit}
        />
      )}

      {isHovered && !isEditing && (
        <div className="editable-element-hover-overlay">
          <small>Haz clic para seleccionar • Arrastra para reordenar</small>
        </div>
      )}
    </div>
  );
};

function PageBuilder({ mode = "pagina" }) {
  const { username } = useParams();
  const user = authService.getCurrentUser();

  // All hooks must be called before any early returns
  const [content, setContent] = useState("");
  const [title, setTitle] = useState(mode === "publicacion" ? "Nueva Publicación" : "Nueva Página");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elements, setElements] = useState([]);
  const [editingElement, setEditingElement] = useState(null);
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  // Nuevos estados para diseño visual avanzado
  const [layoutMode, setLayoutMode] = useState("vertical"); // solo vertical para publicaciones
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [elementProperties, setElementProperties] = useState({});

  // Funciones auxiliares primero (antes de ser utilizadas)
  const generateElementHTML = useCallback((element) => {
    const baseContent = element.content || "";
    const customStyles = element.customStyles || {};

    // Combinar estilos base con estilos personalizados
    const combinedStyles = {
      ...getBaseStyles(element.type),
      ...customStyles
    };

    const styleString = Object.entries(combinedStyles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');

    // Usar el contenido directamente sin procesamiento adicional
    const safeContent = baseContent;

    switch (element.type) {
      case "heading":
        return `<h2 style="${styleString}">${safeContent || "Título"}</h2>`;
      case "subheading":
        return `<h3 style="${styleString}">${safeContent || "Subtítulo"}</h3>`;
      case "paragraph":
        return `<p style="${styleString}">${safeContent || "Contenido del párrafo"}</p>`;
      case "button":
        return `<div style="text-align: center; margin: 20px 0;"><button style="${styleString}">${safeContent || "Botón"}</button></div>`;
      case "card":
        return `<div style="${styleString}"><h3 style="margin-top: 0; color: #2d3748;">${safeContent || "Título de tarjeta"}</h3><p style="color: #4a5568; margin-bottom: 0;">Contenido de la tarjeta...</p></div>`;
      default:
        return `<div style="${styleString}">${safeContent || "Contenido"}</div>`;
    }
  }, []);

  const getBaseStyles = useCallback((type) => {
    const baseStyles = {
      heading: { color: '#1a202c', margin: '20px 0 10px', fontSize: '1.5em', fontWeight: '600' },
      subheading: { color: '#2d3748', margin: '15px 0 8px', fontSize: '1.25em', fontWeight: '500' },
      paragraph: { lineHeight: '1.6', margin: '10px 0', color: '#4a5568' },
      button: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', transition: 'transform 0.2s ease' },
      card: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '16px 0', background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }
    };
    return baseStyles[type] || { color: '#4a5568' };
  }, []);

  // Memoized element templates - Versión MEGA completa con TODOS los tipos posibles
  const elementTemplates = useMemo(
    () => ({
      // === ELEMENTOS BÁSICOS DE TEXTO ===
      text: {
        type: "text",
        content: "Texto básico",
        html: `<span style="color: #4a5568; line-height: 1.6;">Texto básico editable</span>`,
      },
      heading: {
        type: "heading",
        content: "Título Principal",
        html: `<h1 style="color: #1a202c; margin: 20px 0 10px; font-size: 2em; font-weight: 700;">Título Principal</h1>`,
      },
      subheading: {
        type: "subheading",
        content: "Subtítulo",
        html: `<h3 style="color: #2d3748; margin: 15px 0 8px; font-size: 1.25em; font-weight: 500;">Subtítulo</h3>`,
      },
      paragraph: {
        type: "paragraph",
        content: "Este es un párrafo de texto. Puedes editar este contenido y agregar más párrafos según necesites.",
        html: `<p style="line-height: 1.6; margin: 10px 0; color: #4a5568;">Este es un párrafo de texto. Puedes editar este contenido y agregar más párrafos según necesites.</p>`,
      },

      // Elementos multimedia
      image: {
        type: "image",
        content: "Imagen",
        html: `<div style="text-align: center; margin: 20px 0;"><img src="https://via.placeholder.com/600x300?text=Imagen" alt="Imagen" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" /></div>`,
      },
      video: {
        type: "video",
        content: "Video embebido",
        html: `<div style="text-align: center; margin: 20px 0;"><iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen style="max-width: 100%; border-radius: 8px;"></iframe></div>`,
      },
      audio: {
        type: "audio",
        content: "Reproductor de audio",
        html: `<div style="text-align: center; margin: 20px 0;"><audio controls style="max-width: 100%;"><source src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" type="audio/wav">Tu navegador no soporta audio HTML5.</audio></div>`,
      },

      // Elementos de diseño
      divider: {
        type: "divider",
        content: "Separador",
        html: `<div style="margin: 30px 0;"><hr style="border: none; border-top: 2px solid #e2e8f0; margin: 0;" /></div>`,
      },
      spacer: {
        type: "spacer",
        content: "Espaciador",
        html: `<div style="height: 40px; margin: 20px 0;"></div>`,
      },
      card: {
        type: "card",
        content: "Tarjeta",
        html: `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);"><h3 style="margin-top: 0; color: #2d3748;">Título de tarjeta</h3><p style="color: #4a5568; margin-bottom: 0;">Contenido de la tarjeta...</p></div>`,
      },

      // Elementos tipográficos
      quote: {
        type: "quote",
        content: "Cita destacada",
        html: `<blockquote style="border-left: 4px solid #3182ce; padding-left: 16px; margin: 20px 0; font-style: italic; color: #666; background: #f7fafc; padding: 16px; border-radius: 0 6px 6px 0;">"Esta es una cita destacada que puedes usar para resaltar contenido importante."</blockquote>`,
      },
      code: {
        type: "code",
        content: "Bloque de código",
        html: `<pre style="background: #2d3748; color: #e2e8f0; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 14px;"><code>// Ejemplo de código\nfunction ejemplo() {\n  return "Hola mundo";\n}</code></pre>`,
      },
      highlight: {
        type: "highlight",
        content: "Texto destacado",
        html: `<mark style="background: #fff3cd; padding: 2px 6px; border-radius: 3px; color: #856404;">Texto destacado importante</mark>`,
      },

      // Elementos interactivos
      button: {
        type: "button",
        content: "Botón",
        html: `<div style="text-align: center; margin: 20px 0;"><button style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; transition: transform 0.2s ease;">Botón</button></div>`,
      },
      link: {
        type: "link",
        content: "Enlace de ejemplo",
        html: `<a href="#" style="color: #3182ce; text-decoration: none; font-weight: 500; border-bottom: 1px solid transparent; transition: border-color 0.2s ease;">Enlace de ejemplo</a>`,
      },

      // Elementos de lista y datos
      list: {
        type: "list",
        content: "Lista de elementos",
        html: `<ul style="margin: 20px 0; padding-left: 20px; color: #4a5568;"><li style="margin-bottom: 8px;">Elemento de lista 1</li><li style="margin-bottom: 8px;">Elemento de lista 2</li><li style="margin-bottom: 8px;">Elemento de lista 3</li></ul>`,
      },
      orderedList: {
        type: "orderedList",
        content: "Lista numerada",
        html: `<ol style="margin: 20px 0; padding-left: 20px; color: #4a5568;"><li style="margin-bottom: 8px;">Primer elemento</li><li style="margin-bottom: 8px;">Segundo elemento</li><li style="margin-bottom: 8px;">Tercer elemento</li></ol>`,
      },
      table: {
        type: "table",
        content: "Tabla de datos",
        html: `<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);"><thead><tr style="background: #f7fafc;"><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Columna 1</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Columna 2</th><th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Columna 3</th></tr></thead><tbody><tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 1</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 2</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 3</td></tr><tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 4</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 5</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Dato 6</td></tr></tbody></table>`,
      },

      // Elementos de formulario
      form: {
        type: "form",
        content: "Formulario de contacto",
        html: `<form style="max-width: 500px; margin: 20px auto; padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;"><h3 style="margin-top: 0; color: #2d3748;">Formulario de Contacto</h3><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Nombre:</label><input type="text" name="nombre" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px;" placeholder="Tu nombre"></div><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Email:</label><input type="email" name="email" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px;" placeholder="tu@email.com"></div><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Mensaje:</label><textarea name="mensaje" rows="4" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; resize: vertical;" placeholder="Tu mensaje..."></textarea></div><div style="text-align: center;"><button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">Enviar Mensaje</button></div></form>`,
      },
      input: {
        type: "input",
        content: "Campo de texto",
        html: `<div style="margin: 16px 0;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Campo de texto:</label><input type="text" style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px;" placeholder="Escribe aquí..."></div>`,
      },
      textarea: {
        type: "textarea",
        content: "Área de texto",
        html: `<div style="margin: 16px 0;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Mensaje:</label><textarea rows="4" style="width: 100%; max-width: 400px; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; resize: vertical;" placeholder="Escribe tu mensaje aquí..."></textarea></div>`,
      },
      select: {
        type: "select",
        content: "Lista desplegable",
        html: `<div style="margin: 16px 0;"><label style="display: block; margin-bottom: 4px; font-weight: 500; color: #4a5568;">Selecciona una opción:</label><select style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; background: white;"><option value="">-- Selecciona --</option><option value="opcion1">Opción 1</option><option value="opcion2">Opción 2</option><option value="opcion3">Opción 3</option></select></div>`,
      },
      checkbox: {
        type: "checkbox",
        content: "Casillas de verificación",
        html: `<div style="margin: 16px 0;"><fieldset style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #f7fafc;"><legend style="font-weight: 500; color: #4a5568; padding: 0 8px;">Selecciona opciones:</legend><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="checkbox" name="opcion1" value="1" style="margin-right: 8px;"> Opción 1</label><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="checkbox" name="opcion2" value="2" style="margin-right: 8px;"> Opción 2</label><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="checkbox" name="opcion3" value="3" style="margin-right: 8px;"> Opción 3</label></fieldset></div>`,
      },
      radio: {
        type: "radio",
        content: "Botones de opción",
        html: `<div style="margin: 16px 0;"><fieldset style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #f7fafc;"><legend style="font-weight: 500; color: #4a5568; padding: 0 8px;">Elige una opción:</legend><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="radio" name="grupo1" value="1" style="margin-right: 8px;"> Opción A</label><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="radio" name="grupo1" value="2" style="margin-right: 8px;"> Opción B</label><label style="display: block; margin-bottom: 8px; cursor: pointer;"><input type="radio" name="grupo1" value="3" style="margin-right: 8px;"> Opción C</label></fieldset></div>`,
      },

      // Elementos avanzados
      alert: {
        type: "alert",
        content: "Mensaje de alerta",
        html: `<div style="background: #fed7d7; border: 1px solid #feb2b2; color: #c53030; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">⚠️ Mensaje de alerta importante</div>`,
      },
      success: {
        type: "success",
        content: "Mensaje de éxito",
        html: `<div style="background: #c6f6d5; border: 1px solid #9ae6b4; color: #22543d; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">✅ ¡Operación completada exitosamente!</div>`,
      },
      info: {
        type: "info",
        content: "Mensaje informativo",
        html: `<div style="background: #bee3f8; border: 1px solid #90cdf4; color: #2a4365; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">ℹ️ Información importante para el usuario</div>`,
      },
      warning: {
        type: "warning",
        content: "Mensaje de advertencia",
        html: `<div style="background: #fef5e7; border: 1px solid #f6e05e; color: #744210; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">⚠️ Advertencia: procede con precaución</div>`,
      },

      // Elementos de navegación y estructura
      tabs: {
        type: "tabs",
        content: "Pestañas de navegación",
        html: `<div style="margin: 20px 0;"><div style="border-bottom: 2px solid #e2e8f0; margin-bottom: 16px;"><button style="background: #3182ce; color: white; border: none; padding: 8px 16px; margin-right: 4px; border-radius: 4px 4px 0 0; cursor: pointer;">Pestaña 1</button><button style="background: #e2e8f0; color: #4a5568; border: none; padding: 8px 16px; margin-right: 4px; border-radius: 4px 4px 0 0; cursor: pointer;">Pestaña 2</button><button style="background: #e2e8f0; color: #4a5568; border: none; padding: 8px 16px; border-radius: 4px 4px 0 0; cursor: pointer;">Pestaña 3</button></div><div style="padding: 16px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 0 6px 6px 6px;"><p>Contenido de la pestaña activa...</p></div></div>`,
      },
      accordion: {
        type: "accordion",
        content: "Acordeón expandible",
        html: `<div style="margin: 20px 0; max-width: 600px;"><details style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;"><summary style="padding: 12px 16px; background: #f7fafc; cursor: pointer; font-weight: 500; color: #2d3748; list-style: none;">📋 Sección 1</summary><div style="padding: 16px; background: white; border-top: 1px solid #e2e8f0;">Contenido de la primera sección expandible...</div></details><details style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;"><summary style="padding: 12px 16px; background: #f7fafc; cursor: pointer; font-weight: 500; color: #2d3748; list-style: none;">📋 Sección 2</summary><div style="padding: 16px; background: white; border-top: 1px solid #e2e8f0;">Contenido de la segunda sección expandible...</div></details></div>`,
      },
      progress: {
        type: "progress",
        content: "Barra de progreso",
        html: `<div style="margin: 20px 0;"><label style="display: block; margin-bottom: 8px; font-weight: 500; color: #4a5568;">Progreso de carga:</label><div style="width: 100%; background: #edf2f7; border-radius: 8px; height: 20px; overflow: hidden;"><div style="width: 65%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; border-radius: 8px; transition: width 0.3s ease;"></div></div><small style="color: #718096; margin-top: 4px; display: block;">65% completado</small></div>`,
      },

      // Elementos sociales y embebidos
      social: {
        type: "social",
        content: "Botones sociales",
        html: `<div style="text-align: center; margin: 20px 0;"><div style="display: inline-flex; gap: 12px;"><a href="#" style="display: inline-block; padding: 10px 15px; background: #1877f2; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">📘 Facebook</a><a href="#" style="display: inline-block; padding: 10px 15px; background: #1da1f2; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">🐦 Twitter</a><a href="#" style="display: inline-block; padding: 10px 15px; background: #e1306c; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">📷 Instagram</a><a href="#" style="display: inline-block; padding: 10px 15px; background: #0077b5; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">💼 LinkedIn</a></div></div>`,
      },
      iframe: {
        type: "iframe",
        content: "Contenido embebido",
        html: `<div style="text-align: center; margin: 20px 0;"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3036.108041461795!2d-3.703790085562987!3d40.41694797936316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd422993295a567%3A0x5b9b1f78071e1!2sPuerta%20del%20Sol%2C%20Madrid!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses" width="600" height="300" style="border: none; border-radius: 8px; max-width: 100%;" allowfullscreen="" loading="lazy"></iframe></div>`,
      },

      // Elementos de contenido avanzado
      gallery: {
        type: "gallery",
        content: "Galería de imágenes",
        html: `<div style="margin: 20px 0;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 800px; margin: 0 auto;"><div style="position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><img src="https://via.placeholder.com/300x200?text=Imagen+1" alt="Imagen 1" style="width: 100%; height: 200px; object-fit: cover;"></div><div style="position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><img src="https://via.placeholder.com/300x200?text=Imagen+2" alt="Imagen 2" style="width: 100%; height: 200px; object-fit: cover;"></div><div style="position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><img src="https://via.placeholder.com/300x200?text=Imagen+3" alt="Imagen 3" style="width: 100%; height: 200px; object-fit: cover;"></div><div style="position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><img src="https://via.placeholder.com/300x200?text=Imagen+4" alt="Imagen 4" style="width: 100%; height: 200px; object-fit: cover;"></div></div></div>`,
      },
      testimonial: {
        type: "testimonial",
        content: "Testimonio de cliente",
        html: `<div style="max-width: 500px; margin: 20px auto; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;"><div style="margin-bottom: 16px;"><img src="https://via.placeholder.com/80x80?text=Cliente" alt="Cliente" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #e2e8f0;"></div><blockquote style="font-style: italic; color: #4a5568; margin-bottom: 16px; font-size: 16px;">"Este producto superó todas mis expectativas. La calidad es excepcional y el servicio al cliente es outstanding."</blockquote><div style="border-top: 1px solid #e2e8f0; padding-top: 16px;"><strong style="color: #2d3748;">María González</strong><br><small style="color: #718096;">CEO, Empresa Ejemplo</small></div></div>`,
      },
      rating: {
        type: "rating",
        content: "Sistema de calificación",
        html: `<div style="text-align: center; margin: 20px 0;"><div style="margin-bottom: 8px;"><span style="color: #f6ad55; font-size: 24px;">★★★★★</span></div><p style="margin: 0; color: #4a5568;">Calificación: 5.0 de 5 estrellas</p><small style="color: #718096;">Basado en 42 reseñas</small></div>`,
      },
    }),
    []
  );

  // Memoized callbacks - ALL hooks must be called before any early returns
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
        customStyles: {},
        layout: {
          width: 'auto',
          height: 'auto',
          margin: '0px',
          padding: '0px',
          position: 'relative'
        }
      };

      // Generar HTML con estilos base
      newElement.html = generateElementHTML(newElement);

      setElements((prev) => {
        const updatedElements = [...prev, newElement];
        updateContentFromElements(updatedElements);
        return updatedElements;
      });
    },
    [elementTemplates, updateContentFromElements, generateElementHTML]
  );

  // Nueva función para manejar drag and drop usando @dnd-kit
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        updateContentFromElements(newItems);
        return newItems;
      });
    }
  }, [updateContentFromElements]);

  // Configurar sensores para @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Función para duplicar elementos
  const duplicateElement = useCallback((elementId) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (!elementToDuplicate) return;

    const duplicatedElement = {
      ...elementToDuplicate,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `${elementToDuplicate.content} (copia)`,
    };

    setElements(prev => {
      const newElements = [...prev, duplicatedElement];
      updateContentFromElements(newElements);
      return newElements;
    });
  }, [elements, updateContentFromElements]);

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
            const updated = { ...el, content: sanitizedContent };
            // Usar el nuevo sistema de generación de HTML
            updated.html = generateElementHTML(updated);
            return updated;
          }
          return el;
        });
        updateContentFromElements(newElements);
        return newElements;
      });
    },
    [updateContentFromElements, generateElementHTML]
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

  // Funciones para diseño visual avanzado
  const selectElement = useCallback((elementId) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      setSelectedElement(elementId);
      setElementProperties(element);
      setShowPropertiesPanel(true);
    }
  }, [elements]);

  const updateElementProperties = useCallback((elementId, newProperties) => {
    setElements(prevElements => {
      const updatedElements = prevElements.map(el => {
        if (el.id === elementId) {
          const updatedElement = { ...el, ...newProperties };
          // Actualizar el HTML del elemento con las nuevas propiedades
          updatedElement.html = generateElementHTML(updatedElement);
          return updatedElement;
        }
        return el;
      });

      // Actualizar el contenido general después de modificar elementos
      updateContentFromElements(updatedElements);

      return updatedElements;
    });

    if (selectedElement === elementId) {
      setElementProperties(prev => ({ ...prev, ...newProperties }));
    }
  }, [selectedElement, updateContentFromElements, generateElementHTML]);


  const changeLayoutMode = useCallback((mode) => {
    setLayoutMode(mode);
  }, []);

  // Verificar que el usuario autenticado es el propietario - AFTER all hooks
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
    const itemType = mode === "publicacion" ? "publicación" : "página";
    if (!title.trim()) {
      setError(`El título de la ${itemType} es obligatorio`);
      return;
    }

    if (elements.length === 0) {
      setError(`Debes agregar al menos un elemento a la ${itemType}`);
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

      if (mode === "publicacion") {
        // Crear publicación
        const response = await fetch(`/api/publicar/${username}/crearPublicacion`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({
            titulo: title,
            contenido: content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear publicación");
        }

        const result = await response.json();
        alert(`Publicación creada exitosamente con ID: ${result.id}`);

        // Limpiar estado después de guardar exitosamente
        setTitle("Nueva Publicación");
        setElements([]);
        setContent("");
        setEditingElement(null);
      } else {
        // Funcionalidad de páginas existente
        alert("Página guardada exitosamente (sin crear publicación)");

        // Limpiar estado después de guardar exitosamente
        setTitle("Nueva Página");
        setElements([]);
        setContent("");
        setEditingElement(null);
      }
    } catch (err) {
      console.error(`Error al guardar ${itemType}:`, err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setShowSessionExpired(true);
      } else {
        setError(err.message || `Error desconocido al guardar la ${itemType}`);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page-builder-container">
      {/* Mensaje de sesión expirada */}
      {showSessionExpired && (
        <SessionExpiredMessage onClose={() => setShowSessionExpired(false)} />
      )}

      {/* Barra superior */}
      <div className="page-builder-header">
        <div>
          <h3 className="page-builder-title">
            {mode === "publicacion" ? "Constructor de Publicaciones" : "Editor de Páginas Avanzado"}
          </h3>
          <small className="page-builder-subtitle">
            {mode === "publicacion" ? "Modo Vertical" : `Modo: ${layoutMode === 'vertical' ? 'Vertical' : layoutMode === 'horizontal' ? 'Horizontal' : 'Grid'}`} •
            {selectedElement ? 'Elemento seleccionado' : 'Selecciona un elemento'}
          </small>
        </div>
        <div className="page-builder-controls">
          {/* Solo mostrar controles de diseño si no es modo publicación */}
          {mode !== "publicacion" && (
            <div className="layout-mode-controls">
              <button
                onClick={() => changeLayoutMode('vertical')}
                className={`layout-mode-btn ${layoutMode === 'vertical' ? 'active' : ''}`}
                title="Modo vertical"
              >
                📄 Vertical
              </button>
              <button
                onClick={() => changeLayoutMode('horizontal')}
                className={`layout-mode-btn ${layoutMode === 'horizontal' ? 'active' : ''}`}
                title="Modo horizontal"
              >
                ↔ Horizontal
              </button>
              <button
                onClick={() => changeLayoutMode('grid')}
                className={`layout-mode-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                title="Modo grid"
              >
                ⊞ Grid
              </button>
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "publicacion" ? "Título de la publicación" : "Título de la página"}
            className="page-builder-title-input"
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="page-builder-save-btn"
          >
            {loading ? "Guardando..." : mode === "publicacion" ? "📝 Crear Publicación" : "💾 Guardar Página"}
          </button>
        </div>
      </div>

      <div className="page-builder-main">
        {/* Barra lateral con herramientas mejorada */}
        <div className="page-builder-sidebar">
          <div className="page-builder-sidebar-header">
            <h4>🛠️ Elementos Disponibles</h4>
            <div className="page-builder-sidebar-stats">
              <small>{Object.keys(elementTemplates).length} tipos</small>
            </div>
          </div>

          {/* Categorías de elementos */}
          <div className="page-builder-categories">
            {/* Elementos básicos de texto */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">📝 Texto Básico</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['heading', 'subheading', 'paragraph'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "heading" && "Título"}
                            {elementType === "subheading" && "Subtítulo"}
                            {elementType === "paragraph" && "Párrafo"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "heading" && "Para títulos principales"}
                            {elementType === "subheading" && "Para subtítulos"}
                            {elementType === "paragraph" && "Texto normal"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos multimedia */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">🎥 Multimedia</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['image', 'video', 'audio'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "image" && "Imagen"}
                            {elementType === "video" && "Video"}
                            {elementType === "audio" && "Audio"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "image" && "Insertar imagen"}
                            {elementType === "video" && "Video embebido"}
                            {elementType === "audio" && "Reproductor de audio"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos de diseño */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">🎨 Diseño</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['divider', 'spacer', 'card'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "divider" && "Separador"}
                            {elementType === "spacer" && "Espaciador"}
                            {elementType === "card" && "Tarjeta"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "divider" && "Línea divisoria"}
                            {elementType === "spacer" && "Espacio en blanco"}
                            {elementType === "card" && "Contenedor con estilo"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos tipográficos */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">✨ Tipografía</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['quote', 'code', 'highlight'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "quote" && "Cita"}
                            {elementType === "code" && "Código"}
                            {elementType === "highlight" && "Resaltado"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "quote" && "Bloque de cita"}
                            {elementType === "code" && "Bloque de código"}
                            {elementType === "highlight" && "Texto destacado"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos interactivos */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">🔗 Interactivos</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['button', 'link'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "button" && "Botón"}
                            {elementType === "link" && "Enlace"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "button" && "Botón interactivo"}
                            {elementType === "link" && "Hipervínculo"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos de formulario */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">📋 Formularios</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['form', 'input', 'textarea', 'select', 'checkbox', 'radio'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "form" && "Formulario"}
                            {elementType === "input" && "Campo de texto"}
                            {elementType === "textarea" && "Área de texto"}
                            {elementType === "select" && "Lista desplegable"}
                            {elementType === "checkbox" && "Casilla"}
                            {elementType === "radio" && "Botón de opción"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "form" && "Formulario completo"}
                            {elementType === "input" && "Campo de entrada"}
                            {elementType === "textarea" && "Texto multilínea"}
                            {elementType === "select" && "Selección única"}
                            {elementType === "checkbox" && "Selección múltiple"}
                            {elementType === "radio" && "Opción exclusiva"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos avanzados */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">🚨 Avanzados</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['alert', 'success', 'info', 'warning'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "alert" && "Alerta"}
                            {elementType === "success" && "Éxito"}
                            {elementType === "info" && "Información"}
                            {elementType === "warning" && "Advertencia"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "alert" && "Mensaje de alerta"}
                            {elementType === "success" && "Mensaje de éxito"}
                            {elementType === "info" && "Mensaje informativo"}
                            {elementType === "warning" && "Mensaje de advertencia"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos de estructura */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">🏗️ Estructura</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['tabs', 'accordion', 'progress'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "tabs" && "Pestañas"}
                            {elementType === "accordion" && "Acordeón"}
                            {elementType === "progress" && "Progreso"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "tabs" && "Navegación por pestañas"}
                            {elementType === "accordion" && "Contenido expandible"}
                            {elementType === "progress" && "Barra de progreso"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Elementos de contenido avanzado */}
            <div className="page-builder-category">
              <h5 className="page-builder-category-title">💎 Contenido Avanzado</h5>
              <div className="page-builder-elements-grid">
                {Object.entries(elementTemplates)
                  .filter(([type]) => ['list', 'orderedList', 'table', 'social', 'iframe', 'gallery', 'testimonial', 'rating'].includes(type))
                  .map(([elementType, template]) => (
                    <div
                      key={elementType}
                      className="page-builder-element-btn"
                      onClick={() => insertElement(elementType)}
                      title={`Agregar ${template.content}`}
                    >
                      <div className="page-builder-element-content">
                        <div className="page-builder-element-icon">
                          {getElementIcon(elementType)}
                        </div>
                        <div className="page-builder-element-info">
                          <strong className="page-builder-element-title">
                            {elementType === "list" && "Lista"}
                            {elementType === "orderedList" && "Lista numerada"}
                            {elementType === "table" && "Tabla"}
                            {elementType === "social" && "Redes sociales"}
                            {elementType === "iframe" && "Contenido embebido"}
                            {elementType === "gallery" && "Galería"}
                            {elementType === "testimonial" && "Testimonio"}
                            {elementType === "rating" && "Calificación"}
                          </strong>
                          <small className="page-builder-element-desc">
                            {elementType === "list" && "Lista de elementos"}
                            {elementType === "orderedList" && "Lista numerada"}
                            {elementType === "table" && "Tabla de datos"}
                            {elementType === "social" && "Botones sociales"}
                            {elementType === "iframe" && "Contenido externo"}
                            {elementType === "gallery" && "Galería de imágenes"}
                            {elementType === "testimonial" && "Testimonio de cliente"}
                            {elementType === "rating" && "Sistema de estrellas"}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Panel de acciones rápidas */}
          <div className="page-builder-quick-actions">
            <h5>🔧 Acciones Rápidas</h5>
            <div className="page-builder-quick-actions-grid">
              <button
                onClick={() => setElements([])}
                className="page-builder-quick-action-btn clear"
                title="Limpiar todo"
              >
                🗑️ Limpiar
              </button>
              <button
                onClick={() => {
                  const data = {
                    title,
                    elements,
                    timestamp: new Date().toISOString()
                  };
                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                  alert('Contenido copiado al portapapeles');
                }}
                className="page-builder-quick-action-btn export"
                title="Exportar configuración"
              >
                📋 Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Área de edición */}
        <div className="page-builder-content">
          {error && <div className="page-builder-error">{error}</div>}

          {/* Panel de propiedades para elementos seleccionados */}
          {showPropertiesPanel && selectedElement && (
            <div className="properties-panel">
              <div className="properties-panel-header">
                <h5>🎨 Propiedades del Elemento</h5>
                <button
                  onClick={() => setShowPropertiesPanel(false)}
                  className="properties-panel-close"
                >
                  ✕
                </button>
              </div>
              <div className="properties-panel-content">
                <div className="properties-group">
                  <h6>📝 Contenido</h6>
                  <label>Texto:</label>
                  <input
                    type="text"
                    value={elementProperties.content || ''}
                    onChange={(e) => updateElementProperties(selectedElement, { content: e.target.value })}
                    placeholder="Contenido del elemento"
                  />
                </div>

                <div className="properties-group">
                  <h6>🎨 Estilos Personalizados</h6>
                  <label>Color de fondo:</label>
                  <input
                    type="color"
                    value={elementProperties.customStyles?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      customStyles: {
                        ...elementProperties.customStyles,
                        backgroundColor: e.target.value
                      }
                    })}
                  />

                  <label>Color de texto:</label>
                  <input
                    type="color"
                    value={elementProperties.customStyles?.color || '#000000'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      customStyles: {
                        ...elementProperties.customStyles,
                        color: e.target.value
                      }
                    })}
                  />

                  <label>Ancho:</label>
                  <input
                    type="text"
                    value={elementProperties.layout?.width || 'auto'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      layout: {
                        ...elementProperties.layout,
                        width: e.target.value
                      }
                    })}
                    placeholder="auto, 100px, 50%, etc."
                  />

                  <label>Alto:</label>
                  <input
                    type="text"
                    value={elementProperties.layout?.height || 'auto'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      layout: {
                        ...elementProperties.layout,
                        height: e.target.value
                      }
                    })}
                    placeholder="auto, 100px, 50%, etc."
                  />
                </div>

                <div className="properties-group">
                  <h6>📐 Espaciado</h6>
                  <label>Margin:</label>
                  <input
                    type="text"
                    value={elementProperties.layout?.margin || '0px'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      layout: {
                        ...elementProperties.layout,
                        margin: e.target.value
                      }
                    })}
                    placeholder="0px, 10px 20px, etc."
                  />

                  <label>Padding:</label>
                  <input
                    type="text"
                    value={elementProperties.layout?.padding || '0px'}
                    onChange={(e) => updateElementProperties(selectedElement, {
                      layout: {
                        ...elementProperties.layout,
                        padding: e.target.value
                      }
                    })}
                    placeholder="0px, 10px 20px, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vista previa editable con diseño visual avanzado */}
          <div className="page-builder-preview">
            <div className="page-builder-preview-header">
              <h4>Vista Previa Visual - Modo {layoutMode === 'vertical' ? 'Vertical' : layoutMode === 'horizontal' ? 'Horizontal' : 'Grid'}</h4>
              <div className="page-builder-preview-stats">
                <small>{elements.length} elementos</small>
                <small>•</small>
                <small>Haz clic para seleccionar • Arrastra para reordenar</small>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={elements.map(el => el.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`page-builder-droppable layout-mode-${layoutMode}`}>
                  {elements.length === 0 ? (
                    <div className="page-builder-empty-state">
                      <div className="page-builder-empty-icon">🎨</div>
                      <h3>¡Comienza a crear tu página!</h3>
                      <p>
                        Haz clic en los elementos de la barra lateral para agregarlos
                      </p>
                      <small>
                        Los elementos se agregarán automáticamente al canvas
                      </small>
                      <div className="page-builder-empty-animation">
                        <div className="pulse-element"></div>
                        <div className="pulse-element"></div>
                        <div className="pulse-element"></div>
                      </div>
                    </div>
                  ) : (
                    elements.map((element, index) => (
                      <SortableItem
                        key={element.id}
                        element={element}
                        isEditing={editingElement === element.id}
                        onEdit={setEditingElement}
                        onSave={() => setEditingElement(null)}
                        onDelete={removeElement}
                        onUpdate={updateElement}
                        onSelect={selectElement}
                        selectedElement={selectedElement}
                        index={index}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PageBuilder;
