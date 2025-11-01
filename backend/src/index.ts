import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import path from "path";
import { pool, initDatabase } from "./middlewares/db";
import csrf from "csrf";
import { configureServices } from "./utils/servicesConfig";
import { getCsrfCookieOptions } from "./utils/cookieConfig";
import { corsOptions } from "./middlewares/security";
import logger from "./utils/logger";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { getService } from "./utils/servicesConfig";
import { AuthService } from "./services/AuthService";
import { UserService } from "./services/UserService";

// Inicializar el container de DI antes de importar rutas
configureServices();
logger.info("Container de DI inicializado", { context: 'app' });

// Importar rutas después de inicializar DI
import { router as authRoutes } from "./routes/authRoutes";

const rootPath = path.resolve(__dirname, '../../../');

const app = express();

// Middleware para parsear JSON
app.use(express.json());
app.use(cookieParser());

// Configurar sesiones y Passport
const authService = getService<AuthService>('AuthService');
const userService = getService<UserService>('UserService');

// Configurar express-session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());


// Configurar estrategia local de Passport
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email: string, password: string, done: any) => {
    try {
      logger.info('Intentando autenticar usuario', { email });
      const user = await authService.login(email, password);
      logger.info('Usuario autenticado exitosamente', { userId: user.id });
      return done(null, user);
    } catch (error) {
      logger.error('Error en autenticación Passport', { error: (error as Error).message, email });
      return done(error, false);
    }
  }
));

// Serialización y deserialización
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

logger.info("Passport y sesiones configurados", { context: 'app' });


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
const wss = new WebSocket.Server({ port: 8080 });

// Log para debugging de puerto WebSocket
logger.info("Iniciando servidor WebSocket", { port: 8080, context: 'websocket' });

// Log detallado del estado del servidor WebSocket
wss.on('listening', () => {
  logger.info('✅ Servidor WebSocket escuchando correctamente', {
    port: 8080,
    address: wss.address(),
    context: 'websocket'
  });
});

// Manejar errores de binding del puerto WebSocket
wss.on('error', (error: Error & { code?: string }) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('🚨 Puerto WebSocket 8080 ya está en uso', {
      error: error.message,
      code: error.code,
      port: 8080,
      context: 'websocket',
      suggestion: 'Detener otros servidores que puedan estar usando el puerto 8080'
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

logger.info('Servidor WebSocket inicializado en puerto 8080', { context: 'websocket' });

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
        // Usar el nombre directamente
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
app.use(cookieParser());
app.use(express.static(path.join(rootPath, 'frontend')));


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
  logger.debug('Verificando tokens CSRF', {
    cookieCsrf: cookieCsrf ? 'presente' : 'ausente',
    headerCsrf: headerCsrf ? 'presente' : 'ausente',
    cookieValue: cookieCsrf,
    headerValue: headerCsrf,
    url: req.originalUrl,
    method: req.method,
    context: 'csrf'
  });

  // Validar token CSRF si es una ruta protegida
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    if (!cookieCsrf || !headerCsrf) {
      logger.error('🚨 FALTAN TOKENS CSRF 🚨', {
        hasCookieCsrf: !!cookieCsrf,
        hasHeaderCsrf: !!headerCsrf,
        cookieCsrf: cookieCsrf ? '[REDACTED]' : null,
        headerCsrf: headerCsrf ? '[REDACTED]' : null,
        url: req.originalUrl,
        method: req.method,
        context: 'csrf-missing'
      });
      return res.status(403).json({ error: 'Faltan tokens CSRF' });
    }

    try {
      const tokenToVerify = Array.isArray(headerCsrf) ? headerCsrf[0] : headerCsrf;
      const isValid = tokens.verify(secret, tokenToVerify!);
      if (!isValid) {
        logger.error('🚨 TOKEN CSRF INVÁLIDO 🚨', {
          cookieCsrf: cookieCsrf ? '[REDACTED]' : null,
          headerCsrf: headerCsrf ? '[REDACTED]' : null,
          url: req.originalUrl,
          method: req.method,
          context: 'csrf-invalid'
        });
        return res.status(403).json({ error: 'Token CSRF inválido' });
      }
      logger.debug('Token CSRF válido', { context: 'csrf-valid' });
    } catch (error) {
      logger.error('🚨 ERROR VALIDANDO CSRF 🚨', {
        error: (error as Error).message,
        cookieCsrf: cookieCsrf ? '[REDACTED]' : null,
        headerCsrf: headerCsrf ? '[REDACTED]' : null,
        url: req.originalUrl,
        method: req.method,
        context: 'csrf-error'
      });
      return res.status(403).json({ error: 'Error validando token CSRF' });
    }
  }

  next();
});


import paginaRoutes from "./routes/paginaRoutes";
import publicacionRoutes from "./routes/publicacionRoutes";


app.use("/api/auth", authRoutes);
app.use("/api", paginaRoutes);
app.use("/", publicacionRoutes);


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



// Ruta para servir la política de privacidad desde el servidor
app.get('/privacidad', (req, res) => {
  logger.info('Sirviendo política de privacidad desde el servidor', {
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    context: 'privacy-server-route'
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Política de Privacidad</title>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
    <h1>Política de Privacidad</h1>
    <p>Esta Política de Privacidad describe cómo recopilamos, utilizamos y protegemos tu información personal cuando utilizas nuestra aplicación.</p>
    <h2>Información que recopilamos</h2>
    <ul>
      <li>Datos de registro y perfil</li>
      <li>Contenido que publicas (posts, comentarios, fotos)</li>
      <li>Datos de uso y navegación</li>
    </ul>
    <h2>Uso de la información</h2>
    <ul>
      <li>Mejorar la experiencia de usuario</li>
      <li>Personalizar el contenido</li>
      <li>Garantizar la seguridad de la plataforma</li>
    </ul>
    <h2>Cookies y tecnologías similares</h2>
    <p>Utilizamos cookies para analizar el tráfico y personalizar la experiencia. Consulta la <a href="/politica-de-cookies">Política de Cookies</a> para más detalles.</p>
    <h2>Actualizaciones</h2>
    <p>Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página.</p>
    <h2>Contacto</h2>
    <p>Si tienes preguntas sobre esta política o deseas ejercer tus derechos, contáctanos a través del formulario de soporte.</p>
  </div>
</body>
</html>`;

  res.send(html);
});



// Ruta para /politica-de-cookies
app.get('/politica-de-cookies', (req, res) => {
  logger.info('Sirviendo política de cookies desde /politica-de-cookies', {
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    context: 'cookies-server-route'
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Política de Cookies</title>
</head>
<body>
  <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
    <h1>Política de Cookies</h1>
    <p>Esta aplicación utiliza cookies y tecnologías similares para mejorar la experiencia del usuario, analizar el tráfico y personalizar el contenido. Puedes configurar tus preferencias de cookies en la sección de ajustes de tu navegador.</p>
    <h2>¿Qué son las cookies?</h2>
    <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten recordar tus preferencias y facilitar la navegación.</p>
    <h2>¿Cómo usamos las cookies?</h2>
    <ul>
      <li>Cookies técnicas y funcionales para el funcionamiento básico de la app.</li>
      <li>Cookies de análisis para mejorar nuestros servicios.</li>
    </ul>
    <h2>¿Cómo puedes gestionar las cookies?</h2>
    <p>Puedes eliminar o bloquear las cookies desde la configuración de tu navegador. Consulta la ayuda de tu navegador para más información.</p>
    <h2>Contacto</h2>
    <p>Si tienes dudas sobre nuestra política de cookies, contáctanos a través del formulario de soporte.</p>
  </div>
</body>
</html>`;

  res.send(html);
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

