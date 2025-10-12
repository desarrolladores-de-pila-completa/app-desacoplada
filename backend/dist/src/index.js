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
const logger_1 = __importDefault(require("./utils/logger"));
const ws_1 = __importDefault(require("ws"));
// Inicializar el container de DI antes de importar rutas
(0, servicesConfig_1.configureServices)();
logger_1.default.info("Container de DI inicializado", { context: 'app' });
// Importar rutas después de inicializar DI
const authRoutes_1 = require("./routes/authRoutes");
const paginaRoutes_1 = __importDefault(require("./routes/paginaRoutes"));
const publicacionRoutes_1 = __importDefault(require("./routes/publicacionRoutes"));
const rootPath = path_1.default.resolve(__dirname, '../../../');
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:5173", // Vite dev server
        "http://127.0.0.1:5173", // Vite dev server (127.0.0.1)
        "http://localhost:5174", // Vite dev server (actual port)
        "http://127.0.0.1:5174", // Vite dev server (127.0.0.1, actual port)
        "http://10.0.2.2:3000" // Emulador Android
    ],
    credentials: true,
}));
// WebSocket server
const wss = new ws_1.default.Server({ port: 3001 });
const clients = new Map();
wss.on('connection', (ws, request) => {
    logger_1.default.info('Nuevo cliente WebSocket conectado', { context: 'websocket' });
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'register' && data.userId) {
                clients.set(data.userId, ws);
                logger_1.default.info(`Usuario registrado en WebSocket: ${data.userId}`, { context: 'websocket' });
                // Notificar a otros usuarios que este usuario está en línea
                // Para usuarios registrados, obtener su display_name
                let displayName = data.userId;
                if (data.userId && !data.userId.startsWith('guest-')) {
                    try {
                        const [userRows] = await db_1.pool.query("SELECT display_name FROM users WHERE id = ?", [data.userId]);
                        if (userRows && userRows.length > 0 && userRows[0].display_name) {
                            displayName = userRows[0].display_name;
                        }
                    }
                    catch (error) {
                        logger_1.default.error('Error obteniendo display_name para notificación:', { error: error.message, context: 'websocket' });
                    }
                }
                clients.forEach((client, userId) => {
                    if (userId !== data.userId && client.readyState === ws_1.default.OPEN) {
                        client.send(JSON.stringify({
                            type: 'user_online',
                            username: displayName
                        }));
                    }
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error procesando mensaje WebSocket:', { error: error.message, context: 'websocket' });
        }
    });
    ws.on('close', async () => {
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
            // Notificar a otros usuarios que este usuario se desconectó
            // Para usuarios registrados, obtener su display_name para la notificación
            let displayName = disconnectedUser;
            if (disconnectedUser && !disconnectedUser.startsWith('guest-')) {
                try {
                    const [userRows] = await db_1.pool.query("SELECT display_name FROM users WHERE id = ?", [disconnectedUser]);
                    if (userRows && userRows.length > 0 && userRows[0].display_name) {
                        displayName = userRows[0].display_name;
                    }
                }
                catch (error) {
                    logger_1.default.error('Error obteniendo display_name para desconexión:', { error: error.message, context: 'websocket' });
                }
            }
            clients.forEach((client) => {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(JSON.stringify({
                        type: 'user_offline',
                        username: displayName
                    }));
                }
            });
        }
    });
    ws.on('error', (error) => {
        logger_1.default.error('Error en conexión WebSocket:', { error: error.message, context: 'websocket' });
    });
});
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(rootPath, 'frontend')));
// Aplicar rate limiting general a todas las rutas API
app.use("/api", rateLimit_1.generalRateLimit);
// Configurar CSRF con el nuevo paquete
const tokens = new csrf_1.default();
const secret = tokens.secretSync();
// Ruta para obtener el token CSRF
app.get("/api/csrf-token", (req, res) => {
    const token = tokens.create(secret);
    res.cookie('_csrf', token, (0, cookieConfig_1.getCsrfCookieOptions)());
    res.json({ csrfToken: token });
});
// Middleware de logging para depuración CSRF
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
    const cookieCsrf = req.cookies['_csrf'];
    const headerCsrf = req.headers['x-csrf-token'] || req.headers['csrf-token'];
    logger_1.default.debug('Verificando tokens CSRF', { cookieCsrf: cookieCsrf ? 'presente' : 'ausente', headerCsrf: headerCsrf ? 'presente' : 'ausente', context: 'csrf' });
    next();
});
// Aplica CSRF a rutas que modifican estado
// Solo aplicar CSRF a métodos que modifican datos
// Middleware CSRF adaptado para aceptar solo el header en peticiones móviles
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
        const userAgent = req.headers['user-agent'] || '';
        logger_1.default.debug('Verificando CSRF para método modificador', { method: req.method, userAgent, context: 'csrf' });
        if (userAgent.includes('ReactNative') || userAgent.includes('okhttp')) {
            // Excluir CSRF para peticiones móviles
            return next();
        }
        else {
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
const feedRoutes_1 = __importDefault(require("./routes/feedRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const privateRoutes_1 = __importDefault(require("./routes/privateRoutes"));
app.use("/api/auth", authRoutes_1.router);
app.use("/api/paginas", paginaRoutes_1.default);
app.use("/api/publicaciones", publicacionRoutes_1.default);
app.use("/api/feed", feedRoutes_1.default);
app.use("/api/chat", chatRoutes_1.default);
app.use("/api/private", privateRoutes_1.default);
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