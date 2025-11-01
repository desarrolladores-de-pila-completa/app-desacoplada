#!/bin/bash

# Script de despliegue para la aplicación desacoplada
# Despliega frontend en yposteriormente.com y backend en api.yposteriormente.com

set -e

echo "🚀 Iniciando despliegue de la aplicación..."

# Variables de configuración
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
BUILD_DIR="dist"

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
echo "📋 Verificando dependencias..."
if ! command_exists node; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Desplegar backend
echo "🔧 Desplegando backend..."
cd "$BACKEND_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    npm install
fi

# Construir backend
echo "🔨 Construyendo backend..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: No se pudo construir el backend"
    exit 1
fi

echo "✅ Backend construido exitosamente"

# Volver al directorio raíz
cd ..

# Desplegar frontend
echo "🎨 Desplegando frontend..."
cd "$FRONTEND_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
fi

# Construir frontend para producción
echo "🔨 Construyendo frontend para producción..."
NODE_ENV=production npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: No se pudo construir el frontend"
    exit 1
fi

echo "✅ Frontend construido exitosamente"

# Volver al directorio raíz
cd ..

echo "🎉 ¡Despliegue completado exitosamente!"
echo ""
echo "📁 Archivos generados:"
echo "   - Backend: $BACKEND_DIR/dist/"
echo "   - Frontend: $FRONTEND_DIR/dist/"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Subir los archivos del backend a tu servidor en api.yposteriormente.com"
echo "   2. Subir los archivos del frontend a tu servidor en yposteriormente.com"
echo "   3. Configurar HTTPS en ambos dominios"
echo "   4. Configurar variables de entorno en el servidor backend"
echo "   5. Reiniciar servicios"
echo ""
echo "🔒 Variables de entorno requeridas para el backend:"
echo "   - NODE_ENV=production"
echo "   - COOKIE_DOMAIN=api.yposteriormente.com"
echo "   - ALLOWED_ORIGINS=https://yposteriormente.com"
echo "   - SESSION_SECRET=<tu_clave_secreta>"
echo "   - DB_HOST=<tu_host_db>"
echo "   - DB_USER=<tu_usuario_db>"
echo "   - DB_PASSWORD=<tu_password_db>"
echo "   - DB_NAME=<tu_nombre_db>"