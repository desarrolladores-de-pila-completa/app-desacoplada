import { Router, Request, Response } from "express";
import { MulterFile } from '../types/interfaces';
import { validateFileUpload } from '../middlewares/security';
import { RegisterSchema, LoginSchema, validateRequest } from '../validation/schemas';

interface RequestWithFile extends Request {
  file?: MulterFile;
}
const multer = require("multer");
import { register, login, logout, eliminarUsuario } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { pool } from "../middlewares/db";
import { randomUUID } from "crypto";
const bcrypt = require("bcryptjs");

const upload = multer();
const router = Router();

// Ruta para obtener el usuario autenticado
router.get("/me", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (!user || !user.id) return res.status(401).json({ error: "No autenticado" });
  res.json(user);
});

// Endpoint para actualizar foto de perfil
router.post("/me/foto", authMiddleware, upload.single("foto"), validateFileUpload, async (req: RequestWithFile, res: Response) => {
  const user = (req as any).user;
  if (!user || !user.id) return res.status(401).json({ error: "No autenticado" });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No se recibió imagen" });
  try {
    await pool.query(
      "UPDATE users SET foto_perfil = ? WHERE id = ?",
      [file.buffer, user.id]
    );
    res.json({ message: "Foto de perfil actualizada" });
  } catch (err) {
    console.error("Error al guardar foto de perfil:", err);
    res.status(500).json({ error: "Error al guardar foto de perfil" });
  }
});

// Endpoint para obtener foto de perfil
router.get("/me/foto", authMiddleware, async (req, res) => {
  const user = (req as any).user;
  if (!user || !user.id) return res.status(401).json({ error: "No autenticado" });
  try {
    const [rows]: any = await pool.query(
      "SELECT foto_perfil FROM users WHERE id = ?",
      [user.id]
    );
    if (!rows || rows.length === 0 || !rows[0].foto_perfil) {
      return res.status(404).json({ error: "Sin foto de perfil" });
    }
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].foto_perfil);
  } catch (err) {
    console.error("Error al obtener foto de perfil:", err);
    res.status(500).json({ error: "Error al obtener foto de perfil" });
  }
});

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

router.post("/register", validateRequest(RegisterSchema), register);
router.post("/login", validateRequest(LoginSchema), login);
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", logout);

router.delete("/user/:id", eliminarUsuario);

export { router };

