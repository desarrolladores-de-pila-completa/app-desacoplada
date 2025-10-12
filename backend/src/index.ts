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
import logger from "./utils/logger";
import WebSocket from "ws";
import { IncomingMessage } from "http";

// Inicializar el container de DI antes de importar rutas
configureServices();
logger.info("Container de DI inicializado", { context: 'app' });

// Importar rutas después de inicializar DI
import { router as authRoutes } from "./routes/authRoutes";
import paginaRoutes from "./routes/paginaRoutes";
import publicacionRoutes from "./routes/publicacionRoutes";

const rootPath = path.resolve(__dirname, '../../../');

const app = express();
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:5173",  // Vite dev server
      "http://127.0.0.1:5173",   // Vite dev server (127.0.0.1)
      "http://localhost:5174",  // Vite dev server (actual port)
      "http://127.0.0.1:5174",   // Vite dev server (127.0.0.1, actual port)
      "http://10.0.2.2:3000"     // Emulador Android
    ],
    credentials: true,
  })
);

// WebSocket server
const wss = new WebSocket.Server({ port: 3001 });
const clients = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
  logger.info('Nuevo cliente WebSocket conectado', { context: 'websocket' });

  ws.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'register' && data.userId) {
        clients.set(data.userId, ws);
        logger.info(`Usuario registrado en WebSocket: ${data.userId}`, { context: 'websocket' });

        // Notificar a otros usuarios que este usuario está en línea
        // Para usuarios registrados, obtener su display_name
        let displayName = data.userId;
        if (data.userId && !data.userId.startsWith('guest-')) {
          try {
            const [userRows]: any = await pool.query("SELECT display_name FROM users WHERE id = ?", [data.userId]);
            if (userRows && userRows.length > 0 && userRows[0].display_name) {
              displayName = userRows[0].display_name;
            }
          } catch (error) {
            logger.error('Error obteniendo display_name para notificación:', { error: (error as Error).message, context: 'websocket' });
          }
        }

        clients.forEach((client, userId) => {
          if (userId !== data.userId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'user_online',
              username: displayName
            }));
          }
        });
      }
    } catch (error) {
      logger.error('Error procesando mensaje WebSocket:', { error: (error as Error).message, context: 'websocket' });
    }
  });

  ws.on('close', async () => {
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

      // Notificar a otros usuarios que este usuario se desconectó
      // Para usuarios registrados, obtener su display_name para la notificación
      let displayName = disconnectedUser;
      if (disconnectedUser && !disconnectedUser.startsWith('guest-')) {
        try {
          const [userRows]: any = await pool.query("SELECT display_name FROM users WHERE id = ?", [disconnectedUser]);
          if (userRows && userRows.length > 0 && userRows[0].display_name) {
            displayName = userRows[0].display_name;
          }
        } catch (error) {
          logger.error('Error obteniendo display_name para desconexión:', { error: (error as Error).message, context: 'websocket' });
        }
      }

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'user_offline',
            username: displayName
          }));
        }
      });
    }
  });

  ws.on('error', (error) => {
    logger.error('Error en conexión WebSocket:', { error: error.message, context: 'websocket' });
  });
});
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(rootPath, 'frontend')));

// Aplicar rate limiting general a todas las rutas API
app.use("/api", generalRateLimit);

// Configurar CSRF con el nuevo paquete
const tokens = new csrf();
const secret = tokens.secretSync();

// Ruta para obtener el token CSRF
app.get("/api/csrf-token", (req, res) => {
  const token = tokens.create(secret);
  res.cookie('_csrf', token, getCsrfCookieOptions());
  res.json({ csrfToken: token });
});


// Middleware de logging para depuración CSRF
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
  const cookieCsrf = req.cookies['_csrf'];
  const headerCsrf = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  logger.debug('Verificando tokens CSRF', { cookieCsrf: cookieCsrf ? 'presente' : 'ausente', headerCsrf: headerCsrf ? 'presente' : 'ausente', context: 'csrf' });
  next();
});
// Aplica CSRF a rutas que modifican estado
// Solo aplicar CSRF a métodos que modifican datos
// Middleware CSRF adaptado para aceptar solo el header en peticiones móviles
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const userAgent = req.headers['user-agent'] || '';
    logger.debug('Verificando CSRF para método modificador', { method: req.method, userAgent, context: 'csrf' });
    if (userAgent.includes('ReactNative') || userAgent.includes('okhttp')) {
      // Excluir CSRF para peticiones móviles
      return next();
    } else {
      // Verificar token CSRF
      const headerCsrf = req.headers['x-csrf-token'] || req.headers['csrf-token'];
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


import feedRoutes from "./routes/feedRoutes";
import chatRoutes from "./routes/chatRoutes";
import privateRoutes from "./routes/privateRoutes";
app.use("/api/auth", authRoutes);
app.use("/api/paginas", paginaRoutes);
app.use("/api/publicaciones", publicacionRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/private", privateRoutes);

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
