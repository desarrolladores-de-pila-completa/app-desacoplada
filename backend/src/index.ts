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

// Inicializar el container de DI antes de importar rutas
configureServices();
logger.info("Container de DI inicializado", { context: 'app' });

// Importar rutas después de inicializar DI
import { router as authRoutes } from "./routes/authRoutes";
import paginaRoutes from "./routes/paginaRoutes";

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
app.use("/api/auth", authRoutes);
app.use("/api/paginas", paginaRoutes);
app.use("/api/feed", feedRoutes);
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
