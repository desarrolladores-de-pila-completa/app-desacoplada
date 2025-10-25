# Backend - App Desacoplada

API RESTful construida con Node.js, TypeScript y Express para el proyecto app-desacoplada.

## Características

- **Node.js** con **TypeScript** para type safety
- **Express.js** framework web
- **MySQL2** con pool de conexiones
- **JWT** para autenticación
- **bcryptjs** para hashing de contraseñas
- **Winston** para logging
- **Zod** para validación
- **express-rate-limit** para rate limiting
- **csurf** para protección CSRF

## Funcionalidades

- Autenticación de usuarios (registro, login, logout)
- Gestión de páginas de usuario
- Sistema de publicaciones
- Comentarios en páginas
- Upload de imágenes
- Borrado completo de usuarios

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Inicia el servidor con nodemon para recarga automática.

## Producción

```bash
npm start
```

Compila TypeScript y ejecuta el servidor.

## Variables de Entorno

Crear archivo `.env` en el directorio `backend/`:

```env
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=base_datos
JWT_SECRET=tu_jwt_secret
NODE_ENV=development
```

## Estructura del Proyecto

- `src/controllers/` - Controladores de rutas
- `src/routes/` - Definición de rutas
- `src/middlewares/` - Middlewares personalizados
- `src/services/` - Lógica de negocio
- `src/repositories/` - Acceso a datos
- `src/utils/` - Utilidades
- `src/types/` - Definiciones de tipos
- `src/errors/` - Manejo de errores

## Base de Datos

El sistema incluye migraciones automáticas para crear y actualizar tablas al iniciar.

## Pruebas

```bash
npm test
```

## API Endpoints Completos

### 🔐 Autenticación (`/api/auth/`)
- `GET /api/auth/user/:id/foto` — Obtener foto de perfil pública por ID de usuario
- `POST /api/auth/register` — Registro de nuevo usuario
- `POST /api/auth/login` — Inicio de sesión de usuario
- `POST /api/auth/refresh` — Refrescar tokens de autenticación
- `POST /api/auth/extend-session` — Extender sesión activa (requiere autenticación)
- `POST /api/auth/logout` — Cerrar sesión
- `DELETE /api/auth/user/:id` — Eliminar usuario completamente

### 📄 Páginas (`/api/paginas/`)
- `POST /api/paginas/` — Crear nueva página (requiere autenticación)
- `GET /api/paginas/` — Obtener páginas públicas
- `GET /api/paginas/pagina/:username` — Página unificada por username con acciones múltiples
- `GET /api/paginas/:username` — Página por username (compatibilidad)
- `GET /api/paginas/pagina/id/:user_id` — Obtener página por ID de usuario
- `POST /api/paginas/:id/usuario` — Actualizar nombre de usuario de página (requiere autenticación)
- `POST /api/paginas/:id/comentarios` — Agregar comentario a página (requiere autenticación)
- `DELETE /api/paginas/:id/comentarios/:commentId` — Eliminar comentario (requiere autenticación)
- `POST /api/paginas/:id/imagenes` — Subir imagen a página (requiere autenticación)
- `GET /api/paginas/:id/imagenes` — Obtener imágenes de página
- `POST /api/paginas/upload-comment-image` — Subir imagen para comentario (requiere autenticación)
- `GET /api/paginas/comment-images/:id` — Servir imagen de comentario
- `DELETE /api/paginas/usuario/:id` — Borrar usuario y todo su rastro (requiere autenticación)
- `POST /api/paginas/guardar-pagina` — Guardar página creada con PageBuilder (requiere autenticación)

### 📝 Publicaciones (`/api/publicaciones/`)
- `POST /api/publicaciones/` — Crear nueva publicación (requiere autenticación)
- `GET /api/publicaciones/:id` — Obtener publicación específica por ID
- `GET /api/publicaciones/usuario/:username` — Listar publicaciones de usuario
- `GET /api/publicaciones/` — Obtener todas las publicaciones

### 💬 Comentarios
- **Nota**: Los comentarios ahora se incluyen automáticamente en la respuesta del endpoint unificado `/api/paginas/pagina/:username?action=info`

### 🌐 Publicaciones específicas (`/api/paginas/`)
- `GET /api/paginas/:username/publicar/:publicacionId` — Obtener publicación específica por ID
- `POST /api/paginas/:username/publicar/:numeroDePagina` — Crear publicación en página específica (requiere autenticación)

### 💬 Chat (WebSocket + API REST) (`/api/chat/`)
- `GET /api/chat/global` — Obtener mensajes del chat global
- `GET /api/chat/private/:userId` — Obtener mensajes privados con usuario específico
- `POST /api/chat/global` — Enviar mensaje al chat global
- `POST /api/chat/private` — Enviar mensaje privado


### 🔧 Utilidades
- `GET /api/csrf-token` — Obtener token CSRF para protección de formularios

## Seguridad Implementada
- **Autenticación JWT** con cookies HttpOnly
- **Protección CSRF** en operaciones sensibles
- **Rate Limiting** por IP y por usuario
- **Validación de entrada** con Zod
- **Sanitización de HTML** en contenido
- **Logging detallado** con Winston