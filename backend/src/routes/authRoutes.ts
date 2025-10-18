import { Router } from "express";
import { ValidationService, validateRequest } from '../services/ValidationService';
import { authRateLimit } from '../middlewares/rateLimit';
import { register, login, logout, eliminarUsuario, refreshTokens, extendSession } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { pool } from "../middlewares/db";
const router = Router();

// ❌ ELIMINADA: Ruta /me eliminada según solicitud del usuario

// ❌ ELIMINADA: Ruta /:username con función me eliminada según solicitud del usuario

// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario

// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario

// Endpoint público para obtener foto de perfil por id de usuario
router.get("/user/:id/foto", async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows]: any = await pool.query(
      "SELECT foto_perfil FROM users WHERE id = ?",
      [userId]
    );
    if (!rows || rows.length === 0 || !rows[0].foto_perfil) {
      return res.status(404).json({ error: "Sin foto de perfil" });
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].foto_perfil);
  } catch (err) {
    console.error("Error al obtener foto de perfil pública:", err);
    res.status(500).json({ error: "Error al obtener foto de perfil" });
  }
});

router.post("/register", authRateLimit, validateRequest(ValidationService.validateRegister), register);
router.post("/login", authRateLimit, validateRequest(ValidationService.validateLogin), login);
router.post("/refresh", refreshTokens); // No requiere autenticación previa
router.post("/extend-session", authMiddleware, extendSession); // Extender sesión automáticamente
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", logout);

router.delete("/user/:id", eliminarUsuario);

export { router };

