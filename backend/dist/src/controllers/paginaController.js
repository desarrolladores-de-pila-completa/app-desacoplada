"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginasPublicas = paginasPublicas;
const db_1 = require("../middlewares/db");
async function paginasPublicas(req, res) {
    try {
        const [rows] = await db_1.pool.execute("SELECT p.id, p.titulo, p.contenido, u.username FROM paginas p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC");
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener páginas" });
    }
}
//# sourceMappingURL=paginaController.js.map