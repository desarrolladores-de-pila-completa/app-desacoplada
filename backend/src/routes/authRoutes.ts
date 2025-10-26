import { Router } from "express";
import { ValidationService, validateRequest } from '../services/ValidationService';
import { register, login, logout, eliminarUsuario, refreshTokens, updateProfilePhoto, getUserProfilePhoto, getUserByUsername, getAllUsers } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";
const multer = require("multer");
const router = Router();

// Configuración de multer para archivos de imagen
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

router.get("/users", getAllUsers);
router.get("/:username",authMiddleware, getUserByUsername);
router.post("/register", validateRequest(ValidationService.validateRegister), register);
router.post("/login", validateRequest(ValidationService.validateLogin), login);
router.post("/refresh", refreshTokens); // No requiere autenticación previa
router.post("/logout", logout);

// Ruta para obtener foto de perfil de usuario específico (pública, sin autenticación)
router.get("/user/:id/foto", (req, res) => {
  console.log('=== DEBUG: Solicitud a /user/:id/foto ===', {
    id: req.params.id,
    headers: req.headers,
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
  getUserProfilePhoto(req, res);
});

// Ruta para actualizar username eliminada

router.delete("/user/:id", eliminarUsuario);

export { router };

