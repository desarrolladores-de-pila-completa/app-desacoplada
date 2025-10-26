"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../middlewares/db");
const express_1 = require("express");
const paginaController_1 = require("../controllers/paginaController");
const auth_1 = require("../middlewares/auth");
const ValidationService_1 = require("../services/ValidationService");
const multer = require("multer");
const router = (0, express_1.Router)();
// Endpoint para crear nueva página (simplificado)
router.post("/pagina", auth_1.authMiddleware, async (req, res) => {
    const { usuario } = req.body;
    const userId = req.userId;
    try {
        // Crear la página
        const [result] = await db_1.pool.query("INSERT INTO paginas (user_id, usuario) VALUES (?, ?)", [userId, usuario]);
        const pageId = result.insertId;
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
router.get("/pagina/:id/comentarios", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db_1.pool.query(`SELECT c.*, u.username FROM comentarios c LEFT JOIN users u ON c.user_id = u.id WHERE c.pagina_id = ? ORDER BY c.creado_en DESC`, [id]);
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener comentarios" });
    }
});
router.get("/", paginaController_1.paginasPublicas);
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
// Endpoint para obtener página por user_id (UUID sin guiones)
router.get("/pagina/id/:user_id", paginaController_1.obtenerPaginaPorUserId);
// Endpoint para actualizar el nombre de usuario de la página
router.post("/:id/usuario", auth_1.authMiddleware, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateUpdateUsername), paginaController_1.actualizarUsuarioPagina);
// Endpoint para actualizar nombre por username
router.put("/pagina/:username/nombre", auth_1.authMiddleware, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateUpdateUsername), paginaController_1.actualizarNombrePorUsername);
// Endpoint para actualizar foto por username
router.put("/pagina/:username/foto", auth_1.authMiddleware, upload.single("photo"), paginaController_1.actualizarFotoPorUsername);
// Rutas eliminadas: actualizarPropietario, actualizarDescripcion, consultarPropietario, actualizarVisibilidad, consultarVisibilidad (campos eliminados)
// Comentarios
router.post("/pagina/:id/comentarios", auth_1.authMiddleware, (0, ValidationService_1.validateRequest)(ValidationService_1.ValidationService.validateCreateComment), paginaController_1.guardarComentario);
router.delete("/pagina/:id/comentarios/:commentId", auth_1.authMiddleware, paginaController_1.eliminarComentario);
// Endpoint para subir imágenes a una página (BLOB)
router.post("/pagina/:id/imagenes", auth_1.authMiddleware, upload.single("imagen"), async (req, res) => {
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
        if (String(rows[0].user_id) !== String(req.userId))
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
// Endpoint para eliminar una imagen específica de una página
router.delete("/pagina/:id/imagenes/:idx", auth_1.authMiddleware, async (req, res) => {
    const paginaId = req.params.id;
    const idx = Number(req.params.idx);
    if (isNaN(idx))
        return res.status(400).json({ error: "Índice de imagen inválido" });
    console.log('=== DELETE IMAGE REQUEST DEBUG ===', {
        paginaId,
        idx,
        userId: req.userId,
        method: req.method,
        url: req.originalUrl,
        context: 'delete-image-debug',
        timestamp: new Date().toISOString()
    });
    try {
        // Verificar que el usuario autenticado es el dueño de la página
        const [rows] = await db_1.pool.query("SELECT user_id FROM paginas WHERE id = ?", [paginaId]);
        if (!rows || rows.length === 0) {
            console.log('=== DELETE IMAGE ERROR ===', { paginaId, error: 'Página no encontrada', context: 'delete-image-debug' });
            return res.status(404).json({ error: "Página no encontrada" });
        }
        if (String(rows[0].user_id) !== String(req.userId)) {
            console.log('=== DELETE IMAGE ERROR ===', { paginaId, userId: req.userId, ownerId: rows[0].user_id, error: 'No autorizado', context: 'delete-image-debug' });
            return res.status(403).json({ error: "Solo el dueño puede eliminar imágenes" });
        }
        // Eliminar la imagen de la base de datos
        const [deleteResult] = await db_1.pool.query("DELETE FROM imagenes WHERE pagina_id = ? AND idx = ?", [paginaId, idx]);
        console.log('=== DELETE IMAGE DB RESULT ===', {
            paginaId,
            idx,
            affectedRows: deleteResult.affectedRows,
            context: 'delete-image-debug'
        });
        if (deleteResult.affectedRows === 0) {
            console.log('=== DELETE IMAGE ERROR ===', { paginaId, idx, error: 'Imagen no encontrada', context: 'delete-image-debug' });
            return res.status(404).json({ error: "Imagen no encontrada" });
        }
        res.json({ message: "Imagen eliminada" });
    }
    catch (err) {
        console.error("=== DELETE IMAGE ERROR ===:", {
            paginaId,
            idx,
            error: err.message,
            stack: err.stack,
            context: 'delete-image-debug'
        });
        res.status(500).json({ error: "Error al eliminar imagen" });
    }
});
// Endpoint para obtener todas las imágenes de una página
router.get("/pagina/:id/imagenes", async (req, res) => {
    const paginaId = req.params.id;
    console.log('=== IMAGES REQUEST DEBUG ===', {
        paginaId,
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        context: 'images-debug',
        timestamp: new Date().toISOString()
    });
    // Log específico para debugging del error 426 en imágenes
    console.log('🚨 IMAGES DEBUG 426 CANDIDATE 🚨', {
        paginaId,
        url: req.originalUrl,
        method: req.method,
        protocol: req.protocol,
        httpVersion: req.httpVersion,
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        accept: req.get('Accept'),
        acceptEncoding: req.get('Accept-Encoding'),
        context: 'images-426-debug',
        timestamp: new Date().toISOString()
    });
    try {
        const [rows] = await db_1.pool.query("SELECT idx, imagen FROM imagenes WHERE pagina_id = ? ORDER BY idx ASC", [paginaId]);
        console.log('=== IMAGES DB RESULT ===', {
            paginaId,
            imagesFound: rows.length,
            context: 'images-debug'
        });
        // Convertir BLOB a base64 para frontend
        const images = rows.map((row) => ({
            idx: row.idx,
            src: `data:image/jpeg;base64,${Buffer.from(row.imagen).toString('base64')}`
        }));
        console.log('=== IMAGES RESPONSE ===', {
            paginaId,
            imagesCount: images.length,
            statusCode: 200,
            context: 'images-debug'
        });
        res.json(images);
    }
    catch (err) {
        console.error("=== IMAGES ERROR ===:", {
            paginaId,
            error: err.message,
            stack: err.stack,
            context: 'images-debug'
        });
        res.status(500).json({ error: "Error al obtener imágenes" });
    }
});
// Endpoint para subir imágenes para comentarios
router.post("/upload-comment-image", auth_1.authMiddleware, upload.single("upload"), async (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "No file uploaded" });
    try {
        const [result] = await db_1.pool.query("INSERT INTO imagenes_comentarios (user_id, comentario_id, imagen, filename, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)", [req.userId, null, file.buffer, file.originalname, file.mimetype, file.size]);
        const imageId = result.insertId;
        res.json({ url: `/api/comment-images/${imageId}` });
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
// Endpoint para eliminar usuario y todo su rastro eliminado
// Endpoint para guardar página creada con PageBuilder
router.post("/guardar-pagina", auth_1.authMiddleware, async (req, res) => {
    const { titulo, contenido, username } = req.body;
    const userId = req.userId;
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
        res.json({ message: "Página creada", id: pageId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear página" });
    }
});
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map