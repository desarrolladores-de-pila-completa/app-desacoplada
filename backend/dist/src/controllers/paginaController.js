"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearPagina = crearPagina;
exports.verPagina = verPagina;
exports.paginasPorAutor = paginasPorAutor;
exports.paginasPublicas = paginasPublicas;
const db_1 = require("../middlewares/db");
async function crearPagina(req, res) {
    const userId = req.userId;
    const { titulo, contenido, elementos } = req.body;
    if (!titulo || !contenido) {
        return res.status(400).json({ message: "Faltan datos" });
    }
    try {
        await db_1.pool.execute("INSERT INTO paginas (user_id, titulo, contenido, elementos) VALUES (?, ?, ?, ?)", [userId, titulo, contenido, JSON.stringify(elementos ?? [])]);
        res.json({ message: "Página creada" });
    }
    catch (err) {
        console.error("Error al crear página:", err);
        res.status(500).json({ message: "Error al crear página" });
    }
}
async function verPagina(req, res) {
    const { id } = req.params;
    try {
        const [rows] = await db_1.pool.execute("SELECT p.id, p.titulo, p.contenido, p.elementos, u.username FROM paginas p JOIN users u ON p.user_id = u.id WHERE p.id = ?", [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Página no encontrada" });
        }
        const pagina = rows[0];
        if (pagina.elementos && typeof pagina.elementos === "string") {
            try {
                pagina.elementos = JSON.parse(pagina.elementos);
            }
            catch { }
        }
        res.json(pagina);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener página" });
    }
}
async function paginasPorAutor(req, res) {
    const { username } = req.params;
    try {
        const [rows] = await db_1.pool.execute("SELECT p.id, p.titulo, p.contenido, u.username FROM paginas p JOIN users u ON p.user_id = u.id WHERE u.username = ? ORDER BY p.id DESC", [username]);
        res.json(rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al buscar páginas por autor" });
    }
}
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