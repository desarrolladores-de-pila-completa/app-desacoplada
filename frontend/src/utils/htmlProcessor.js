/**
 * Utilidad avanzada para procesamiento de contenido HTML
 * Detecta, valida y procesa contenido HTML de manera segura
 */

/**
 * Detecta si el contenido es HTML válido y qué tipo de elementos contiene
 * @param {string} content - El contenido a analizar
 * @returns {object} - Información detallada sobre el contenido
 */
export const analyzeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      isHTML: false,
      hasValidHTML: false,
      elements: [],
      entities: [],
      isEmpty: true,
      type: 'empty'
    };
  }

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return {
      isHTML: false,
      hasValidHTML: false,
      elements: [],
      entities: [],
      isEmpty: true,
      type: 'empty'
    };
  }

  // Detectar entidades HTML escapadas
  const entityRegex = /&([a-zA-Z]+|#x[0-9a-fA-F]+|#?[0-9]+);/g;
  const entities = [];
  let entityMatch;
  while ((entityMatch = entityRegex.exec(trimmedContent)) !== null) {
    entities.push({
      entity: entityMatch[0],
      position: entityMatch.index,
      type: entityMatch[1].startsWith('#') ? 'numeric' : 'named'
    });
  }

  // Detectar elementos HTML básicos
  const elementRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>/g;
  const elements = [];
  let elementMatch;
  while ((elementMatch = elementRegex.exec(trimmedContent)) !== null) {
    const tagName = elementMatch[1].toLowerCase();
    const isClosing = elementMatch[0].startsWith('</');

    elements.push({
      tag: tagName,
      fullMatch: elementMatch[0],
      position: elementMatch.index,
      isClosing,
      isSelfClosing: elementMatch[0].endsWith('/>')
    });
  }

  // Categorizar elementos estructurales
  const structuralElements = elements.filter(el =>
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'section', 'article', 'header', 'footer', 'main'].includes(el.tag)
  );

  const interactiveElements = elements.filter(el =>
    ['a', 'button', 'input', 'form', 'select', 'textarea'].includes(el.tag)
  );

  const mediaElements = elements.filter(el =>
    ['img', 'video', 'audio', 'iframe', 'picture', 'source'].includes(el.tag)
  );

  const listElements = elements.filter(el =>
    ['ul', 'ol', 'li', 'dl', 'dt', 'dd'].includes(el.tag)
  );

  const tableElements = elements.filter(el =>
    ['table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'].includes(el.tag)
  );

  // Detectar si es HTML válido (tiene elementos HTML)
  const hasValidHTML = elements.length > 0;

  // Detectar si parece ser HTML (tiene caracteres típicos de HTML)
  const hasHTMLIndicators = /<\/?[a-zA-Z]/.test(trimmedContent);

  // Detectar si tiene estilos CSS
  const hasInlineStyles = /style\s*=\s*["'][^"']*["']/i.test(trimmedContent);

  // Detectar si tiene atributos de clase o id
  const hasClassesOrIds = /(?:class|id)\s*=\s*["'][^"']*["']/i.test(trimmedContent);

  // Determinar el tipo de contenido
  let contentType = 'text';
  if (hasValidHTML) {
    if (structuralElements.length > 0) {
      contentType = 'structured_html';
    } else if (interactiveElements.length > 0) {
      contentType = 'interactive_html';
    } else if (mediaElements.length > 0) {
      contentType = 'media_html';
    } else {
      contentType = 'simple_html';
    }
  } else if (entities.length > 0) {
    contentType = 'escaped_html';
  } else if (trimmedContent.length < 100 && !hasHTMLIndicators) {
    contentType = 'short_text';
  } else {
    contentType = 'long_text';
  }

  return {
    isHTML: hasValidHTML,
    hasValidHTML,
    hasHTMLIndicators,
    elements: elements.map(el => el.tag),
    uniqueElements: [...new Set(elements.map(el => el.tag))],
    structuralElements: structuralElements.map(el => el.tag),
    interactiveElements: interactiveElements.map(el => el.tag),
    mediaElements: mediaElements.map(el => el.tag),
    listElements: listElements.map(el => el.tag),
    tableElements: tableElements.map(el => el.tag),
    entities,
    hasInlineStyles,
    hasClassesOrIds,
    isEmpty: false,
    type: contentType,
    length: trimmedContent.length,
    preview: trimmedContent.substring(0, 200)
  };
};

/**
 * Procesa entidades HTML escapadas convirtiéndolas a caracteres normales
 * @param {string} content - Contenido con entidades escapadas
 * @returns {string} - Contenido con entidades procesadas
 */
export const processHTMLEntities = (content) => {
  if (!content) return content;

  // Crear un elemento temporal para decodificar entidades HTML
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    return textarea.value;
  }

  // Fallback para entornos sin DOM
  const entityMap = {
    '<': '<',
    '>': '>',
    '&': '&',
    '"': '"',
    ['\'']: '\'',
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': '"',
    '&rsquo;': '"',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&bull;': '•',
    '&deg;': '°',
    '&plusmn;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&frac14;': '¼',
    '&frac12;': '½',
    '&frac34;': '¾'
  };

  let processed = content;
  Object.entries(entityMap).forEach(([entity, replacement]) => {
    processed = processed.replace(new RegExp(entity, 'g'), replacement);
  });

  return processed;
};

/**
 * Valida y sanitiza contenido HTML para prevenir XSS
 * @param {string} html - Contenido HTML a sanitizar
 * @returns {string} - HTML sanitizado
 */
export const sanitizeHTML = (html) => {
  if (!html) return html;

  // Crear un elemento temporal para sanitizar
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Remover scripts peligrosos
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Remover eventos peligrosos de atributos
    const allElements = div.querySelectorAll('*');
    allElements.forEach(element => {
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on') ||
            attr.name.toLowerCase() === 'href' && attr.value.toLowerCase().startsWith('javascript:') ||
            attr.name.toLowerCase() === 'src' && attr.value.toLowerCase().startsWith('javascript:')) {
          element.removeAttribute(attr.name);
        }
      });
    });

    return div.innerHTML;
  }

  // Fallback básico para entornos sin DOM
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
};

/**
 * Procesa contenido HTML interno mejorando elementos específicos
 * @param {string} content - Contenido HTML a procesar
 * @returns {string} - HTML procesado y mejorado
 */
export const processHTMLContent = (content) => {
  if (!content) return content;

  let processed = content;

  // Procesar imágenes para hacerlas responsivas
  processed = processed.replace(
    /<img([^>]+)>/g,
    '<img$1 style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" loading="lazy">'
  );

  // Procesar iframes para hacerlos responsivos
  processed = processed.replace(
    /<iframe([^>]+)><\/iframe>/g,
    '<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 16px 0;">' +
    '<iframe$1 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;"></iframe>' +
    '</div>'
  );

  // Procesar tablas para mejor presentación móvil
  processed = processed.replace(
    /<table([^>]*)(style="[^"]*")?([^>]*)>/g,
    (match, before, style, after) => {
      const responsiveStyle = ' style="width: 100%; border-collapse: collapse; margin: 16px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);"';
      return `<div style="overflow-x: auto; margin: 16px 0;"><table${before}${style ? style : responsiveStyle}${after}>`;
    }
  );

  // Cerrar div de tabla
  const tableMatches = processed.match(/<table[^>]*>/g);
  if (tableMatches) {
    tableMatches.forEach(() => {
      if (!processed.includes('</table>')) {
        processed += '</table></div>';
      } else {
        processed = processed.replace('</table>', '</table></div>');
      }
    });
  }

  // Procesar listas para mejor espaciado
  processed = processed.replace(
    /<(ul|ol)([^>]*)(style="[^"]*")?([^>]*)>/g,
    '<$1$2 style="margin: 16px 0; padding-left: 20px; line-height: 1.6;"$3>'
  );

  // Procesar elementos de código
  processed = processed.replace(
    /<pre([^>]*)(style="[^"]*")?([^>]*)><code([^>]*)>([^<]*)<\/code><\/pre>/g,
    '<pre$1 style="background: #f8f9fa; padding: 16px; border-radius: 6px; overflow-x: auto; font-family: \'Courier New\', monospace; font-size: 14px; margin: 16px 0;"$2$3>' +
    '<code$4>$5</code></pre>'
  );

  // Procesar blockquotes
  processed = processed.replace(
    /<blockquote([^>]*)(style="[^"]*")?([^>]*)>/g,
    '<blockquote$1 style="border-left: 4px solid #007bff; padding-left: 16px; margin: 20px 0; font-style: italic; color: #555; background: #f8f9fa; padding: 16px; border-radius: 0 6px 6px 0;"$2$3>'
  );

  return processed;
};

/**
 * Función principal para procesar contenido que puede ser HTML o texto
 * @param {string} content - El contenido a procesar
 * @param {object} options - Opciones de procesamiento
 * @returns {object} - Resultado del procesamiento
 */
export const processContent = (content, options = {}) => {
  const {
    sanitize = true,
    processEntities = true,
    enhanceContent = true,
    allowHTML = true
  } = options;

  if (!content) {
    return {
      original: content,
      processed: content,
      analysis: analyzeContent(content),
      needsHTML: false,
      isSafe: true
    };
  }

  // Analizar el contenido
  const analysis = analyzeContent(content);

  console.log('🔍 [HTML Processor] Análisis de contenido:', analysis);

  let processed = content;

  // Procesar entidades HTML si es necesario
  if (processEntities && analysis.entities.length > 0) {
    processed = processHTMLEntities(processed);
    console.log('🔄 [HTML Processor] Entidades procesadas');
  }

  // Sanitizar HTML si está habilitado
  if (sanitize && analysis.hasValidHTML) {
    processed = sanitizeHTML(processed);
    console.log('🛡️ [HTML Processor] HTML sanitizado');
  }

  // Mejorar contenido HTML si está habilitado
  if (enhanceContent && analysis.hasValidHTML) {
    processed = processHTMLContent(processed);
    console.log('✨ [HTML Processor] Contenido mejorado');
  }

  // Determinar si necesita renderizado HTML
  const needsHTML = allowHTML && analysis.hasValidHTML;

  return {
    original: content,
    processed,
    analysis,
    needsHTML,
    isSafe: !analysis.hasValidHTML || (sanitize && analysis.hasValidHTML),
    debug: {
      hasEntities: analysis.entities.length > 0,
      hasElements: analysis.elements.length > 0,
      contentType: analysis.type
    }
  };
};

/**
 * Hook personalizado para usar el procesador de HTML en componentes React
 * @param {string} content - El contenido a procesar
 * @param {object} options - Opciones de procesamiento
 * @returns {object} - Estado del procesamiento
 */
export const useHTMLProcessor = (content, options = {}) => {
  const [processed, setProcessed] = React.useState(() => processContent(content, options));
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    setIsProcessing(true);
    const result = processContent(content, options);
    setProcessed(result);
    setIsProcessing(false);
  }, [content, options.sanitize, options.processEntities, options.enhanceContent, options.allowHTML]);

  return {
    ...processed,
    isProcessing,
    reprocess: (newOptions) => {
      const result = processContent(content, { ...options, ...newOptions });
      setProcessed(result);
      return result;
    }
  };
};

// Exportar React si no está disponible
if (typeof React === 'undefined') {
  try {
    // Intentar importar React en entorno Node.js (para testing)
    const React = require('react');
  } catch {
    // React no disponible, continuar sin el hook
  }
}