"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const ValidationService_1 = require("../services/ValidationService");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
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
router.get("/users", authController_1.getAllUsers);
router.get("/:username", auth_1.authMiddleware, authController_1.getUserByUsername);
router.post("/register", (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateRegister), authController_1.register);
router.post("/login", (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateLogin), authController_1.login);
router.post("/refresh", authController_1.refreshTokens); // No requiere autenticación previa
router.post("/logout", authController_1.logout);
// Ruta para obtener foto de perfil de usuario específico (pública, sin autenticación)
router.get("/user/:id/foto", (req, res) => {
    console.log('=== DEBUG: Solicitud a /user/:id/foto ===', {
        id: req.params.id,
        headers: req.headers,
        origin: req.get('Origin'),
        timestamp: new Date().toISOString()
    });
    (0, authController_1.getUserProfilePhoto)(req, res);
});
// Ruta para actualizar username eliminada
router.delete("/user/:id", authController_1.eliminarUsuario);
//# sourceMappingURL=authRoutes.js.map