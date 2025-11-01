# Guía de Despliegue - Aplicación Desacoplada

Esta guía explica cómo desplegar la aplicación en producción con los dominios `yposteriormente.com` (frontend) y `api.yposteriormente.com` (backend).

## 📋 Requisitos Previos

- Node.js 18+ instalado
- npm instalado
- Servidor web con soporte HTTPS
- Base de datos MySQL configurada
- Certificados SSL para ambos dominios

## 🚀 Despliegue Automático

### Usando el script de despliegue

```bash
# Hacer ejecutable el script (solo en Linux/Mac)
chmod +x deploy.sh

# Ejecutar el despliegue
./deploy.sh
```

### Despliegue manual

#### 1. Construir el backend

```bash
cd backend
npm install
npm run build
```

#### 2. Construir el frontend

```bash
cd frontend
npm install
NODE_ENV=production npm run build
```

## 🔧 Configuración del Servidor

### Backend (api.yposteriormente.com)

1. **Subir archivos**: Copia el contenido de `backend/dist/` al servidor
2. **Variables de entorno**: Crea un archivo `.env` con:

```env
NODE_ENV=production
COOKIE_DOMAIN=api.yposteriormente.com
ALLOWED_ORIGINS=https://yposteriormente.com
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui
DB_HOST=tu_host_db
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=tu_nombre_db
PORT=3000
```

3. **Configurar HTTPS**: Asegúrate de que el servidor tenga SSL configurado
4. **WebSocket**: El servidor WebSocket se ejecutará en el puerto 3003 automáticamente

### Frontend (yposteriormente.com)

1. **Subir archivos**: Copia el contenido de `frontend/dist/` al servidor
2. **Configurar servidor web**: Para Apache/Nginx, configura para servir archivos estáticos
3. **Configurar HTTPS**: SSL obligatorio para producción

## 🔒 Configuración de Seguridad

### HTTPS Obligatorio

- El frontend debe servir exclusivamente sobre HTTPS
- El backend debe tener SSL configurado
- Las cookies están configuradas para `secure: true` en producción

### Headers de Seguridad

El backend incluye automáticamente headers de seguridad:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Cross-Origin-Opener-Policy`

### CORS

Configurado para permitir únicamente:
- `https://yposteriormente.com` (frontend)
- `https://api.yposteriormente.com` (backend)

## 🌐 Configuración de Dominios

### DNS

Asegúrate de que los DNS estén configurados:
- `yposteriormente.com` → IP del servidor frontend
- `api.yposteriormente.com` → IP del servidor backend

### Certificados SSL

- Obtén certificados SSL para ambos dominios
- Configura renovación automática (Let's Encrypt recomendado)

## 📊 Monitoreo

### Logs

Los logs del backend se escriben a archivos configurados en `backend/src/utils/logger.ts`

### Health Checks

Endpoints disponibles:
- `GET /api/health` - Verificar estado del backend
- `GET /api/test-db` - Verificar conexión a BD

## 🔄 Actualizaciones

Para actualizar la aplicación:

1. Ejecuta el script de despliegue nuevamente
2. Sube los nuevos archivos a los servidores
3. Reinicia los servicios si es necesario
4. Verifica que todo funcione correctamente

## 🐛 Solución de Problemas

### Problemas Comunes

1. **CORS errors**: Verifica que los dominios estén en la lista de orígenes permitidos
2. **Cookie issues**: Asegúrate de que `COOKIE_DOMAIN` esté configurado correctamente
3. **WebSocket no conecta**: Verifica que el puerto 3003 esté abierto y accesible
4. **HTTPS mixed content**: Asegúrate de que todas las URLs usen HTTPS

### Debugging

- Revisa los logs del backend para errores
- Usa las herramientas de desarrollo del navegador para inspeccionar requests
- Verifica la configuración de CORS en las respuestas del servidor

## 📞 Soporte

Si encuentras problemas durante el despliegue, revisa:
1. Los logs de error del servidor
2. La configuración de variables de entorno
3. La configuración de DNS y SSL
4. Los permisos de archivos en el servidor