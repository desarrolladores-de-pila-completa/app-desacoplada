import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import paginaRoutes from "./routes/paginaRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import cookieParser from "cookie-parser";
import path from "path";
import { pool } from "./middlewares/db";
import csurf from "csurf";

const rootPath = path.resolve(__dirname, '../../../');

const app = express();
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173"
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

// Aplica CSRF a rutas que modifican estado
app.use(["/api/paginas", "/api/auth"], csrfProtection);

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
