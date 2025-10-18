## Funcionalidades actuales

### Backend (Node.js/TypeScript)
- API RESTful con endpoints para usuarios, páginas, publicaciones, comentarios y feed público.
- Autenticación con JWT y protección CSRF en operaciones sensibles.
- Registro y login de usuarios.
- Creación automática de página personal al registrar usuario.
- Sistema de publicaciones: crear, listar y ver publicaciones específicas por ID.
- Borrado total de usuario (perfil, comentarios, imágenes, feed).
- Endpoints para obtener y modificar datos de página, visibilidad, propietario, descripción y usuario.
- Gestión de comentarios: agregar, listar y actualizar comentarios por página.
- Feed público con entradas de actividad (registro, etc). Las publicaciones no se incluyen en el feed.
- Middleware de seguridad, rate limiting y logging.

### Frontend Web (React + Vite)
- Navegación SPA con React Router.
- Registro y login de usuarios con validación y feedback visual.
- Sistema de publicaciones: crear nuevas publicaciones y ver publicaciones específicas.
- Visualización y edición de página personal (título, descripción, contenido, imágenes).
- Feed público con renderizado de enlaces, fechas y avatares (solo registros de usuarios).
- Sistema de comentarios en cada página, con refresco automático tras agregar.
- Borrado de usuario con confirmación y feedback visual.
- Mensajes Toast/Snackbar para éxito/error (OutputMenu).
- Navegación entre perfiles desde comentarios y feed.
- Pruebas automáticas de UI y componentes principales.

### App móvil (React Native)
- Interfaz nativa adaptada a Android/iOS.
- Navegación entre pantallas con React Navigation (Feed, Registro, Login, Perfil).
- Registro y login de usuarios con feedback visual.
- Visualización de página personal y feed público.
- Sistema de comentarios con refresco automático tras agregar.
- Borrado de usuario con confirmación y navegación automática.
- Mensajes Toast/Snackbar para éxito/error.
- Navegación entre perfiles desde comentarios.
- Renderizado de imágenes y avatares en perfil y feed.

## Endpoints principales (API)
- `POST /api/auth/register` — Registro de usuario
- `POST /api/auth/login` — Login de usuario
- `POST /api/auth/logout` — Logout
- `POST /api/paginas/:username/publicar/:numeroDePagina` — Crear publicación
- `GET /api/paginas/:username/publicar/:numeroDePagina` — Obtener publicación específica por ID
- `GET /api/publicaciones/usuario/:username` — Listar publicaciones de usuario
- `GET /api/paginas/pagina/:username` — Obtener página por username
- `GET /api/paginas/:id` — Obtener página por ID
- `GET /api/paginas/:id/comentarios` — Listar comentarios de página
- `POST /api/paginas/:id/comentarios` — Agregar comentario
- `DELETE /api/paginas/usuario/:id` — Borrar usuario y todo su rastro
- `GET /api/feed` — Obtener feed público (solo registros de usuarios)

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
- Feed con renderizado de enlaces y fechas amigables.

### App móvil (React Native)
- Interfaz y navegación adaptadas a móvil usando React Navigation.
- Agregar comentarios y refresco automático de la lista tras publicar.
- Mensajes Toast/Snackbar para feedback de usuario.
- Borrado de usuario con confirmación y navegación automática.
- Feed y perfil de usuario con renderizado nativo y visual moderno.
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
4. Abre en tu navegador: `http://localhost:5173`

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

En el backend:
```sh
npm test -- --coverage
```
El reporte de cobertura se genera en la carpeta `backend/coverage` y se sube como artefacto en CI.

## Autor
zarkius

## Licencia
MIT
