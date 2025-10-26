"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearPublicacion = crearPublicacion;
exports.obtenerPublicacion = obtenerPublicacion;
exports.obtenerPublicacionesPorUsuario = obtenerPublicacionesPorUsuario;
exports.obtenerTodasLasPublicaciones = obtenerTodasLasPublicaciones;
const servicesConfig_1 = require("../utils/servicesConfig");
const publicacionService = (0, servicesConfig_1.getService)('PublicacionService');
async function crearPublicacion(req, res) {
    const { titulo, contenido } = req.body;
    const userId = req.userId;
    try {
        const publicacionId = await publicacionService.createPublicacion(userId, { titulo, contenido });
        res.json({ message: "Publicación creada", id: publicacionId });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear publicación" });
    }
}
async function obtenerPublicacion(req, res) {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ error: "ID requerido" });
    console.log('=== DEBUG: obtenerPublicacion called ===', {
        id,
        timestamp: new Date().toISOString(),
        context: 'publicacion-get-id-debug'
    });
    try {
        const publicacion = await publicacionService.getPublicacionById(parseInt(id));
        if (!publicacion) {
            console.log('=== DEBUG: Publicacion not found ===', { id, context: 'publicacion-get-id-debug' });
            return res.status(404).json({ error: "Publicación no encontrada" });
        }
        console.log('=== DEBUG: obtenerPublicacion result ===', {
            id,
            found: true,
            context: 'publicacion-get-id-debug'
        });
        res.json(publicacion);
    }
    catch (err) {
        console.error('=== DEBUG: Error in obtenerPublicacion ===', {
            error: err,
            id,
            context: 'publicacion-get-id-debug'
        });
        res.status(500).json({ error: "Error al obtener publicación" });
    }
}
async function obtenerPublicacionesPorUsuario(req, res) {
    const { username } = req.params;
    console.log('=== DEBUG: obtenerPublicacionesPorUsuario called ===', {
        username,
        timestamp: new Date().toISOString(),
        context: 'publicacion-get-user-debug'
    });
    try {
        // Obtener user_id del username
        const { pool } = require('../middlewares/db');
        const [users] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0) {
            console.log('=== DEBUG: User not found ===', { username, context: 'publicacion-get-user-debug' });
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const publicaciones = await publicacionService.getPublicacionesByUser(users[0].id);
        console.log('=== DEBUG: obtenerPublicacionesPorUsuario result ===', {
            username,
            userId: users[0].id,
            count: publicaciones.length,
            context: 'publicacion-get-user-debug'
        });
        res.json(publicaciones);
    }
    catch (err) {
        console.error('=== DEBUG: Error in obtenerPublicacionesPorUsuario ===', {
            error: err,
            username,
            context: 'publicacion-get-user-debug'
        });
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
}
async function obtenerTodasLasPublicaciones(req, res) {
    console.log('=== DEBUG: obtenerTodasLasPublicaciones called ===', {
        timestamp: new Date().toISOString(),
        context: 'publicacion-get-all-debug'
    });
    try {
        const publicaciones = await publicacionService.getAllPublicaciones();
        console.log('=== DEBUG: obtenerTodasLasPublicaciones result ===', {
            count: publicaciones.length,
            context: 'publicacion-get-all-debug'
        });
        res.json(publicaciones);
    }
    catch (err) {
        console.error('=== DEBUG: Error in obtenerTodasLasPublicaciones ===', {
            error: err,
            context: 'publicacion-get-all-debug'
        });
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
}
//# sourceMappingURL=publicacionController.js.map