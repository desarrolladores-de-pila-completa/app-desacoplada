"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../middlewares/db");
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const paginaController_1 = require("../controllers/paginaController");
const auth_1 = require("../middlewares/auth");
const ValidationService_1 = require("../services/ValidationService");
const rateLimit_1 = require("../middlewares/rateLimit");
const multer = require("multer");
const limiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 100 });
const router = (0, express_1.Router)();
// Endpoint para crear nueva página (simplificado)
router.post("/", auth_1.authMiddleware, async (req, res) => {
    const { usuario } = req.body;
    const userId = req.user.id;
    try {
        // Crear la página
        const [result] = await db_1.pool.query("INSERT INTO paginas (user_id, usuario) VALUES (?, ?)", [userId, usuario]);
        const pageId = result.insertId;
        // Crear entrada en el feed
        const mensaje = `Nuevo perfil creado: <a href="/pagina/${usuario}">${usuario}</a>`;
        await db_1.pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [userId, mensaje]);
        res.json({ message: "Página creada", id: pageId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear página" });
    }
});
// Ruta eliminada: consultarVisibilidadCampos (función eliminada)
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
// Ruta eliminada: GET /:id - obtenerPagina (solicitud del usuario)
// Endpoint unificado para todas las operaciones de páginas por username
// Soporta diferentes acciones mediante parámetros de query:
// - action=info (default): Información completa del usuario y página principal
// - action=publicaciones: Lista de publicaciones del usuario
// - action=publicacion&publicacionId=X: Publicación específica
// - action=galeria: Galería de imágenes del usuario
// - action=comentarios: Comentarios de la página principal
// - action=lista&pageNumber=X: Página específica por número
// - action=lista: Lista de páginas públicas del usuario
router.get("/pagina/:username", paginaController_1.paginaUnificadaPorUsername);
// Mantener compatibilidad con ruta antigua
router.get("/:username", paginaController_1.paginaUnificadaPorUsername);
// Endpoint para obtener una publicación específica por ID
router.get("/:username/publicar/:publicacionId", async (req, res) => {
    const { username, publicacionId } = req.params;
    try {
        // Obtener user_id del username
        const [userRows] = await db_1.pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const userId = userRows[0].id;
        // Obtener la publicación específica
        const [rows] = await db_1.pool.query("SELECT id, titulo, contenido, created_at FROM publicaciones WHERE id = ? AND user_id = ?", [publicacionId, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Publicación no encontrada" });
        }
        // Logs detallados para debugging del contenido HTML
        console.log('🔍 [BACKEND DEBUG] Publicación encontrada:', {
            id: rows[0].id,
            titulo: rows[0].titulo,
            contenidoLength: rows[0].contenido?.length,
            contenidoPreview: rows[0].contenido?.substring(0, 300),
            hasHtmlTags: /<\/?[a-z][\s\S]*>/i.test(rows[0].contenido || ''),
            hasEntities: /&[a-z]+;/.test(rows[0].contenido || '')
        });
        res.json({ publicacion: rows[0] });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener publicación" });
    }
});
// Endpoint para publicar contenido en una página específica
router.post("/:username/publicar/:numeroDePagina", auth_1.authMiddleware, rateLimit_1.userRateLimit, async (req, res) => {
    const { username } = req.params;
    const { titulo, contenido } = req.body;
    const userId = req.user.id;
    try {
        // Verificar que el usuario autenticado es el propietario
        const { getService } = require('../utils/servicesConfig');
        const userService = getService('UserService');
        const user = await userService.getUserById(userId);
        if (!user || user.username !== username) {
            return res.status(403).json({ error: "No autorizado" });
        }
        // Crear la publicación en la tabla publicaciones
        const [result] = await db_1.pool.query("INSERT INTO publicaciones (user_id, titulo, contenido) VALUES (?, ?, ?)", [userId, titulo, contenido]);
        const publicacionId = result.insertId;
        // No crear entrada en el feed para publicaciones
        res.json({ message: "Publicación creada", id: publicacionId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear publicación" });
    }
});
// Endpoint para obtener página por user_id (UUID sin guiones)
router.get("/pagina/id/:user_id", paginaController_1.obtenerPaginaPorUserId);
// Endpoint para actualizar el nombre de usuario de la página
router.post("/:id/usuario", auth_1.authMiddleware, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateUpdateUsername), paginaController_1.actualizarUsuarioPagina);
// Rutas eliminadas: actualizarPropietario, actualizarDescripcion, consultarPropietario, actualizarVisibilidad, consultarVisibilidad (campos eliminados)
// Comentarios
router.post("/:id/comentarios", auth_1.authMiddleware, rateLimit_1.userRateLimit, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateCreateComment), paginaController_1.guardarComentario);
router.delete("/:id/comentarios/:commentId", auth_1.authMiddleware, rateLimit_1.userRateLimit, paginaController_1.eliminarComentario);
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
// Endpoint para subir imágenes para comentarios
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
// Endpoint para guardar página creada con PageBuilder
router.post("/guardar-pagina", auth_1.authMiddleware, rateLimit_1.userRateLimit, async (req, res) => {
    const { titulo, contenido, username } = req.body;
    const userId = req.user.id;
    try {
        // Verificar que el usuario autenticado es el propietario
        const { getService } = require('../utils/servicesConfig');
        const userService = getService('UserService');
        const user = await userService.getUserById(userId);
        if (!user || user.username !== username) {
            return res.status(403).json({ error: "No autorizado" });
        }
        // Crear la página con el contenido HTML generado por PageBuilder
        const [result] = await db_1.pool.query("INSERT INTO paginas (user_id, usuario, creado_en) VALUES (?, ?, NOW())", [userId, username]);
        const pageId = result.insertId;
        // Logs detallados para debugging del contenido HTML almacenado
        console.log('💾 [BACKEND DEBUG] Página creada con PageBuilder:', {
            id: pageId,
            titulo: titulo,
            contenidoLength: contenido?.length,
            contenidoPreview: contenido?.substring(0, 300),
            hasHtmlTags: /<\/?[a-z][\s\S]*>/i.test(contenido || ''),
            hasEntities: /&[a-z]+;/.test(contenido || ''),
            username: username
        });
        // Crear entrada en el feed
        const mensaje = `Nueva página creada: <a href="/pagina/${username}">${titulo || "Página creada con PageBuilder"}</a>`;
        await db_1.pool.query("INSERT INTO feed (user_id, mensaje) VALUES (?, ?)", [userId, mensaje]);
        res.json({ message: "Página creada", id: pageId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear página" });
    }
});
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map