# Sistema Avanzado de Procesamiento de HTML

Este directorio contiene utilidades avanzadas para el procesamiento seguro y mejorado de contenido HTML en la aplicación.

## Archivos

### `htmlProcessor.js`
Utilidad principal que proporciona funciones avanzadas para:
- **Detección automática de HTML**: Identifica si el contenido es HTML válido y qué elementos estructurales contiene
- **Procesamiento de entidades HTML**: Convierte entidades escapadas (`<`, `>`, etc.) a caracteres normales
- **Sanitización de seguridad**: Elimina scripts peligrosos y eventos maliciosos para prevenir XSS
- **Mejora de contenido**: Optimiza elementos HTML para mejor presentación móvil y responsividad

### `ContentRenderer.jsx`
Componente React avanzado que:
- **Renderiza contenido de manera segura**: Usa el procesador HTML para mostrar contenido sin riesgos de seguridad
- **Maneja diferentes tipos de contenido**: Detecta automáticamente si el contenido necesita HTML o texto plano
- **Proporciona información de debug**: En modo desarrollo muestra detalles del procesamiento
- **Ofrece componentes especializados**: Para comentarios, páginas, publicaciones, etc.

## Características Principales

### 1. Detección Inteligente de Contenido
```javascript
import { analyzeContent } from './htmlProcessor';

const analysis = analyzeContent(someContent);
// Resultado:
// {
//   isHTML: true,
//   elements: ['h1', 'p', 'img'],
//   type: 'structured_html',
//   entities: [...],
//   hasInlineStyles: true
// }
```

### 2. Procesamiento Seguro
```javascript
import { processContent } from './htmlProcessor';

const result = processContent(htmlContent, {
  sanitize: true,        // Eliminar contenido peligroso
  processEntities: true, // Convertir entidades HTML
  enhanceContent: true,  // Mejorar presentación
  allowHTML: true        // Permitir HTML si es seguro
});
```

### 3. Renderizado con React
```jsx
import ContentRenderer from './ContentRenderer';

// Uso básico
<ContentRenderer content={htmlContent} />

// Uso avanzado con opciones
<ContentRenderer
  content={htmlContent}
  options={{
    sanitize: true,
    enhanceContent: true
  }}
  showDebugInfo={process.env.NODE_ENV === 'development'}
  onContentProcessed={(result) => {
    console.log('Contenido procesado:', result.analysis);
  }}
/>
```

## Componentes Especializados

### Para Comentarios
```jsx
import { CommentContentRenderer } from './ContentRenderer';

<CommentContentRenderer
  content={commentContent}
  options={{ commentMode: true }}
/>
```

### Para Páginas de Usuario
```jsx
import ContentRenderer from './ContentRenderer';

<ContentRenderer
  content={pageContent}
  className="user-page-content"
  options={{
    sanitize: true,
    processEntities: true,
    enhanceContent: true
  }}
/>
```

## Tipos de Contenido Detectados

El sistema clasifica automáticamente el contenido en:

- **`empty`**: Contenido vacío o nulo
- **`text`**: Texto plano simple
- **`short_text`**: Texto plano corto (< 100 caracteres)
- **`long_text`**: Texto plano largo
- **`escaped_html`**: Contiene entidades HTML escapadas
- **`simple_html`**: HTML básico sin elementos estructurales
- **`structured_html`**: HTML con elementos estructurales (h1, h2, p, div, etc.)
- **`interactive_html`**: HTML con elementos interactivos (a, button, form, etc.)
- **`media_html`**: HTML con elementos multimedia (img, video, iframe, etc.)

## Seguridad

### Prevención de XSS
- Eliminación automática de elementos `<script>`
- Remoción de eventos peligrosos (`onclick`, `onload`, etc.)
- Sanitización de atributos `href` y `src` maliciosos
- Validación de contenido antes del renderizado

### Mejoras de Seguridad
- Procesamiento en entorno aislado cuando es posible
- Validación de tipos de contenido
- Logs detallados para debugging en desarrollo

## Mejoras de Rendimiento

### Procesamiento Eficiente
- Análisis previo para determinar el método de renderizado óptimo
- Procesamiento lazy para contenido pesado
- Caché de resultados de análisis

### Optimización Móvil
- Imágenes responsivas automáticas
- Tablas con scroll horizontal
- Iframes responsivos
- Mejor espaciado y tipografía

## Debug y Desarrollo

### Información de Debug
En modo desarrollo, el sistema proporciona:
- Análisis detallado del contenido
- Información sobre elementos detectados
- Estado de seguridad
- Vista previa del contenido procesado

### Logs Informativos
```javascript
// El sistema registra automáticamente:
console.log('🔍 [HTML Processor] Análisis de contenido:', analysis);
console.log('✅ [ContentRenderer] Renderizando como HTML');
console.log('⚠️ [ContentRenderer] Contenido HTML detectado pero no seguro');
```

## Ejemplos de Uso

### Caso Básico
```jsx
import ContentRenderer from '../components/ContentRenderer';

function MiComponente({ contenido }) {
  return (
    <div className="mi-contenido">
      <ContentRenderer content={contenido} />
    </div>
  );
}
```

### Caso Avanzado con Control de Errores
```jsx
import ContentRenderer, { useContentRenderer } from '../components/ContentRenderer';

function ComponenteAvanzado({ contenido }) {
  const {
    processed,
    analysis,
    needsHTML,
    isSafe,
    error
  } = useContentRenderer(contenido, {
    sanitize: true,
    enhanceContent: true
  });

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <ContentRenderer
      content={contenido}
      showDebugInfo={true}
      fallback={<div>Contenido no disponible</div>}
    />
  );
}
```

## Compatibilidad

- ✅ Compatible con contenido generado por PageBuilder
- ✅ Compatible con comentarios existentes
- ✅ Compatible con publicaciones existentes
- ✅ Mantiene funcionalidad existente
- ✅ Funciona con entidades HTML escapadas
- ✅ Soporta elementos estructurales complejos

## Mejores Prácticas

1. **Usar siempre sanitización**: Habilitar `sanitize: true` para contenido de usuarios
2. **Procesar entidades**: Habilitar `processEntities: true` para contenido escapado
3. **Mejorar contenido**: Habilitar `enhanceContent: true` para mejor UX móvil
4. **Manejar errores**: Proporcionar fallbacks apropiados
5. **Debug en desarrollo**: Usar `showDebugInfo` en modo desarrollo

## Troubleshooting

### Problemas Comunes

**Etiquetas HTML visibles en lugar de renderizadas:**
- Verificar que `allowHTML` esté habilitado
- Comprobar que el contenido pase la sanitización
- Revisar logs de debug para identificar problemas

**Contenido escapado no se procesa:**
- Habilitar `processEntities: true`
- Verificar que las entidades sean válidas

**Problemas de seguridad:**
- Asegurar que `sanitize` esté habilitado
- Revisar logs para detectar contenido peligroso
- Usar `showDebugInfo` para debugging

## Contribución

Al modificar este sistema:
1. Mantener compatibilidad hacia atrás
2. Agregar tests para nuevas funcionalidades
3. Documentar cambios en este README
4. Probar con contenido malicioso para seguridad
5. Verificar rendimiento con contenido grande