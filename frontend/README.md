# Frontend Web - App Desacoplada

Aplicación web React construida con Vite para el proyecto app-desacoplada.

## Características

- **React 19** con hooks modernos
- **Vite** para desarrollo rápido y build optimizado
- **React Router** para navegación SPA
- **React Query (TanStack Query)** para gestión de estado del servidor
- **Zustand** para estado global de autenticación
- **ESLint** configurado para calidad de código

## Funcionalidades

- Registro y login de usuarios
- Creación y visualización de publicaciones
- Sistema de páginas de usuario con imágenes y comentarios
- Feed público
- Navegación entre perfiles
- Mensajes de feedback (Toast/Snackbar)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Configuración

- **Puerto Frontend**: 5173
- **Backend API**: Se conecta a `http://localhost:3000` para la API REST
- **WebSocket**: Conexión a `ws://localhost:3003` para chat en tiempo real
- **CORS**: Configurado para permitir origen `http://localhost:5173`

## Build

```bash
npm run build
```

## Pruebas

```bash
npm run test
```

## Estructura del Proyecto

- `src/components/` - Componentes React (auth, content, feed, main, ui, user)
- `src/hooks/` - Hooks personalizados (useFeed, useUserPage, etc.)
- `src/stores/` - Stores Zustand para estado global
- `src/config/` - Configuración de API (api.js)
- `src/services/` - Servicios para API (authService.js, uploadService.js)
- `src/tests/` - Pruebas

## Integración con Backend

El frontend se integra con el backend a través de:

- **API REST**: Llamadas a `http://localhost:3000/api/*` para autenticación, páginas, publicaciones, etc.
- **WebSocket**: Conexión a `ws://localhost:3003` para chat global y privado.
- **Configuración CORS**: Permite solicitudes desde `http://localhost:5173`.
