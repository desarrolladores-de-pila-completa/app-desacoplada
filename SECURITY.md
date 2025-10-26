# Política de Seguridad

## Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad en este proyecto, por favor repórtala de manera responsable. Envía un email a [tu-email@ejemplo.com] con detalles de la vulnerabilidad. No publiques información sobre vulnerabilidades en issues públicos hasta que sean corregidas.

## Medidas de Seguridad Implementadas

### Autenticación y Autorización
- **JWT (JSON Web Tokens)**: Usados para autenticación stateless con expiración configurable.
- **Cookies HttpOnly**: Los tokens JWT se almacenan en cookies HttpOnly para prevenir acceso desde JavaScript.
- **Protección CSRF**: Implementada con tokens sincronizados para todas las operaciones POST/PUT/DELETE.
  - Excepciones para aplicaciones móviles (React Native) que usan headers en lugar de cookies.

### Rate Limiting
- **Límite general**: 100 solicitudes por minuto por dirección IP.
- **Límite de autenticación**: 100 intentos en desarrollo, 5 en producción por ventana de 15 minutos.
- **Límite de usuario**: 10 operaciones críticas por minuto por usuario autenticado.

### Validación y Sanitización
- **Validación de entrada**: Usando Zod para schemas de validación en endpoints críticos.
- **Sanitización de HTML**: Contenido de publicaciones y comentarios se sanitiza para prevenir XSS.
- **Validación de archivos**: Solo se permiten tipos MIME específicos para uploads de imágenes.

### Base de Datos
- **Consultas parametrizadas**: Todas las consultas SQL usan parámetros para prevenir SQL injection.
- **Conexión segura**: Pool de conexiones MySQL con configuración avanzada.
- **Migraciones seguras**: Alter tables incluyen checks para evitar errores en producción.

### Logging y Monitoreo
- **Winston logger**: Logging estructurado con niveles configurables.
- **Eventos de conexión**: Monitoreo de conexiones a la base de datos.
- **Logs de seguridad**: Registros de intentos de autenticación fallidos y operaciones sensibles.

### Configuración de Producción
- **Variables de entorno**: Configuración sensible almacenada en variables de entorno.
- **CORS configurado**: Orígenes permitidos explícitamente.
- **Headers de seguridad**: Configuración de headers para prevenir ataques comunes.

### Pruebas de Seguridad
- **Pruebas unitarias**: Cobertura de funciones críticas.
- **Auditoría de dependencias**: npm audit ejecutado regularmente.
- **Análisis estático**: ESLint y TypeScript para prevenir errores comunes.

## Mejores Prácticas Recomendadas

### Para Desarrolladores
- Nunca commitear credenciales o keys en el código.
- Usar variables de entorno para configuración sensible.
- Mantener dependencias actualizadas y auditar regularmente.
- Implementar validación en todas las entradas de usuario.

### Para Usuarios
- Usar contraseñas fuertes y únicas.
- No compartir tokens de autenticación.
- Reportar cualquier comportamiento sospechoso.

## Contacto

Para preguntas sobre seguridad, contacta al mantenedor del proyecto.
