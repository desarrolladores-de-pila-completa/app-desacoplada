# App Móvil - App Desacoplada

Aplicación móvil React Native para el proyecto app-desacoplada, integrada con backend Node.js/TypeScript y frontend web.

## Características

- **React Native 0.81.4** con TypeScript
- **React Navigation** para navegación nativa
- **Axios** para llamadas API
- **Async Storage** para almacenamiento local
- **Integración con backend** para autenticación, páginas, publicaciones y comentarios
- **WebSocket** para chat en tiempo real

## Funcionalidades

- Registro y login de usuarios con validación
- Visualización y edición de página personal
- Sistema de comentarios en páginas con refresco automático
- Chat global en tiempo real
- Borrado de usuario con confirmación
- Mensajes Toast/Snackbar para feedback
- Navegación entre perfiles desde comentarios
- Renderizado de imágenes y avatares

## Instalación

### Prerrequisitos

Asegúrate de tener configurado el entorno para React Native según la [guía oficial](https://reactnative.dev/docs/set-up-your-environment).

### Pasos

1. Ve al directorio `react-native/mobile`.
2. Instala dependencias:
   ```sh
   npm install
   ```
3. Para Android, instala CocoaPods si es necesario (iOS):
   ```sh
   bundle install
   bundle exec pod install
   ```
4. Ejecuta Metro:
   ```sh
   npm start
   ```
5. En otra terminal, ejecuta la app:
   ```sh
   npm run android  # o npm run ios
   ```

## Configuración

- **Backend API**: Se conecta a `http://localhost:3000` para API REST.
- **WebSocket**: Conexión a `ws://localhost:3003` para chat en tiempo real.
- **Scripts**:
  - `npm run android`: Ejecuta en Android (incluye backend).
  - `npm run ios`: Ejecuta en iOS.
  - `npm start`: Inicia Metro bundler.

## Estructura del Proyecto

- `src/components/`: Componentes React Native (auth, content, ui, user).
- `src/contexts/`: Contextos para estado global (AuthContext).
- `src/services/`: Servicios para API y cache.
- `src/utils/`: Utilidades como configuración de API.
- `src/styles/`: Estilos globales.

## Integración con Backend

La app se integra con el backend a través de:

- **API REST**: Llamadas a `http://localhost:3000/api/*` para autenticación, páginas, etc.
- **WebSocket**: Conexión a `ws://localhost:3003` para chat global y privado.
- **Autenticación**: Usa JWT con cookies para sesiones seguras.

## Pruebas

```sh
npm test
```

## Troubleshooting

- Asegúrate de que el backend esté corriendo en puerto 3000 y WebSocket en 3003.
- Verifica la configuración de CORS en el backend para permitir el origen de la app móvil.
- Para problemas con Metro, limpia la cache: `npm start -- --reset-cache`.

## Autor

zarkius

## Licencia

MIT
