"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middlewares/errorHandler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./middlewares/db");
const csrf_1 = __importDefault(require("csrf"));
const servicesConfig_1 = require("./utils/servicesConfig");
const cookieConfig_1 = require("./utils/cookieConfig");
const rateLimit_1 = require("./middlewares/rateLimit");
const security_1 = require("./middlewares/security");
const logger_1 = __importDefault(require("./utils/logger"));
const ws_1 = __importDefault(require("ws"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const servicesConfig_2 = require("./utils/servicesConfig");
// Inicializar el container de DI antes de importar rutas
(0, servicesConfig_1.configureServices)();
logger_1.default.info("Container de DI inicializado", { context: 'app' });
// Importar rutas después de inicializar DI
const authRoutes_1 = require("./routes/authRoutes");
const rootPath = path_1.default.resolve(__dirname, '../../../');
const app = (0, express_1.default)();
// Middleware para parsear JSON
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Configurar sesiones y Passport
const authService = (0, servicesConfig_2.getService)('AuthService');
const userService = (0, servicesConfig_2.getService)('UserService');
// Configurar express-session
app.use((0, express_session_1.default)({
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
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Configurar estrategia local de Passport
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
    try {
        const user = await authService.login(email, password);
        return done(null, user);
    }
    catch (error) {
        return done(error, false);
    }
}));
// Serialización y deserialización
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await userService.getUserById(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
logger_1.default.info("Passport y sesiones configurados", { context: 'app' });
// Middleware para logging detallado de headers CORS
// app.use(corsHeaderLogger);
// Middleware para diagnóstico específico de problemas CORS
// app.use(corsDiagnosticLogger);
app.use((0, cors_1.default)(security_1.corsOptions));
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
const wss = new ws_1.default.Server({ port: 3003 });
// Log para debugging de puerto WebSocket
logger_1.default.info("Iniciando servidor WebSocket", { port: 3003, context: 'websocket' });
// Log detallado del estado del servidor WebSocket
wss.on('listening', () => {
    logger_1.default.info('✅ Servidor WebSocket escuchando correctamente', {
        port: 3003,
        address: wss.address(),
        context: 'websocket'
    });
});
// Manejar errores de binding del puerto WebSocket
wss.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger_1.default.error('🚨 Puerto WebSocket 3003 ya está en uso', {
            error: error.message,
            code: error.code,
            port: 3003,
            context: 'websocket',
            suggestion: 'Detener otros servidores que puedan estar usando el puerto 3003'
        });
    }
    else {
        logger_1.default.error('🚨 Error en servidor WebSocket', {
            error: error.message,
            code: error.code,
            context: 'websocket'
        });
    }
});
const clients = new Map();
const rooms = new Map(); // sala -> Set de userIds
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
logger_1.default.info('Servidor WebSocket inicializado en puerto 3003', { context: 'websocket' });
wss.on('connection', (ws, request) => {
    logger_1.default.info('🔗 Nueva conexión WebSocket establecida', {
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
    ws.on('message', async (message) => {
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
                }
                else {
                    console.error('=== WEBSOCKET ROOM ERROR ===', {
                        timestamp: new Date().toISOString(),
                        error: 'Sala global no encontrada',
                        roomsSize: rooms.size,
                        context: 'websocket-room-error'
                    });
                }
                logger_1.default.info(`Usuario registrado en WebSocket y unido a sala global: ${data.userId}`, { context: 'websocket' });
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
                const globalRoomDisconnect = rooms.get('global');
                globalRoomDisconnect.forEach((userId) => {
                    if (userId !== data.userId) {
                        const client = clients.get(userId);
                        if (client && client.readyState === ws_1.default.OPEN) {
                            client.send(JSON.stringify({
                                type: 'user_online',
                                username: displayName
                            }));
                        }
                    }
                });
            }
            else if (data.type === 'private_message' && data.to && data.message) {
                // Manejar mensaje privado
                const targetClient = clients.get(data.to);
                if (targetClient && targetClient.readyState === ws_1.default.OPEN) {
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
                    logger_1.default.info(`Mensaje privado enviado de ${data.from} a ${data.to}`, { context: 'websocket' });
                }
                else {
                    logger_1.default.warn(`Cliente destino ${data.to} no encontrado o no conectado`, { context: 'websocket' });
                }
            }
            else if (data.type === 'global_message' && data.message) {
                // Manejar mensaje global
                const globalRoomMessage = rooms.get('global');
                globalRoomMessage.forEach((userId) => {
                    if (userId !== data.from) {
                        const client = clients.get(userId);
                        if (client && client.readyState === ws_1.default.OPEN) {
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
                logger_1.default.info(`Mensaje global enviado por ${data.from}`, { context: 'websocket' });
            }
            else if (data.type === 'private_message' && data.to && data.message) {
                // Manejar mensaje privado
                const targetClient = clients.get(data.to);
                if (targetClient && targetClient.readyState === ws_1.default.OPEN) {
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
                    logger_1.default.info(`Mensaje privado enviado de ${data.from} a ${data.to}`, { context: 'websocket' });
                }
                else {
                    logger_1.default.warn(`Cliente destino ${data.to} no encontrado o no conectado`, { context: 'websocket' });
                }
            }
        }
        catch (error) {
            logger_1.default.error('🚨 Error procesando mensaje WebSocket:', {
                error: error.message,
                stack: error.stack,
                context: 'websocket'
            });
            console.error('=== WEBSOCKET MESSAGE ERROR DEBUG ===', {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                messagePreview: message.toString().substring(0, 100),
                context: 'websocket-message-error-debug'
            });
            // Enviar error al cliente para debugging
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error procesando mensaje en servidor',
                error: error.message
            }));
        }
    });
    ws.on('close', async (code, reason) => {
        logger_1.default.warn('🔌 Conexión WebSocket cerrada', {
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
        let disconnectedUser;
        for (const [userId, client] of clients.entries()) {
            if (client === ws) {
                disconnectedUser = userId;
                clients.delete(userId);
                break;
            }
        }
        if (disconnectedUser) {
            logger_1.default.info(`Usuario desconectado de WebSocket: ${disconnectedUser}`, { context: 'websocket' });
            // Remover usuario de todas las salas
            rooms.forEach((roomUsers, roomName) => {
                roomUsers.delete(disconnectedUser);
            });
            // Notificar a otros usuarios que este usuario se desconectó
            // Usar el nombre directamente
            let displayName = disconnectedUser;
            // Notificar solo a usuarios en la sala global
            const globalRoomNotify = rooms.get('global');
            globalRoomNotify.forEach((userId) => {
                const client = clients.get(userId);
                if (client && client.readyState === ws_1.default.OPEN) {
                    client.send(JSON.stringify({
                        type: 'user_offline',
                        username: displayName
                    }));
                }
            });
        }
    });
    ws.on('error', (error) => {
        logger_1.default.error('🚨 Error en conexión WebSocket:', {
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
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(rootPath, 'frontend')));
// Aplicar rate limiting general a todas las rutas API
app.use("/api", rateLimit_1.generalRateLimit);
// Middleware de logging detallado para debugging del error 426
// app.use("/api", (req, res, next) => {
//   logger.info('=== REQUEST DEBUG ===', {
//     method: req.method,
//     url: req.originalUrl,
//     protocol: req.protocol,
//     httpVersion: req.httpVersion,
//     headers: req.headers,
//     ip: req.ip,
//     userAgent: req.get('User-Agent'),
//     context: 'debug-426'
//   });
//   // Log de respuesta para detectar error 426
//   const originalSend = res.send;
//   res.send = function(data) {
//     logger.info('=== RESPONSE DEBUG ===', {
//       statusCode: res.statusCode,
//       url: req.originalUrl,
//       method: req.method,
//       context: 'debug-426'
//     });
//     // Si detectamos error 426, log detallado
//     if (res.statusCode === 426) {
//       logger.error('🚨 ERROR 426 DETECTADO 🚨', {
//         url: req.originalUrl,
//         method: req.method,
//         headers: req.headers,
//         body: req.body,
//         query: req.query,
//         ip: req.ip,
//         userAgent: req.get('User-Agent'),
//         context: 'error-426'
//       });
//     }
//     return originalSend.call(this, data);
//   };
//   next();
// });
// Configurar CSRF con el nuevo paquete
const tokens = new csrf_1.default();
const secret = tokens.secretSync();
// Ruta para obtener el token CSRF
app.get("/api/csrf-token", (req, res) => {
    logger_1.default.info('=== CSRF TOKEN REQUEST ===', {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        cookies: req.cookies,
        ip: req.ip,
        context: 'csrf-debug',
        timestamp: new Date().toISOString()
    });
    // Log específico para debugging del error 426 en CSRF
    logger_1.default.error('🚨 CSRF DEBUG 426 CANDIDATE 🚨', {
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
        res.cookie('_csrf', token, (0, cookieConfig_1.getCsrfCookieOptions)());
        res.json({ csrfToken: token });
        logger_1.default.info('=== CSRF TOKEN RESPONSE ===', {
            statusCode: res.statusCode,
            hasToken: !!token,
            context: 'csrf-debug'
        });
    }
    catch (error) {
        logger_1.default.error('=== CSRF TOKEN ERROR ===', {
            error: error.message,
            stack: error.stack,
            context: 'csrf-debug'
        });
        res.status(500).json({ error: 'Error generando token CSRF' });
    }
});
// Middleware de logging para depuración CSRF
app.use(["/api", "/api/auth"], (req, res, next) => {
    const cookieCsrf = req.cookies['_csrf'];
    const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
    logger_1.default.debug('Verificando tokens CSRF', { cookieCsrf: cookieCsrf ? 'presente' : 'ausente', headerCsrf: headerCsrf ? 'presente' : 'ausente', context: 'csrf' });
    next();
});
// Aplica CSRF a rutas que modifican estado
// Solo aplicar CSRF a métodos que modifican datos
// Middleware CSRF optimizado para evitar problemas de protocolo
// app.use(["/api", "/api/auth"], (req, res, next) => {
//   if (["POST", "PUT", "DELETE"].includes(req.method)) {
//     const userAgent = req.headers['user-agent'] || '';
//     const isDevelopment = process.env.NODE_ENV !== 'production';
//     logger.debug('Verificando CSRF para método modificador', {
//       method: req.method,
//       userAgent,
//       isDevelopment,
//       context: 'csrf'
//     });
//     // En desarrollo, ser más permisivo con CSRF
//     if (isDevelopment) {
//       // Solo verificar CSRF para métodos críticos en desarrollo
//       if (req.method === 'DELETE') {
//         const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
//         const cookieCsrf = req.cookies['_csrf'];
//         const token = headerCsrf || cookieCsrf;
//         if (!token || !tokens.verify(secret, token)) {
//           logger.warn('CSRF token inválido en desarrollo, permitiendo request', {
//             method: req.method,
//             url: req.originalUrl,
//             context: 'csrf-dev'
//           });
//           // En desarrollo, solo loguear warning pero permitir continuar
//         }
//       }
//       return next();
//     }
//     // En producción, verificar estrictamente
//     if (userAgent.includes('ReactNative') || userAgent.includes('okhttp')) {
//       // Excluir CSRF para peticiones móviles
//       return next();
//     } else {
//       // Verificar token CSRF estrictamente en producción
//       const headerCsrf = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];
//       const cookieCsrf = req.cookies['_csrf'];
//       const token = headerCsrf || cookieCsrf;
//       if (!token || !tokens.verify(secret, token)) {
//         return res.status(403).json({ error: 'Invalid CSRF token' });
//       }
//       return next();
//     }
//   }
//   next();
// });
const paginaRoutes_1 = __importDefault(require("./routes/paginaRoutes"));
const publicacionRoutes_1 = __importDefault(require("./routes/publicacionRoutes"));
// ❌ ELIMINADAS: privateRoutes y guestRoutes por contener rutas duplicadas
// ❌ ELIMINADAS: chatRoutes por rutas HTTP redundantes (chat manejado por WebSocket)
// ❌ ELIMINADAS: feedRoutes por eliminación del sistema de feed
app.use("/api/auth", authRoutes_1.router);
app.use("/api", paginaRoutes_1.default);
app.use("/api/publicaciones", publicacionRoutes_1.default);
// ❌ ELIMINADAS: app.use("/api/private", privateRoutes);
// ❌ ELIMINADAS: app.use("/api/guest", guestRoutes);
// Endpoint para verificar esquema de tabla
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db_1.pool.query('DESCRIBE paginas');
        res.json({ columns: rows });
    }
    catch (error) {
        res.json({ error: error.message });
    }
});
app.use(errorHandler_1.errorHandler);
// Ruta SPA: sirve index.html en rutas no API
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path_1.default.join(rootPath, 'frontend/index.html'));
});
if (require.main === module) {
    (async () => {
        try {
            await (0, db_1.initDatabase)();
            // pool ya está inicializado en initDatabase
            await db_1.pool.query("SELECT 1");
            logger_1.default.info("Conexión a MySQL exitosa", { context: 'app' });
            app.listen(3000, () => logger_1.default.info("Servidor backend iniciado", { port: 3000, url: "http://localhost:3000", context: 'app' }));
        }
        catch (err) {
            logger_1.default.error("Error de conexión a MySQL", { error: err.message, stack: err.stack, context: 'app' });
            process.exit(1);
        }
    })();
}
exports.default = app;
// Función para notificar a un usuario en tiempo real via WebSocket
function notifyUser(userId, message) {
    const client = clients.get(userId);
    if (client && client.readyState === ws_1.default.OPEN) {
        client.send(JSON.stringify(message));
        logger_1.default.info(`Mensaje enviado via WebSocket a usuario ${userId}`, { context: 'websocket' });
    }
    else {
        logger_1.default.warn(`Cliente WebSocket no encontrado o no conectado para usuario ${userId}`, { context: 'websocket' });
    }
}
//# sourceMappingURL=index.js.map