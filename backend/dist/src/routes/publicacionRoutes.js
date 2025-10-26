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
    const userId = req.userId;
    try {
        // Crear la publicación
        const { pool } = require('../middlewares/db');
        const [result] = await pool.query("INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)", [userId, titulo, contenido]);
        const publicacionId = result.insertId;
        res.json({ message: "Publicación creada", id: publicacionId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear publicación" });
    }
});
// ❌ ELIMINADAS: Rutas para obtener publicaciones específicas
// Estas funcionalidades pueden ser manejadas por la ruta general o por páginas
// Obtener todas las publicaciones
router.get("/", publicacionController_1.obtenerTodasLasPublicaciones);
exports.default = router;
//# sourceMappingURL=publicacionRoutes.js.map