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
    const userId = req.user.id;
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
    try {
        const publicacion = await publicacionService.getPublicacionById(parseInt(id));
        if (!publicacion) {
            return res.status(404).json({ error: "Publicación no encontrada" });
        }
        res.json(publicacion);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener publicación" });
    }
}
async function obtenerPublicacionesPorUsuario(req, res) {
    const { username } = req.params;
    try {
        // Obtener user_id del username
        const { pool } = require('../middlewares/db');
        const [users] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
        if (!users || users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        const publicaciones = await publicacionService.getPublicacionesByUser(users[0].id);
        res.json(publicaciones);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
}
async function obtenerTodasLasPublicaciones(req, res) {
    try {
        const publicaciones = await publicacionService.getAllPublicaciones();
        res.json(publicaciones);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener publicaciones" });
    }
}
//# sourceMappingURL=publicacionController.js.map