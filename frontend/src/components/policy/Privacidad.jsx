
import React from 'react';

/**
 * Página de Política de Privacidad
 */
function Privacidad() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1>Política de Privacidad</h1>
      <p>Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos tu información personal cuando utilizas nuestra aplicación.</p>
      <h2>Información que recopilamos</h2>
      <ul>
        <li>Datos de registro y perfil</li>
        <li>Contenido que publicas (posts, comentarios, fotos)</li>
        <li>Datos de uso y navegación</li>
      </ul>
      <h2>Uso de la información</h2>
      <ul>
        <li>Mejorar la experiencia de usuario</li>
        <li>Personalizar el contenido</li>
        <li>Garantizar la seguridad de la plataforma</li>
      </ul>
      <h2>Cookies y tecnologías similares</h2>
      <p>Utilizamos cookies para analizar el tráfico y personalizar la experiencia. Consulta la <a href="/politica-de-cookies">Política de Cookies</a> para más detalles.</p>
      <h2>Actualizaciones</h2>
      <p>Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página.</p>
      <h2>Contacto</h2>
      <p>Si tienes preguntas sobre esta política o deseas ejercer tus derechos, contáctanos a través del formulario de soporte.</p>
    </div>
  );
}

export default Privacidad;
