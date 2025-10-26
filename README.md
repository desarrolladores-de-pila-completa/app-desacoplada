## Funcionalidades actuales

### Backend (Node.js/TypeScript)
- API RESTful con endpoints para usuarios, páginas, publicaciones y comentarios.
- Autenticación con JWT y protección CSRF en operaciones sensibles.
- Registro y login de usuarios.
- Creación automática de página personal al registrar usuario.
- Sistema de publicaciones: crear, listar y ver publicaciones específicas por ID.
- Borrado total de usuario (perfil, comentarios, imágenes).
- Endpoints para obtener y modificar datos de página, visibilidad, propietario, descripción y usuario.
- Gestión de comentarios: agregar, listar y actualizar comentarios por página.
- Middleware de seguridad, rate limiting y logging.

### Frontend Web (React + Vite)
- Navegación SPA con React Router.
- Registro y login de usuarios con validación y feedback visual.
- Sistema de publicaciones: crear nuevas publicaciones y ver publicaciones específicas.
- Visualización y edición de página personal (título, descripción, contenido, imágenes).
- Lista de usuarios registrados con enlaces a sus perfiles.
- Sistema de comentarios en cada página, con refresco automático tras agregar.
- Borrado de usuario con confirmación y feedback visual.
- Mensajes Toast/Snackbar para éxito/error (OutputMenu).
- Navegación entre perfiles desde comentarios.
- Pruebas automáticas de UI y componentes principales.

### App móvil (React Native)
- Interfaz nativa adaptada a Android/iOS.
- Navegación entre pantallas con React Navigation (Registro, Login, Perfil).
- Registro y login de usuarios con feedback visual.
- Visualización de página personal y lista de usuarios.
- Sistema de comentarios con refresco automático tras agregar.
- Borrado de usuario con confirmación y navegación automática.
- Mensajes Toast/Snackbar para éxito/error.
- Navegación entre perfiles desde comentarios.
- Renderizado de imágenes y avatares en perfil.

## Endpoints API Completos

### 🔐 Autenticación (`/api/auth/`)
- `GET /api/auth/users` — Listar todos los usuarios
- `GET /api/auth/user/:id/foto` — Obtener foto de perfil pública por ID de usuario
- `POST /api/auth/register` — Registro de nuevo usuario
- `POST /api/auth/login` — Inicio de sesión de usuario
- `POST /api/auth/refresh` — Refrescar tokens de autenticación
- `POST /api/auth/logout` — Cerrar sesión
- `DELETE /api/auth/user/:id` — Eliminar usuario completamente

### 📄 Páginas (`/api/paginas/`)
- `POST /api/pagina` — Crear nueva página (requiere autenticación)
- `GET /api/paginas/` — Obtener páginas públicas
- `GET /api/paginas/pagina/:username` — Página unificada por username con acciones múltiples
- `GET /api/paginas/:username` — Página por username (compatibilidad)
- `GET /api/paginas/pagina/id/:user_id` — Obtener página por ID de usuario
- `POST /api/paginas/:id/usuario` — Actualizar nombre de usuario de página (requiere autenticación)
- `PUT /api/paginas/pagina/:username/nombre` — Actualizar nombre de página (requiere autenticación)
- `PUT /api/paginas/pagina/:username/foto` — Actualizar foto de página (requiere autenticación)
- `POST /api/paginas/pagina/:id/comentarios` — Agregar comentario a página (requiere autenticación)
- `DELETE /api/paginas/pagina/:id/comentarios/:commentId` — Eliminar comentario (requiere autenticación)
- `POST /api/paginas/pagina/:id/imagenes` — Subir imagen a página (requiere autenticación)
- `DELETE /api/paginas/pagina/:id/imagenes/:idx` — Eliminar imagen de página (requiere autenticación)
- `GET /api/paginas/pagina/:id/imagenes` — Obtener imágenes de página
- `POST /api/paginas/upload-comment-image` — Subir imagen para comentario (requiere autenticación)
- `GET /api/paginas/comment-images/:id` — Servir imagen de comentario
- `POST /api/paginas/guardar-pagina` — Guardar página creada con PageBuilder (requiere autenticación)

### 💬 Comentarios
- **Nota**: Los comentarios ahora se incluyen automáticamente en la respuesta del endpoint unificado `/api/paginas/pagina/:username?action=info`

## Seguridad
- Protección CSRF en operaciones POST/PUT/DELETE usando tokens sincronizados
- Autenticación JWT con cookies HttpOnly
- Rate limiting general (100 solicitudes por minuto por IP) y específico para autenticación (100 en desarrollo, 5 en producción por 15 minutos) y usuarios (10 por minuto)
- Validación de entrada con Zod
- Sanitización de HTML en contenido
- Logging detallado con Winston
- Pruebas automáticas y análisis de seguridad
- Dependencias auditadas y ramas protegidas

# app-desacoplada

Proyecto desacoplado con backend Node.js/TypeScript, frontend web (React + Vite) y app móvil (React Native).

## Novedades y mejoras recientes

### Web (frontend)
- Migración a React + Vite para mejor rendimiento y desarrollo moderno.
- Navegación mejorada con React Router.
- Sistema de comentarios en tiempo real.
- Mensajes de éxito/error tipo Toast/Snackbar (OutputMenu).
- Borrado de usuario con confirmación y feedback visual.
- Lista de usuarios con enlaces a sus perfiles.
- **Corrección de build**: Removidas referencias a paquetes no utilizados en `vite.config.js` para evitar errores de resolución durante el build.

### App móvil (React Native)
- Interfaz y navegación adaptadas a móvil usando React Navigation.
- Agregar comentarios y refresco automático de la lista tras publicar.
- Mensajes Toast/Snackbar para feedback de usuario.
- Borrado de usuario con confirmación y navegación automática.
- Perfil de usuario con renderizado nativo y visual moderno.
- Navegación entre perfiles desde comentarios.

## Estructura
- `backend/`: API REST con autenticación y rutas de ejemplo.
- `frontend/`: Web moderna con React + Vite.
- `react-native/mobile/`: App móvil multiplataforma.


## Variables de entorno

### Backend
Revisa y copia el archivo `backend/.env.example` como `.env` en la carpeta `backend` y completa los valores requeridos (puerto, JWT, base de datos, etc).

### Frontend
Revisa y copia el archivo `frontend/.env.example` como `.env` en la carpeta `frontend` y ajusta las URLs según el entorno.

## Instalación

### Backend
1. Ve al directorio `backend`.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Ejecuta el servidor:
   ```sh
   npm start
   ```

### Frontend Web
1. Ve al directorio `frontend`.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Ejecuta la app:
   ```sh
   npm run dev
   ```
4. Abre en tu navegador: `http://localhost:3000`

### App móvil (React Native)
1. Ve al directorio `react-native/mobile`.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Ejecuta Metro:
   ```sh
   npm start
   ```
4. En otra terminal, ejecuta la app:
   ```sh
   npm run android # o npm run ios
   ```


## Pruebas y cobertura

### Backend
```sh
npm test -- --coverage
```
El reporte de cobertura se genera en la carpeta `backend/coverage` y se sube como artefacto en CI.

### Frontend
Para ejecutar las pruebas en el frontend (si están configuradas):
```sh
# Nota: Verifica si hay un script de test en package.json; de lo contrario, usa Jest directamente
npm test
```
Las pruebas están en `frontend/src/tests/`.

### React Native
Para ejecutar las pruebas en la app móvil:
```sh
npm test
```
Además, para linting:
```sh
npm run lint
```

## CI/CD

El proyecto utiliza GitHub Actions para automatización continua:

- **CI Backend**: Ejecuta tests y genera reportes de cobertura en pushes y pull requests a la rama `desarrollo1`.
- **Análisis de Seguridad**: Usa CodeQL para detectar vulnerabilidades y mantener la seguridad del código.

## Autor
zarkius

## Licencia
MIT
