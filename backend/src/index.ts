import express from "express";
import cors from "cors";
import { router as authRoutes } from "./routes/authRoutes";
import paginaRoutes from "./routes/paginaRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import path from "path";
import { pool, initDatabase } from "./middlewares/db";
import csurf from "csurf";

const rootPath = path.resolve(__dirname, '../../../');

const app = express();
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500", 
      "http://localhost:5500",
      "http://localhost:5173",  // Vite dev server
      "http://127.0.0.1:5173"   // Vite dev server (127.0.0.1)
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(rootPath, 'frontend')));

const csrfProtection = csurf({ cookie: true });

// Ruta para obtener el token CSRF
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});


// Middleware de logging para depuración CSRF
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
  const cookieCsrf = req.cookies['csrf'] || req.cookies['_csrf'];
  const headerCsrf = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  console.log("[CSRF] Cookie:", cookieCsrf, "Header:", headerCsrf);
  next();
});
// Aplica CSRF a rutas que modifican estado
// Solo aplicar CSRF a métodos que modifican datos
app.use(["/api/paginas", "/api/auth"], (req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/paginas", paginaRoutes);
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
      console.log("Conexión a MySQL exitosa");
      app.listen(3000, () =>
        console.log("Servidor backend en http://localhost:3000")
      );
    } catch (err) {
      console.error("Error de conexión a MySQL:", err);
      process.exit(1);
    }
  })();
}

export default app;
