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
- Feed público
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

## API Endpoints

Ver documentación en el README principal del proyecto.