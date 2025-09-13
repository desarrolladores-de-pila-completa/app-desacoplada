import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./middlewares/authRoutes";
import { authMiddleware } from "./middlewares/auth";
import { pool } from "./middlewares/db";
import cookieParser from "cookie-parser";


dotenv.config();
const app = express();
app.use(cors({
  origin: "https://yposteriormente.com",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

// Ruta protegida
app.get("/api/profile", authMiddleware, (req, res) => {
  console.log("Cookies recibidas en /api/profile:", req.cookies);
  res.json({ message: "Acceso autorizado", userId: (req as any).userId });
});

// Ruta protegida para perfil personal
app.get("/api/perfilPersonal", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  console.log("Cookies recibidas en /api/perfilPersonal:", req.cookies);

  try {
    const [rows] = await pool.execute("SELECT id, email FROM users WHERE id = ?", [userId]);
    const user = (rows as any[])[0];
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.listen(3000, () => console.log("Servidor backend en http://localhost:3000"));
