import { Router } from "express";
import { ValidationService, validateRequest } from '../services/ValidationService';
import { authRateLimit, usernameUpdateRateLimit } from '../middlewares/rateLimit';
import { register, login, logout, eliminarUsuario, refreshTokens, extendSession, updateProfilePhoto, getUserProfilePhoto, getUserByUsername, updateUsername, getAllUsers } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
import { pool } from "../middlewares/db";
import { uploadRateLimit } from '../middlewares/security';
const multer = require("multer");
const router = Router();

// Configuración de multer para archivos de imagen
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// ❌ ELIMINADA: Ruta /me eliminada según solicitud del usuario

// ✅ RESTAURADA: Ruta /:username para verificación de autenticación del frontend
// Ruta para obtener todos los usuarios (debe ir antes de /:username para evitar conflicto)
router.get("/users", getAllUsers);

router.get("/:username", getUserByUsername);

// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario

// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario


router.post("/register", authRateLimit, validateRequest(ValidationService.validateRegister), register);
router.post("/login", authRateLimit, validateRequest(ValidationService.validateLogin), login);
router.post("/refresh", refreshTokens); // No requiere autenticación previa
router.post("/extend-session", authMiddleware, extendSession); // Extender sesión automáticamente
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", logout);

// Ruta para actualizar foto de perfil
router.post("/profile-photo", authMiddleware, uploadRateLimit, upload.single("photo"), updateProfilePhoto);

// Ruta para obtener foto de perfil de usuario específico (pública, sin autenticación)
router.get("/user/:id/foto", getUserProfilePhoto);

// Ruta para actualizar username (con rate limiting específico y validación)
router.put("/users/:userId/username", authMiddleware, usernameUpdateRateLimit, validateRequest(ValidationService.validateUpdateUsername), updateUsername);

router.delete("/user/:id", eliminarUsuario);

export { router };

