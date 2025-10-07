"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const multer = require("multer");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const db_1 = require("../middlewares/db");
const bcrypt = require("bcryptjs");
const upload = multer();
const router = (0, express_1.Router)();
exports.router = router;
// Ruta para obtener el usuario autenticado
router.get("/me", auth_1.authMiddleware, async (req, res) => {
    const user = req.user;
    if (!user || !user.id)
        return res.status(401).json({ error: "No autenticado" });
    res.json(user);
});
// Endpoint para actualizar foto de perfil
router.post("/me/foto", auth_1.authMiddleware, upload.single("foto"), async (req, res) => {
    const user = req.user;
    if (!user || !user.id)
        return res.status(401).json({ error: "No autenticado" });
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "No se recibió imagen" });
    try {
        await db_1.pool.query("UPDATE users SET foto_perfil = ? WHERE id = ?", [file.buffer, user.id]);
        res.json({ message: "Foto de perfil actualizada" });
    }
    catch (err) {
        console.error("Error al guardar foto de perfil:", err);
        res.status(500).json({ error: "Error al guardar foto de perfil" });
    }
});
// Endpoint para obtener foto de perfil
router.get("/me/foto", auth_1.authMiddleware, async (req, res) => {
    const user = req.user;
    if (!user || !user.id)
        return res.status(401).json({ error: "No autenticado" });
    try {
        const [rows] = await db_1.pool.query("SELECT foto_perfil FROM users WHERE id = ?", [user.id]);
        if (!rows || rows.length === 0 || !rows[0].foto_perfil) {
            return res.status(404).json({ error: "Sin foto de perfil" });
        }
        res.setHeader("Content-Type", "image/jpeg");
        res.send(rows[0].foto_perfil);
    }
    catch (err) {
        console.error("Error al obtener foto de perfil:", err);
        res.status(500).json({ error: "Error al obtener foto de perfil" });
    }
});
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
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
// router.post("/username", authMiddleware, cambiarUsername); // Función no implementada
router.post("/logout", authController_1.logout);
router.delete("/user/:id", authController_1.eliminarUsuario);
//# sourceMappingURL=authRoutes.js.map