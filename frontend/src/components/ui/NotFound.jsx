import React from 'react';

const NotFound = () => {
  console.log('[NotFound] Componente renderizado para ruta no existente');
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>404 - Página No Encontrada</h1>
      <p>La ruta solicitada no existe.</p>
      <a href="/">Volver al inicio</a>
    </div>
  );
};

export default NotFound;