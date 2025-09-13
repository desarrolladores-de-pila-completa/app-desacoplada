import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./middlewares/authRoutes";
import { authMiddleware } from "./middlewares/auth";
import { pool } from "./middlewares/db";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Ruta protegida
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({ message: "Acceso autorizado", userId: (req as any).userId });
});

// Ruta protegida para perfil personal
app.get("/api/perfilPersonal", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
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
