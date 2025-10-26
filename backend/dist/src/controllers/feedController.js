"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearEntradaFeed = crearEntradaFeed;
exports.obtenerFeed = obtenerFeed;
// Modelo y funciones para el feed de usuarios
// Se asume que existe una tabla 'feed' en la base de datos
const db_1 = require("../middlewares/db");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * @swagger
 * /api/feed/crear:
 *   post:
 *     summary: Crear entrada en el feed
 *     tags: [Feed]
 */
async function crearEntradaFeed(userId, username) {
    try {
        // Validación básica de parámetros
        if (!userId || !username) {
            logger_1.default.warn('Datos inválidos en crearEntradaFeed', { userId, username });
            throw new Error('Datos inválidos');
        }
        const fotoUrl = `/api/auth/user/${userId}/foto`;
        const mensaje = `Nuevo usuario registrado: <img src='${fotoUrl}' alt='foto' style='width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;' /><a href='/pagina/${username}'>${username}</a>`;
        await db_1.pool.query('INSERT INTO feed (user_id, mensaje) VALUES (?, ?)', [userId, mensaje]);
    }
    catch (error) {
        logger_1.default.error('Error en crearEntradaFeed', { error });
        throw error;
    }
}
/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Obtener feed completo
 *     tags: [Feed]
 */
async function obtenerFeed() {
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM feed ORDER BY creado_en DESC');
        return rows;
    }
    catch (error) {
        logger_1.default.error('Error en obtenerFeed', { error });
        throw error;
    }
}
//# sourceMappingURL=feedController.js.map