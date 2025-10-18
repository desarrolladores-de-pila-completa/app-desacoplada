import React from 'react';
import { processContent } from '../utils/htmlProcessor';

/**
 * Hook para procesar contenido HTML de manera segura
 * Separado del componente para evitar problemas con Fast Refresh
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