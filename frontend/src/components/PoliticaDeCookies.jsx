import React, { useEffect, useState } from 'react';

/**
 * Component that displays the Política de Cookies (Cookie Policy) page
 * Loads the static HTML content from the pages directory
 */
function PoliticaDeCookies() {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Import the HTML file as raw text
    import('../pages/politica-de-cookies.html?raw')
      .then((module) => {
        setHtmlContent(module.default);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading política de cookies:', err);
        setError('Error al cargar la política de cookies');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '20px' 
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default PoliticaDeCookies;
