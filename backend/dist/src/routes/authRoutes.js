"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const ValidationService_1 = require("../services/ValidationService");
const rateLimit_1 = require("../middlewares/rateLimit");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const db_1 = require("../middlewares/db");
const router = (0, express_1.Router)();
exports.router = router;
// ❌ ELIMINADA: Ruta /me eliminada según solicitud del usuario
// ❌ ELIMINADA: Ruta /:username con función me eliminada según solicitud del usuario
// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario
// ❌ ELIMINADO: Endpoint /me/foto eliminado según solicitud del usuario
// Endpoint público para obtener foto de perfil por id de usuario
router.get("/user/:id/foto", async (req, res) => {
    const userId = req.params.id;
    try {
        const [rows] = await db_1.pool.query("SELECT foto_perfil FROM users WHERE id = ?", [userId]);
        if (!rows || rows.length === 0 || !rows[0].foto_perfil) {
            return res.status(404).json({ error: "Sin foto de perfil" });
        }
        res.setHeader("Content-Type", "image/jpeg");
        res.send(rows[0].foto_perfil);
    }
    catch (err) {
        console.error("Error al obtener foto de perfil pública:", err);
        res.status(500).json({ error: "Error al obtener foto de perfil" });
    }
});
router.post("/register", rateLimit_1.authRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateRegister), authController_1.register);
router.post("/login", rateLimit_1.authRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateLogin), authController_1.login);
router.post("/refresh", authController_1.refreshTokens); // No requiere autenticación previa
router.post("/extend-session", auth_1.authMiddleware, authController_1.extendSession); // Extender sesión automáticamente
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", authController_1.logout);
router.delete("/user/:id", authController_1.eliminarUsuario);
//# sourceMappingURL=authRoutes.js.map