import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import paginaRoutes from "./routes/paginaRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { pool } from "./middlewares/db";
import cookieParser from "cookie-parser";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/auth";

dotenv.config();
const app = express();
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use("/api/auth", authRoutes);
app.use("/api/paginas", paginaRoutes);
app.use(errorHandler);


// Ruta SPA: sirve index.html en rutas no API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});


if (require.main === module) {
  app.listen(3000, () =>
    console.log("Servidor backend en http://localhost:3000")
  );
}

export default app;
