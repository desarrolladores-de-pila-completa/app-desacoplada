import React from 'react';
import { processContent, useHTMLProcessor } from '../utils/htmlProcessor';

/**
 * Componente avanzado para renderizar contenido HTML de manera segura
 * Maneja detección automática, procesamiento y renderizado de contenido
 */
const ContentRenderer = ({
  content,
  className = '',
  style = {},
  options = {},
  fallback = null,
  showDebugInfo = false,
  onContentProcessed = null,
  onError = null
}) => {
  const [error, setError] = React.useState(null);
  const [processedContent, setProcessedContent] = React.useState(null);

  // Procesar contenido usando el hook personalizado
  const {
    processed,
    analysis,
    needsHTML,
    isSafe,
    isProcessing,
    debug
  } = useHTMLProcessor(content, {
    sanitize: true,
    processEntities: true,
    enhanceContent: true,
    allowHTML: true,
    ...options
  });

  // Efecto para manejar errores y callbacks
  React.useEffect(() => {
    if (processed && onContentProcessed) {
      try {
        onContentProcessed({
          content: processed,
          analysis,
          needsHTML,
          isSafe,
          debug
        });
      } catch (err) {
        console.error('Error en callback onContentProcessed:', err);
        if (onError) onError(err);
      }
    }
  }, [processed, analysis, needsHTML, isSafe, debug, onContentProcessed, onError]);

  // Efecto para detectar errores en el procesamiento
  React.useEffect(() => {
    if (content && !isProcessing && !processed) {
      const errorMsg = 'Error procesando contenido';
      setError(errorMsg);
      console.error('❌ [ContentRenderer] Error procesando contenido:', {
        contentLength: content?.length,
        contentPreview: content?.substring(0, 100)
      });

      if (onError) {
        onError(new Error(errorMsg));
      }
    } else {
      setError(null);
    }
  }, [content, isProcessing, processed, onError]);

  // Si hay un error, mostrar fallback o mensaje de error
  if (error) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className={`content-renderer-error ${className}`} style={style}>
        <p style={{ color: '#e53e3e', fontSize: '14px' }}>
          ⚠️ Error al procesar contenido
        </p>
        {showDebugInfo && (
          <details style={{ marginTop: '8px' }}>
            <summary style={{ fontSize: '12px', color: '#666', cursor: 'pointer' }}>
              Ver detalles de debug
            </summary>
            <pre style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {JSON.stringify({ error, analysis, debug }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  // Si está procesando, mostrar indicador de carga
  if (isProcessing) {
    return (
      <div className={`content-renderer-loading ${className}`} style={style}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#666',
          fontSize: '14px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #3182ce',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Procesando contenido...
        </div>
      </div>
    );
  }

  // Si no hay contenido, mostrar fallback o nada
  if (!content || !processed) {
    return fallback || null;
  }

  // Renderizar contenido basado en el análisis
  const renderContent = () => {
    // Si necesita HTML y es seguro, renderizar como HTML
    if (needsHTML && isSafe) {
      console.log('✅ [ContentRenderer] Renderizando como HTML:', {
        hasElements: analysis.elements.length,
        contentType: analysis.type,
        isSafe
      });

      return (
        <div
          className={`content-renderer-html ${className}`}
          style={{
            lineHeight: '1.6',
            fontSize: '16px',
            color: '#333',
            wordWrap: 'break-word',
            ...style
          }}
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }

    // Si parece HTML pero no es seguro, mostrar como texto escapado
    if (analysis.hasHTMLIndicators && !isSafe) {
      console.warn('⚠️ [ContentRenderer] Contenido HTML detectado pero no seguro:', {
        hasElements: analysis.elements.length,
        isSafe
      });

      return (
        <div
          className={`content-renderer-escaped ${className}`}
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            fontSize: '16px',
            color: '#333',
            background: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '4px',
            padding: '12px',
            ...style
          }}
        >
          <p style={{ margin: 0, color: '#c53030', fontSize: '14px' }}>
            ⚠️ Contenido HTML detectado pero no se puede renderizar por seguridad
          </p>
          <pre style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#2d3748' }}>
            {processed}
          </pre>
        </div>
      );
    }

    // Renderizar como texto plano
    console.log('📝 [ContentRenderer] Renderizando como texto plano:', {
      contentType: analysis.type,
      length: processed.length
    });

    return (
      <div
        className={`content-renderer-text ${className}`}
        style={{
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          fontSize: '16px',
          color: '#333',
          ...style
        }}
      >
        {processed}
      </div>
    );
  };

  return (
    <div className="content-renderer-container">
      {renderContent()}

      {/* Información de debug si está habilitada */}
      {showDebugInfo && (
        <details style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#666'
        }}>
          <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
            🔍 Información de Debug
          </summary>
          <div style={{
            background: '#f7fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            <div><strong>Tipo:</strong> {analysis.type}</div>
            <div><strong>Elementos:</strong> {analysis.elements.join(', ') || 'Ninguno'}</div>
            <div><strong>Entidades:</strong> {analysis.entities.length}</div>
            <div><strong>Longitud:</strong> {analysis.length}</div>
            <div><strong>¿Necesita HTML?:</strong> {needsHTML ? 'Sí' : 'No'}</div>
            <div><strong>¿Es seguro?:</strong> {isSafe ? 'Sí' : 'No'}</div>
            <div><strong>Vista previa:</strong> {analysis.preview}...</div>
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * Componente simplificado para casos de uso básicos
 */
export const SimpleContentRenderer = ({
  content,
  className = '',
  style = {}
}) => {
  return (
    <ContentRenderer
      content={content}
      className={className}
      style={style}
      options={{
        sanitize: true,
        processEntities: true,
        enhanceContent: false // Simplificado para casos básicos
      }}
    />
  );
};

/**
 * Componente para comentarios con procesamiento especial
 */
export const CommentContentRenderer = ({
  content,
  className = '',
  style = {}
}) => {
  return (
    <ContentRenderer
      content={content}
      className={className}
      style={style}
      options={{
        sanitize: true,
        processEntities: true,
        enhanceContent: true,
        // Procesamiento especial para comentarios
        commentMode: true
      }}
    />
  );
};

/**
 * Hook para usar ContentRenderer en componentes funcionales
 */
export const useContentRenderer = (content, options = {}) => {
  const [state, setState] = React.useState({
    processed: null,
    analysis: null,
    needsHTML: false,
    isSafe: true,
    error: null
  });

  React.useEffect(() => {
    try {
      const result = processContent(content, options);
      setState({
        processed: result.processed,
        analysis: result.analysis,
        needsHTML: result.needsHTML,
        isSafe: result.isSafe,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message
      }));
    }
  }, [content, options]);

  return state;
};

export default ContentRenderer;