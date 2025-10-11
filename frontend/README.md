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

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

## Pruebas

```bash
npm run test
```

## Estructura del Proyecto

- `src/components/` - Componentes React
- `src/hooks/` - Hooks personalizados (useFeed, useUserPage, etc.)
- `src/stores/` - Stores Zustand
- `src/config/` - Configuración de API
- `src/tests/` - Pruebas
