"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const ValidationService_1 = require("../services/ValidationService");
const rateLimit_1 = require("../middlewares/rateLimit");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const security_1 = require("../middlewares/security");
const multer = require("multer");
const router = (0, express_1.Router)();
exports.router = router;
// Configuración de multer para archivos de imagen
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
});
// ❌ ELIMINADA: Ruta /me eliminada según solicitud del usuario
// ✅ RESTAURADA: Ruta /:username para verificación de autenticación del frontend
router.get("/:username", authController_1.getUserByUsername);
// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario
// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario
router.post("/register", rateLimit_1.authRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateRegister), authController_1.register);
router.post("/login", rateLimit_1.authRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateLogin), authController_1.login);
router.post("/refresh", authController_1.refreshTokens); // No requiere autenticación previa
router.post("/extend-session", auth_1.authMiddleware, authController_1.extendSession); // Extender sesión automáticamente
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", authController_1.logout);
// Ruta para actualizar foto de perfil
router.post("/profile-photo", auth_1.authMiddleware, security_1.uploadRateLimit, upload.single("photo"), authController_1.updateProfilePhoto);
// Ruta para obtener foto de perfil de usuario específico (pública, sin autenticación)
router.get("/user/:id/foto", authController_1.getUserProfilePhoto);
// Ruta para actualizar username (con rate limiting específico y validación)
router.put("/users/:userId/username", auth_1.authMiddleware, rateLimit_1.usernameUpdateRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateUpdateUsername), authController_1.updateUsername);
router.delete("/user/:id", authController_1.eliminarUsuario);
//# sourceMappingURL=authRoutes.js.map