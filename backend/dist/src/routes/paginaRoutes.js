"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../middlewares/db");
// Endpoint para obtener todas las páginas públicas
const express_1 = require("express");
// import rateLimit from "express-rate-limit";
const paginaController_1 = require("../controllers/paginaController");
const auth_1 = require("../middlewares/auth");
const ValidationService_1 = require("../services/ValidationService");
const rateLimit_1 = require("../middlewares/rateLimit");
const multer = require("multer");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const limiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 100 });
const router = (0, express_1.Router)();
// Endpoint para consultar visibilidad general de la página
router.get("/:id/visibilidad", paginaController_1.consultarVisibilidad);
// Endpoint para consultar visibilidad de campos de la página
const paginaController_2 = require("../controllers/paginaController");
router.get("/:id/visibilidad-campos", paginaController_2.consultarVisibilidadCampos);
const upload = multer();
// Endpoint para obtener comentarios de una página
router.get("/:id/comentarios", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username FROM comentarios c LEFT JOIN users u ON c.user_id = u.id WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`, [id]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener comentarios" });
    }
});
router.get("/", limiter, paginaController_1.paginasPublicas);
router.get("/:id", paginaController_1.obtenerPagina);
// Endpoint para obtener la página por username
const paginaController_3 = require("../controllers/paginaController");
router.get("/pagina/:username", paginaController_3.obtenerPaginaPorUsername);
// Endpoint para obtener página por user_id (UUID sin guiones)
const paginaController_4 = require("../controllers/paginaController");
router.get("/pagina/id/:user_id", paginaController_4.obtenerPaginaPorUserId);
// Endpoint para actualizar el nombre de usuario de la página
router.post("/:id/usuario", auth_1.authMiddleware, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateUpdateUsername), paginaController_1.actualizarUsuarioPagina);
// Comentarios
router.post("/:id/comentarios", auth_1.authMiddleware, rateLimit_1.userRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateCreateComment), paginaController_1.guardarComentario);
// Endpoint para subir imágenes a una página (BLOB)
router.post("/:id/imagenes", auth_1.authMiddleware, rateLimit_1.userRateLimit, upload.single("imagen"), async (req, res) => {
    const paginaId = req.params.id;
    // Usar multer para procesar todos los campos del formulario
    const file = req.file;
    // 'index' puede venir como string, asegúrate de convertirlo a número
    let idx = req.body.index;
    if (Array.isArray(idx))
        idx = idx[0];
    idx = Number(idx);
    if (isNaN(idx))
        return res.status(400).json({ error: "Índice de imagen inválido" });
    if (!file)
        return res.status(400).json({ error: "No se recibió imagen" });
    try {
        // Verificar que el usuario autenticado es el dueño de la página
        const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
        if (!rows || rows.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        if (String(rows[0].user_id) !== String(req.user.id))
            return res.status(403).json({ error: "Solo el dueño puede subir imágenes" });
        // Guardar imagen en la base de datos
        await db_1.pool.query("REPLACE INTO imagenes (pagina_id, idx, imagen) VALUES (?, ?, ?)", [paginaId, idx, file.buffer]);
        res.json({ message: "Imagen subida" });
    }
    catch (err) {
        console.error("Error al guardar imagen:", err);
        res.status(500).json({ error: "Error al guardar imagen" });
    }
});
// Endpoint para obtener todas las imágenes de una página
router.get("/:id/imagenes", async (req, res) => {
    const paginaId = req.params.id;
    try {
        const [rows] = await db_1.pool.query("SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC", [paginaId]);
        // Convertir BLOB a base64 para frontend
        const images = rows.map((row) => ({
            idx: row.idx,
            src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
        }));
        res.json(images);
    }
    catch (err) {
        console.error("Error al obtener imágenes:", err);
        res.status(500).json({ error: "Error al obtener imágenes" });
    }
});
// Endpoint para subir imágenes para comentarios (CKEditor)
router.post("/upload-comment-image", auth_1.authMiddleware, rateLimit_1.userRateLimit, upload.single("upload"), async (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "No file uploaded" });
    try {
        const [result] = await db_1.pool.query("INSERT INTO imagenes_comentarios (user_id, comentario_id, imagen, filename, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)", [req.user.id, null, file.buffer, file.originalname, file.mimetype, file.size]);
        const imageId = result.insertId;
        res.json({ url: `/api/paginas/comment-images/${imageId}` });
    }
    catch (err) {
        console.error("Error uploading comment image:", err);
        res.status(500).json({ error: "Upload failed" });
    }
});
// Endpoint para servir imágenes de comentarios
router.get("/comment-images/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const [rows] = await db_1.pool.query("SELECT imagen, mimetype FROM imagenes_comentarios WHERE id = ?", [id]);
        if (rows.length === 0)
            return res.status(404).json({ error: "Image not found" });
        res.set('Content-Type', rows[0].mimetype);
        res.send(rows[0].imagen);
    }
    catch (err) {
        console.error("Error serving comment image:", err);
        res.status(500).json({ error: "Server error" });
    }
});
// Endpoint para eliminar usuario y todo su rastro
router.delete("/usuario/:id", auth_1.authMiddleware, rateLimit_1.userRateLimit, paginaController_1.eliminarUsuarioTotal);
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map