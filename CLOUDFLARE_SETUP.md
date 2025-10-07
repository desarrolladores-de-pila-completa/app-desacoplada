# Configuración de URLs para Cloudflare

## Cambios Realizados

### ✅ Frontend (React/Vite)

1. **Configuración centralizada de APIs**:
   - Creado `src/config/api.js` para manejar URLs dinámicamente
   - Variables de entorno en `.env` (desarrollo) y `.env.production` (producción)

2. **Archivos actualizados**:
   - `src/App.jsx` - URLs de autenticación y feed
   - `src/components/AgregarComentario.jsx` - API para comentarios
   - `src/hooks/useAuthUser.js` - Hook de autenticación
   - `src/components/FotoPerfil.jsx` - Subida de fotos de perfil
   - `src/components/ImageGrid.jsx` - Galería de imágenes
   - `src/components/UserHeader.jsx` - Actualización de nombres de usuario
   - `src/components/UserPage.jsx` - Página de usuario
   - `vite.config.js` - Proxy para desarrollo

3. **Nuevos scripts**:
   - `npm run build:prod` - Build para producción con variables de entorno correctas

### ✅ Backend (Node.js/Express)

1. **Configuración CORS actualizada**:
   - Agregados dominios de Cloudflare: `https://yposteriormente.com` y `https://api.yposteriormente.com`
   - Mantenidos dominios de desarrollo para testing local

## Configuración de Cloudflare Tunnel

### Archivo de configuración sugerido (`config.yml`):

```yaml
tunnel: <your-tunnel-uuid>
credentials-file: ~/.cloudflared/<tunnel-uuid>.json

ingress:
  # Frontend principal
  - hostname: yposteriormente.com
    service: http://localhost:5173  # Desarrollo
    # service: http://localhost:4173  # Preview de build

  # API Backend  
  - hostname: api.yposteriormente.com
    service: http://localhost:3000

  # Catch-all
  - service: http_status:404
```

## Comandos para Deployment

### Desarrollo Local:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Cloudflare Tunnel
cloudflared tunnel run <tunnel-name>
```

### Producción:
```bash
# 1. Build del frontend para producción
cd frontend
npm run build:prod

# 2. Servir build con preview
npm run preview

# 3. Backend (ya está configurado)
cd backend
npm start

# 4. Tunnel (apunta a preview del frontend)
cloudflared tunnel run <tunnel-name>
```

## Verificación

### ✅ Verificar que funciona:

1. **URLs del frontend ahora usan**:
   - Desarrollo: `http://localhost:3000/api/*`
   - Producción: `https://api.yposteriormente.com/api/*`

2. **CORS del backend permite**:
   - `https://yposteriormente.com` (frontend)
   - `https://api.yposteriormente.com` (API)

3. **Error 1033 debería resolverse** cuando:
   - Backend esté corriendo en `localhost:3000`
   - Cloudflare Tunnel esté configurado correctamente
   - DNS apunte a Cloudflare

## Configuración adicional para Cloudflare Pages

### ✅ Archivos creados para SPA routing:

1. **`public/_redirects`** - Configuración de redirecciones para Cloudflare Pages
2. **`public/_headers`** - Headers de seguridad y CORS
3. **`public/_config.yml`** - Configuración alternativa de Cloudflare
4. **`functions/api/[[path]].js`** - Función de proxy para API (respaldo)

### 📋 **Deployment en Cloudflare Pages**:

1. **Conecta tu repositorio** en el dashboard de Cloudflare Pages
2. **Configuración de build**:
   - Build command: `npm run build:prod`
   - Build output directory: `dist`
   - Root directory: `frontend`

3. **Variables de entorno en Cloudflare Pages**:
   ```
   NODE_VERSION = 18
   VITE_API_URL = https://api.yposteriormente.com
   VITE_API_BASE = https://api.yposteriormente.com/api
   ```

## Troubleshooting

### Error 404 en rutas de React (como `/pagina/xxxxx`):

Si obtienes Error 404 al acceder directamente a URLs:

1. **Verifica que `_redirects` esté en el build**:
   ```bash
   cd frontend
   npm run build:prod
   ls dist/_redirects  # Debe existir
   ```

2. **Redeploy en Cloudflare Pages** después de agregar los archivos de configuración

3. **Verificar en Cloudflare Pages dashboard** que las reglas de redirect están activas

### Error 1033 (Tunnel):

```bash
# Verificar que el backend responde
curl http://localhost:3000/api/feed

# Verificar el tunnel
cloudflared tunnel --loglevel debug run <tunnel-name>

# Verificar DNS
nslookup api.yposteriormente.com
```

### Verificación completa:

```bash
# 1. Backend funcionando
curl https://api.yposteriormente.com/api/feed

# 2. Frontend funcionando
curl https://yposteriormente.com

# 3. SPA routing funcionando
curl https://yposteriormente.com/pagina/test
# Debería devolver el contenido de index.html, no 404
```

## ✅ Solución Final

Con estos cambios:
- ✅ **Error 1033** se resuelve (Tunnel funcionando)
- ✅ **Error 404** se resuelve (SPA routing configurado)
- ✅ **APIs funcionan** (Proxy configurado)
- ✅ **React Router funciona** (Redirects configurados)

El frontend ahora está completamente configurado para funcionar en Cloudflare Pages con tu backend en Cloudflare Tunnel.