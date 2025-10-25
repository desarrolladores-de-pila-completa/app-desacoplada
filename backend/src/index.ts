import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import path from "path";
import { pool, initDatabase } from "./middlewares/db";
import csrf from "csrf";
import { configureServices } from "./utils/servicesConfig";
import { getCsrfCookieOptions } from "./utils/cookieConfig";
import { generalRateLimit } from "./middlewares/rateLimit";
import { corsOptions, corsHeaderLogger, corsDiagnosticLogger } from "./middlewares/security";
import logger from "./utils/logger";
import WebSocket from "ws";
import { IncomingMessage } from "http";

// Inicializar el container de DI antes de importar rutas
configureServices();
logger.info("Container de DI inicializado", { context: 'app' });

// Importar rutas después de inicializar DI
import { router as authRoutes } from "./routes/authRoutes";

const rootPath = path.resolve(__dirname, '../../../');

const app = express();

// Middleware para logging detallado de headers CORS
// app.use(corsHeaderLogger);

// Middleware para diagnóstico específico de problemas CORS
// app.use(corsDiagnosticLogger);

app.use(cors(corsOptions));

// Middleware para logging de CORS
app.use((req, res, next) => {
  console.log('=== CORS DEBUG ===', {
    origin: req.get('Origin'),
    method: req.method,
    url: req.originalUrl,
    context: 'cors-debug',
    timestamp: new Date().toISOString()
  });

  // Log detallado para debugging del error 426 relacionado con CORS
  if (req.originalUrl.includes('/api/csrf-token') || req.originalUrl.includes('/imagenes')) {
    console.log('🚨 CORS DEBUG 426 CANDIDATE 🚨', {
      url: req.originalUrl,
      method: req.method,
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      userAgent: req.get('User-Agent'),
      headers: req.headers,
      context: 'cors-426-debug',
      timestamp: new Date().toISOString()
    });
  }

  next();
});

// WebSocket server
const wss = new WebSocket.Server({ port: 3003 });

// Log para debugging de puerto WebSocket
logger.info("Iniciando servidor WebSocket", { port: 3003, context: 'websocket' });

// Log detallado del estado del servidor WebSocket
wss.on('listening', () => {
  logger.info('✅ Servidor WebSocket escuchando correctamente', {
    port: 3003,
    address: wss.address(),
    context: 'websocket'
  });
});

// Manejar errores de binding del puerto WebSocket
wss.on('error', (error: Error & { code?: string }) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('🚨 Puerto WebSocket 3003 ya está en uso', {
      error: error.message,
      code: error.code,
      port: 3003,
      context: 'websocket',
      suggestion: 'Detener otros servidores que puedan estar usando el puerto 3003'
    });
  } else {
    logger.error('🚨 Error en servidor WebSocket', {
      error: error.message,
      code: error.code,
      context: 'websocket'
    });
  }
});
const clients = new Map<string, WebSocket>();
const rooms = new Map<string, Set<string>>(); // sala -> Set de userIds

// Crear sala global por defecto
rooms.set('global', new Set());

console.log('=== WEBSOCKET SERVER INIT DEBUG ===', {
  timestamp: new Date().toISOString(),
  clientsSize: clients.size,
  roomsSize: rooms.size,
  globalRoomExists: rooms.has('global'),
  globalRoomSize: rooms.get('global')?.size || 0,
  context: 'websocket-server-init-debug'
});

logger.info('Servidor WebSocket inicializado en puerto 3003', { context: 'websocket' });

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  logger.info('🔗 Nueva conexión WebSocket establecida', {
    remoteAddress: request.socket.remoteAddress,
    remotePort: request.socket.remotePort,
    url: request.url,
    headers: request.headers,
    context: 'websocket'
  });

  // Log adicional para debugging de conexiones
  console.log('=== WEBSOCKET CONNECTION DEBUG ===', {
    timestamp: new Date().toISOString(),
    remoteAddress: request.socket.remoteAddress,
    remotePort: request.socket.remotePort,
    url: request.url,
    userAgent: request.headers['user-agent'],
    origin: request.headers['origin'],
    context: 'websocket-debug'
  });

  ws.on('message', async (message: Buffer) => {
    try {
      const messageStr = message.toString();
      console.log('=== WEBSOCKET MESSAGE DEBUG ===', {
        timestamp: new Date().toISOString(),
        messageLength: messageStr.length,
        messagePreview: messageStr.substring(0, 200),
        context: 'websocket-message-debug'
      });

      const data = JSON.parse(messageStr);

      if (data.type === 'register' && data.userId) {
        console.log('=== WEBSOCKET REGISTER DEBUG ===', {
          timestamp: new Date().toISOString(),
          userId: data.userId,
          clientsBefore: clients.size,
          context: 'websocket-register-debug'
        });

        clients.set(data.userId, ws);

        // Agregar usuario a la sala global
        const globalRoomRegister = rooms.get('global');
        if (globalRoomRegister) {
          globalRoomRegister.add(data.userId);
          console.log('=== WEBSOCKET ROOM ADD DEBUG ===', {
            timestamp: new Date().toISOString(),
            userId: data.userId,
            globalRoomSize: globalRoomRegister.size,
            context: 'websocket-room-add-debug'
          });
        } else {
          console.error('=== WEBSOCKET ROOM ERROR ===', {
            timestamp: new Date().toISOString(),
            error: 'Sala global no encontrada',
            roomsSize: rooms.size,
            context: 'websocket-room-error'
          });
        }

        logger.info(`Usuario registrado en WebSocket y unido a sala global: ${data.userId}`, { context: 'websocket' });

        console.log('=== WEBSOCKET REGISTER SUCCESS ===', {
          timestamp: new Date().toISOString(),
          userId: data.userId,
          clientsAfter: clients.size,
          context: 'websocket-register-success'
        });

        // Notificar a otros usuarios que este usuario está en línea
        // Para usuarios registrados, obtener su display_name
        // Para usuarios invitados, usar el nombre directamente
        let displayName = data.userId;

        // Notificar solo a usuarios en la sala global
        const globalRoomDisconnect = rooms.get('global')!;
        globalRoomDisconnect.forEach((userId) => {
          if (userId !== data.userId) {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'user_online',
                username: displayName
              }));
            }
          }
        });
      } else if (data.type === 'private_message' && data.to && data.message) {
        // Manejar mensaje privado
        const targetClient = clients.get(data.to);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({
            type: 'private_message',
            data: {
              id: Date.now(),
              sender_username: data.from,
              receiver_username: data.to,
              message: data.message,
              created_at: new Date().toISOString()
            }
          }));
          logger.info(`Mensaje privado enviado de ${data.from} a ${data.to}`, { context: 'websocket' });
        } else {
          logger.warn(`Cliente destino ${data.to} no encontrado o no conectado`, { context: 'websocket' });
        }
      } else if (data.type === 'global_message' && data.message) {
        // Manejar mensaje global
        const globalRoomMessage = rooms.get('global')!;
        globalRoomMessage.forEach((userId) => {
          if (userId !== data.from) {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'global_message',
                data: {
                  id: Date.now(),
                  username: data.from,
                  message: data.message,
                  created_at: new Date().toISOString()
                }
              }));
            }
          }
        });
        logger.info(`Mensaje global enviado por ${data.from}`, { context: 'websocket' });
      } else if (data.type === 'private_message' && data.to && data.message) {
        // Manejar mensaje privado
        const targetClient = clients.get(data.to);
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({
            type: 'private_message',
            data: {
              id: Date.now(),
              sender_username: data.from,
              receiver_username: data.to,
              message: data.message,
              created_at: new Date().toISOString()
            }
          }));
          logger.info(`Mensaje privado enviado de ${data.from} a ${data.to}`, { context: 'websocket' });
        } else {
          logger.warn(`Cliente destino ${data.to} no encontrado o no conectado`, { context: 'websocket' });
        }
      }
    } catch (error) {
      logger.error('🚨 Error procesando mensaje WebSocket:', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        context: 'websocket'
      });

      console.error('=== WEBSOCKET MESSAGE ERROR DEBUG ===', {
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
        stack: (error as Error).stack,
        messagePreview: message.toString().substring(0, 100),
        context: 'websocket-message-error-debug'
      });

      // Enviar error al cliente para debugging
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error procesando mensaje en servidor',
        error: (error as Error).message
      }));
    }
  });

  ws.on('close', async (code: number, reason: Buffer) => {
    logger.warn('🔌 Conexión WebSocket cerrada', {
      code,
      reason: reason.toString(),
      context: 'websocket'
    });

    // Log detallado para debugging
    console.log('=== WEBSOCKET CLOSE DEBUG ===', {
      timestamp: new Date().toISOString(),
      closeCode: code,
      reason: reason.toString(),
      context: 'websocket-close-debug'
    });

    // Encontrar y remover el usuario desconectado
    let disconnectedUser: string | undefined;
    for (const [userId, client] of clients.entries()) {
      if (client === ws) {
        disconnectedUser = userId;
        clients.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      logger.info(`Usuario desconectado de WebSocket: ${disconnectedUser}`, { context: 'websocket' });

      // Remover usuario de todas las salas
      rooms.forEach((roomUsers, roomName) => {
        roomUsers.delete(disconnectedUser);
      });

      // Notificar a otros usuarios que este usuario se desconectó
      // Usar el nombre directamente
      let displayName = disconnectedUser;
  
      // Notificar solo a usuarios en la sala global
      const globalRoomNotify = rooms.get('global')!;
      globalRoomNotify.forEach((userId) => {
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'user_offline',
            username: displayName
          }));
        }
      });
    }
  });

  ws.on('error', (error) => {
    logger.error('🚨 Error en conexión WebSocket:', {
      error: error.message,
      stack: error.stack,
      context: 'websocket'
    });

    // Log detallado para debugging
    console.error('=== WEBSOCKET ERROR DEBUG ===', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context: 'websocket-error-debug'
    });
  });
});
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(rootPath, 'frontend')));

// Aplicar rate limiting general a todas las rutas API
app.use("/api", generalRateLimit);

// Middleware de logging detallado para debugging del error 426
app.use("/api", (req, res, next) => {
  logger.info('=== REQUEST DEBUG ===', {
    method: req.method,
    url: req.originalUrl,
    protocol: req.protocol,
    httpVersion: req.httpVersion,
    headers: req.headers,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    context: 'debug-426'
  });

  // Log de respuesta para detectar error 426
  const originalSend = res.send;
  res.send = function(data) {
    logger.info('=== RESPONSE DEBUG ===', {
      statusCode: res.statusCode,
      url: req.originalUrl,
      method: req.method,
      context: 'debug-426'
    });

    // Si detectamos error 426, log detallado
    if (res.statusCode === 426) {
      logger.error('🚨 ERROR 426 DETECTADO 🚨', {
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        context: 'error-426'
      });
    }

    return originalSend.call(this, data);
  };

  next();
});

// Configurar CSRF con el nuevo paquete
const tokens = new csrf();
const secret = tokens.secretSync();

// Ruta para obtener el token CSRF
app.get("/api/csrf-token", (req, res) => {
  logger.info('=== CSRF TOKEN REQUEST ===', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    cookies: req.cookies,
    ip: req.ip,
    context: 'csrf-debug',
    timestamp: new Date().toISOString()
  });

  // Log específico para debugging del error 426 en CSRF
  logger.error('🚨 CSRF DEBUG 426 CANDIDATE 🚨', {
    url: req.originalUrl,
    method: req.method,
    protocol: req.protocol,
    httpVersion: req.httpVersion,
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    userAgent: req.get('User-Agent'),
    accept: req.get('Accept'),
    acceptLanguage: req.get('Accept-Language'),
    cookies: req.cookies,
    context: 'csrf-426-debug',
    timestamp: new Date().toISOString()
  });

  try {
    const token = tokens.create(secret);
    res.cookie('_csrf', token, getCsrfCookieOptions());
    res.json({ csrfToken: token });

    logger.info('=== CSRF TOKEN RESPONSE ===', {
      statusCode: res.statusCode,
      hasToken: !!token,
      context: 'csrf-debug'
    });
  } catch (error) {
    logger.error('=== CSRF TOKEN ERROR ===', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      context: 'csrf-debug'
    });
    res.status(500).json({ error: 'Error generando token CSRF' });
  }
});


// Middleware de logging para depuración CSRF
app.use(["/api", "/api/auth"], (req, res, next) => {
  const cookieCsrf = req.cookies['_csrf'];
  const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
  logger.debug('Verificando tokens CSRF', { cookieCsrf: cookieCsrf ? 'presente' : 'ausente', headerCsrf: headerCsrf ? 'presente' : 'ausente', context: 'csrf' });
  next();
});
// Aplica CSRF a rutas que modifican estado
// Solo aplicar CSRF a métodos que modifican datos
// Middleware CSRF optimizado para evitar problemas de protocolo
app.use(["/api", "/api/auth"], (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const userAgent = req.headers['user-agent'] || '';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    logger.debug('Verificando CSRF para método modificador', {
      method: req.method,
      userAgent,
      isDevelopment,
      context: 'csrf'
    });

    // En desarrollo, ser más permisivo con CSRF
    if (isDevelopment) {
      // Solo verificar CSRF para métodos críticos en desarrollo
      if (req.method === 'DELETE') {
        const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
        const cookieCsrf = req.cookies['_csrf'];
        const token = headerCsrf || cookieCsrf;

        if (!token || !tokens.verify(secret, token)) {
          logger.warn('CSRF token inválido en desarrollo, permitiendo request', {
            method: req.method,
            url: req.originalUrl,
            context: 'csrf-dev'
          });
          // En desarrollo, solo loguear warning pero permitir continuar
        }
      }
      return next();
    }

    // En producción, verificar estrictamente
    if (userAgent.includes('ReactNative') || userAgent.includes('okhttp')) {
      // Excluir CSRF para peticiones móviles
      return next();
    } else {
      // Verificar token CSRF estrictamente en producción
      const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
      const cookieCsrf = req.cookies['_csrf'];
      const token = headerCsrf || cookieCsrf;

      if (!token || !tokens.verify(secret, token)) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }
      return next();
    }
  }
  next();
});


import paginaRoutes from "./routes/paginaRoutes";
import publicacionRoutes from "./routes/publicacionRoutes";

// ❌ ELIMINADAS: privateRoutes y guestRoutes por contener rutas duplicadas
// ❌ ELIMINADAS: chatRoutes por rutas HTTP redundantes (chat manejado por WebSocket)
// ❌ ELIMINADAS: feedRoutes por eliminación del sistema de feed
app.use("/api/auth", authRoutes);
app.use("/api", paginaRoutes);
app.use("/api/publicaciones", publicacionRoutes);
// ❌ ELIMINADAS: app.use("/api/private", privateRoutes);
// ❌ ELIMINADAS: app.use("/api/guest", guestRoutes);

// Endpoint para verificar esquema de tabla
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('DESCRIBE paginas');
    res.json({ columns: rows });
  } catch (error) {
    res.json({ error: (error as Error).message });
  }
});

app.use(errorHandler);


// Ruta SPA: sirve index.html en rutas no API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(rootPath, 'frontend/index.html'));
});



if (require.main === module) {
  (async () => {
    try {
      await initDatabase();
      // pool ya está inicializado en initDatabase


      await pool.query("SELECT 1");
      logger.info("Conexión a MySQL exitosa", { context: 'app' });

      app.listen(3000, () =>
        logger.info("Servidor backend iniciado", { port: 3000, url: "http://localhost:3000", context: 'app' })
      );
    } catch (err) {
      logger.error("Error de conexión a MySQL", { error: (err as Error).message, stack: (err as Error).stack, context: 'app' });
      process.exit(1);
    }
  })();
}

export default app;

// Función para notificar a un usuario en tiempo real via WebSocket
export function notifyUser(userId: string, message: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    logger.info(`Mensaje enviado via WebSocket a usuario ${userId}`, { context: 'websocket' });
  } else {
    logger.warn(`Cliente WebSocket no encontrado o no conectado para usuario ${userId}`, { context: 'websocket' });
  }
}
