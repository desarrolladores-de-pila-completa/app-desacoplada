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

Crear archivo `.env` en el directorio `backend/` basado en `.env.example`:

```env
PORT=3000
JWT_SECRET=tu_jwt_secreto
JWT_EXPIRES_IN=1d
DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=app1
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

- **PORT**: Puerto del servidor backend (3000)
- **JWT_SECRET**: Secreto para tokens JWT
- **DB_NAME**: Nombre de la base de datos principal (app1)
- **CORS_ORIGIN**: Origen permitido para CORS (http://localhost:5173 para frontend)

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

- **Bases de datos**: app1 (principal), vvveb (secundaria)
- **Tablas principales**: users, paginas, comentarios, imagenes_comentarios, imagenes

## WebSocket

El servidor incluye un servidor WebSocket para funcionalidades en tiempo real como chat.

- **Puerto**: 3003
- **Funcionalidades**: Chat global y privado

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

### 📄 Páginas (`/api/pagina/`)
- `POST /api/pagina/` — Crear nueva página (requiere autenticación)
- `GET /api/pagina/` — Obtener páginas públicas
- `GET /api/pagina/:username` — Página unificada por username con acciones múltiples (info, galeria, comentarios, lista)
- `GET /api/pagina/:username` — Página por username (compatibilidad)
- `GET /api/pagina/id/:user_id` — Obtener página por ID de usuario
- `POST /api/pagina/:id/usuario` — Actualizar nombre de usuario de página (requiere autenticación)
- `POST /api/pagina/:id/comentarios` — Agregar comentario a página (requiere autenticación)
- `DELETE /api/pagina/:id/comentarios/:commentId` — Eliminar comentario (requiere autenticación)
- `POST /api/pagina/:id/imagenes` — Subir imagen a página (requiere autenticación)
- `GET /api/pagina/:id/imagenes` — Obtener imágenes de página
- `POST /api/pagina/upload-comment-image` — Subir imagen para comentario (requiere autenticación)
- `GET /api/pagina/comment-images/:id` — Servir imagen de comentario
- `DELETE /api/pagina/usuario/:id` — Borrar usuario y todo su rastro (requiere autenticación)
- `POST /api/pagina/guardar-pagina` — Guardar página creada con PageBuilder (requiere autenticación)


### 💬 Comentarios
- **Nota**: Los comentarios ahora se incluyen automáticamente en la respuesta del endpoint unificado `/api/pagina/:username?action=info`


### 🔧 Utilidades
- `GET /api/csrf-token` — Obtener token CSRF para protección de formularios

## Seguridad Implementada
- **Autenticación JWT** con cookies HttpOnly
- **Protección CSRF** en operaciones sensibles
- **Rate Limiting** por IP y por usuario
- **Validación de entrada** con Zod
- **Sanitización de HTML** en contenido
- **Logging detallado** con Winston