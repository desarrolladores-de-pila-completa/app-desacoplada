# Dockerfile para Backend App Desacoplada
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado
COPY src/ ./src/

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Cambiar propiedad de archivos
RUN chown -R backend:nodejs /app
USER backend

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["node", "src/index.js"]