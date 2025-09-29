import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { pool } from "../middlewares/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router = Router();
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

router.use(limiter);
router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: "No autenticado" });
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, username FROM users WHERE id = ?",
      [userId]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT id, email, username FROM users WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json((rows as any[])[0]);
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
