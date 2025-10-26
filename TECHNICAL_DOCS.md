# 📚 Documentación Técnica - App Desacoplada

## 🏗️ Arquitectura del Sistema

### Visión General
Aplicación web de red social con arquitectura desacoplada:
- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + Vite + React Router
- **Base de datos**: MySQL
- **Autenticación**: JWT + CSRF
- **Despliegue**: Cloudflare + VirtualBox Ubuntu

### Patrones Arquitectónicos
- **MVC**: Model-View-Controller en backend
- **SPA**: Single Page Application en frontend
- **RESTful API**: Comunicación entre capas
- **Middleware Pattern**: Autenticación y logging

---

## 🔧 Componentes Principales

### Backend (`/backend/src/`)

#### Controllers
- `authController.ts`: Registro, login, logout, eliminación de usuarios
- `paginaController.ts`: CRUD de páginas personales, visibilidad, comentarios

#### Middlewares
- `auth.ts`: Verificación JWT y usuario
- `db.ts`: Conexión MySQL y inicialización
- `errorHandler.ts`: Manejo centralizado de errores

#### Routes
- `authRoutes.ts`: Rutas de autenticación y fotos de perfil
- `paginaRoutes.ts`: Rutas de páginas, comentarios e imágenes

#### Utils
- `generarAvatarBuffer.ts`: Generación de avatares por defecto

### Frontend (`/frontend/src/`)

#### Componentes
- `App.jsx`: Componente raíz con enrutamiento
- `Navbar.jsx`: Navegación principal
- `UserPage.jsx`: Página de perfil de usuario
- `LoginPage.jsx` / `RegisterPage.jsx`: Formularios de autenticación
- `ComentariosList.jsx` / `AgregarComentario.jsx`: Sistema de comentarios
- `ImageGrid.jsx` / `FotoPerfil.jsx`: Gestión de imágenes
- `OutputMenu.jsx`: Sistema de notificaciones tipo toast

#### Hooks
- `useAuthUser.js`: Hook para obtener usuario autenticado

#### Config
- `api.js`: Configuración de URLs del API

---

## 🗄️ Modelo de Datos

### Tablas Principales

#### `users`
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,       -- Hash bcrypt
  username VARCHAR(255) NOT NULL UNIQUE,
  foto_perfil LONGBLOB,                 -- Avatar en binario
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `paginas`
```sql
CREATE TABLE paginas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,        -- FK a users
  propietario TINYINT(1) DEFAULT 0,
  titulo VARCHAR(255),
  contenido TEXT,
  descripcion VARCHAR(32) DEFAULT 'visible',
  usuario VARCHAR(255),
  comentarios TEXT,
  oculto TINYINT(1) DEFAULT 0,
  visible_titulo TINYINT(1) DEFAULT 1,
  visible_contenido TINYINT(1) DEFAULT 1,
  visible_descripcion TINYINT(1) DEFAULT 1,
  visible_usuario TINYINT(1) DEFAULT 1,
  visible_comentarios TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `comentarios`
```sql
CREATE TABLE comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pagina_id INT NOT NULL,               -- FK a paginas
  user_id VARCHAR(36) NULL,             -- FK a users
  comentario TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);
```


#### `imagenes`
```sql
CREATE TABLE imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pagina_id INT NOT NULL,               -- FK a paginas
  idx INT NOT NULL,                     -- Índice de orden
  imagen LONGBLOB,                      -- Imagen en binario
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
);
```

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación
1. **Registro**: `POST /api/auth/register`
   - Validación de email/username únicos
   - Hash de contraseña con bcrypt
   - Generación de avatar automático
   - Creación de página personal

2. **Login**: `POST /api/auth/login`
   - Verificación de credenciales
   - Generación de JWT
   - Almacenamiento en cookie httpOnly

3. **Middleware de Autenticación**:
   - Verificación de JWT en requests
   - Consulta de usuario en DB
   - Inyección de `req.user`

### Protección CSRF
- Token CSRF generado en `/api/csrf-token`
- Verificación en métodos POST/PUT/DELETE
- Excepción para apps móviles (React Native)

---

## 🛣️ API Endpoints

### Autenticación (`/api/auth`)
- `POST /register` - Registro de usuario
- `POST /login` - Login de usuario
- `POST /logout` - Logout
- `GET /me` - Usuario autenticado
- `POST /me/foto` - Actualizar foto de perfil
- `GET /me/foto` - Obtener foto propia
- `GET /user/:id/foto` - Obtener foto pública
- `DELETE /user/:id` - Eliminar usuario

### Páginas (`/api/pagina`)
- `GET /` - Lista de páginas públicas
- `GET /:id` - Página por ID
- `GET /:username` - Página por username
- `GET /:id/comentarios` - Comentarios de página
- `POST /:id/comentarios` - Agregar comentario
- `POST /:id/imagenes` - Subir imagen
- `GET /:id/imagenes` - Lista de imágenes
- `POST /:id/usuario` - Actualizar usuario de página
- `GET /:id/visibilidad` - Consultar visibilidad
- `POST /:id/visibilidad` - Actualizar visibilidad


---

## 🔧 Configuración y Despliegue

### Variables de Entorno
```bash
# Backend (.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=app1
JWT_SECRET=tu_jwt_secret_muy_seguro
PORT=3000
```

### Dependencias Clave

#### Backend
```json
{
  "express": "^5.0.0",
  "mysql2": "^3.12.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5",
  "cors": "^2.8.5",
  "cookie-parser": "^1.4.7",
  "csrf": "^3.1.0",
  "express-rate-limit": "^7.5.0"
}
```

#### Frontend
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^7.0.2",
  "vite": "^6.0.1"
}
```

### Scripts de Desarrollo
```bash
# Backend
npm run build    # Compilar TypeScript
npm run start    # Producción
npm run dev      # Desarrollo con nodemon

# Frontend  
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

---

## 🧪 Testing

### Backend Tests
- Tests unitarios con Jest
- Tests de integración de API
- Tests de seguridad y validación

### Frontend Tests
- Tests de componentes con React Testing Library
- Tests de UI y interacciones
- Tests de navegación con React Router

### Comandos de Testing
```bash
npm test                # Ejecutar todos los tests
npm run test:watch      # Modo watch
npm run test:coverage   # Coverage report
```

---

## 🔍 Monitoring y Debugging

### Logging
- Console logging con niveles de severidad
- Información de requests y respuestas
- Debugging de autenticación y CSRF

### Métricas Disponibles
- Requests por endpoint
- Usuarios autenticados
- Errores y códigos de estado
- Tiempo de respuesta

---

## 🚀 Performance

### Optimizaciones Implementadas
- Rate limiting en endpoints críticos
- Conexiones de DB con pool
- Serving de archivos estáticos
- Compression con gzip (via Cloudflare)

### Áreas de Mejora
- Caching de consultas frecuentes
- Optimización de imágenes
- Lazy loading de componentes
- Service Worker para PWA

---

## 🔒 Consideraciones de Seguridad

### Implementado
- ✅ HTTPS (Cloudflare)
- ✅ CSRF Protection
- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Input sanitization básica
- ✅ Rate limiting
- ✅ CORS policy
- ✅ Cookie security flags

### Por Implementar
- ⏳ Validación estricta de inputs
- ⏳ Sanitización de uploads
- ⏳ Logging de seguridad
- ⏳ Audit logs
- ⏳ Brute force protection

---

## 📝 Próximos Pasos

### Funcionalidades Pendientes
1. **Sistema de notificaciones** push
2. **Chat en tiempo real** con WebSockets
3. **Búsqueda avanzada** de usuarios/contenido
4. **Sistema de moderación** de contenido
5. **API móvil** optimizada

### Mejoras Técnicas
1. **Migraciones de DB** automatizadas
2. **Containerización** con Docker
3. **CI/CD pipeline** con GitHub Actions
4. **Monitoring** con Prometheus/Grafana
5. **Backup automatizado** de base de datos

---

*Documentación actualizada: Octubre 2025*