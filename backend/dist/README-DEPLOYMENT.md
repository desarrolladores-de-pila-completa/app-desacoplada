# Despliegue Backend - App Desacoplada

## 📁 Archivos de Producción Compilados

Este directorio `dist/` contiene todos los archivos compilados de TypeScript a JavaScript listos para producción.

## 🚀 Instrucciones de Despliegue en Servidor Node.js

### 1. Preparar el Servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+ y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalaciones
node --version
npm --version
pm2 --version
```

### 2. Subir Archivos

```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/app-desacoplada-backend
sudo chown -R $USER:$USER /var/www/app-desacoplada-backend

# Subir el contenido de dist/ al servidor
scp -r dist/* usuario@servidor:/var/www/app-desacoplada-backend/
```

### 3. Configurar el Entorno

```bash
cd /var/www/app-desacoplada-backend

# Instalar dependencias
npm install --production

# Configurar variables de entorno
cp .env.production .env

# Editar .env con tus valores reales
nano .env
```

### 4. Configurar Base de Datos

Si usas PostgreSQL:

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Crear usuario y base de datos
sudo -u postgres psql

CREATE DATABASE app_desacoplada_prod;
CREATE USER tu_usuario_db WITH ENCRYPTED PASSWORD 'tu_password_db';
GRANT ALL PRIVILEGES ON DATABASE app_desacoplada_prod TO tu_usuario_db;
\\q
```

### 5. Iniciar con PM2

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.json --env production

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup
pm2 save

# Verificar estado
pm2 status
pm2 logs app-desacoplada-backend
```

### 6. Configurar Nginx (Proxy Reverso)

```nginx
# /etc/nginx/sites-available/app-desacoplada-backend
server {
    listen 80;
    server_name api.tu-dominio.com;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.tu-dominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
    }
}
```

Activar la configuración:

```bash
sudo ln -s /etc/nginx/sites-available/app-desacoplada-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw deny 3001     # Backend directo (solo nginx)
sudo ufw enable
```

## 📊 Información de Compilación

- **Lenguaje:** TypeScript → JavaScript (ES2022)
- **Archivos principales:**
  - `src/index.js` - Punto de entrada
  - `src/controllers/` - Controladores de API
  - `src/routes/` - Definiciones de rutas
  - `src/middlewares/` - Middlewares de seguridad

## ✅ Verificación de Despliegue

1. **Verificar PM2:** `pm2 status`
2. **Revisar logs:** `pm2 logs app-desacoplada-backend`
3. **Probar API:** `curl https://api.tu-dominio.com/health`
4. **Monitorear:** `pm2 monit`

## 🔧 Comandos de Gestión

```bash
# Ver logs en tiempo real
pm2 logs app-desacoplada-backend --lines 100

# Reiniciar aplicación
pm2 restart app-desacoplada-backend

# Detener aplicación
pm2 stop app-desacoplada-backend

# Recargar sin downtime
pm2 reload app-desacoplada-backend

# Ver métricas
pm2 monit
```

## 🔄 Actualizaciones

Para futuras actualizaciones:

1. Compilar nuevo código: `npm run build`
2. Subir archivos al servidor
3. Instalar nuevas dependencias: `npm install --production`
4. Recargar PM2: `pm2 reload app-desacoplada-backend`

## 🐳 Alternativa con Docker

Si prefieres usar Docker, se incluye un Dockerfile básico en el directorio raíz.