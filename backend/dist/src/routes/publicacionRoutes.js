"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rateLimit_1 = require("../middlewares/rateLimit");
const publicacionController_1 = require("../controllers/publicacionController");
const router = (0, express_1.Router)();
// Crear publicación
router.post("/", auth_1.authMiddleware, rateLimit_1.userRateLimit, async (req, res) => {
    const { titulo, contenido } = req.body;
    const userId = req.user.id;
    try {
        // Crear la publicación
        const { pool } = require('../middlewares/db');
        const [result] = await pool.query("INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)", [userId, titulo, contenido]);
        const publicacionId = result.insertId;
        // Crear entrada en el feed
        const { getService } = require('../utils/servicesConfig');
        const userService = getService('UserService');
        const user = await userService.getUserById(userId);
        const mensaje = `Nueva publicación: <strong>${titulo}</strong>`;
        await pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [userId, mensaje]);
        res.json({ message: "Publicación creada", id: publicacionId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear publicación" });
    }
});
// Obtener publicación por ID
router.get("/:id", publicacionController_1.obtenerPublicacion);
// Obtener publicaciones por usuario
router.get("/usuario/:username", publicacionController_1.obtenerPublicacionesPorUsuario);
// Obtener todas las publicaciones
router.get("/", publicacionController_1.obtenerTodasLasPublicaciones);
exports.default = router;
//# sourceMappingURL=publicacionRoutes.js.map