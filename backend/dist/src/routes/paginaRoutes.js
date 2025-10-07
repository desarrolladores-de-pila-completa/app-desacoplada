"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Endpoint para obtener todas las páginas públicas
const express_1 = require("express");
// import rateLimit from "express-rate-limit";
const paginaController_1 = require("../controllers/paginaController");
const auth_1 = require("../middlewares/auth");
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
        const [rows] = await require("../middlewares/db").pool.query(`SELECT c.*, u.username FROM comentarios c LEFT JOIN users u ON c.user_id = u.id WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`, [id]);
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
router.post("/:id/usuario", auth_1.authMiddleware, paginaController_1.actualizarUsuarioPagina);
// Comentarios
router.post("/:id/comentarios", auth_1.authMiddleware, paginaController_1.guardarComentario);
// Endpoint para subir imágenes a una página (BLOB)
router.post("/:id/imagenes", auth_1.authMiddleware, upload.single("imagen"), async (req, res) => {
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
        const [rows] = await require("../middlewares/db").pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
        if (!rows || rows.length === 0)
            return res.status(404).json({ error: "Página no encontrada" });
        if (String(rows[0].user_id) !== String(req.user.id))
            return res.status(403).json({ error: "Solo el dueño puede subir imágenes" });
        // Crear tabla 'imagenes' si no existe
        await require("../middlewares/db").pool.query(`CREATE TABLE IF NOT EXISTS imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      idx INT NOT NULL,
      imagen LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
        // Guardar imagen en la base de datos
        await require("../middlewares/db").pool.query("REPLACE INTO imagenes (pagina_id, idx, imagen) VALUES (?, ?, ?)", [paginaId, idx, file.buffer]);
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
        const [rows] = await require("../middlewares/db").pool.query("SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC", [paginaId]);
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
// Endpoint para eliminar usuario y todo su rastro
router.delete("/usuario/:id", auth_1.authMiddleware, paginaController_1.eliminarUsuarioTotal);
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map