"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../middlewares/db");
const router = (0, express_1.Router)();
// Obtener mensajes del chat global (vacío para chat solo WebSocket)
router.get("/global", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        // Devolver array vacío ya que los mensajes se manejan solo por WebSocket
        res.json([]);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener mensajes del chat" });
    }
});
// Obtener mensajes privados (vacío para chat solo WebSocket)
router.get("/private/:userId", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        // Devolver array vacío ya que los mensajes se manejan solo por WebSocket
        res.json([]);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener mensajes privados" });
    }
});
// Enviar mensaje al chat global (no hace nada, solo para compatibilidad)
router.post("/global", async (req, res) => {
    try {
        // No almacenar mensajes, solo devolver éxito
        res.status(201).json({ id: Date.now(), message: "Mensaje enviado" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
});
// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/private", async (req, res) => {
    try {
        // No almacenar mensajes, solo devolver éxito
        res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al enviar mensaje privado" });
    }
});
// Registrar usuario invitado
router.post("/guest/register", async (req, res) => {
    try {
        const { guestUsername } = req.body;
        if (!guestUsername || guestUsername.trim().length === 0) {
            return res.status(400).json({ error: "El nombre de usuario es requerido" });
        }
        const trimmedUsername = guestUsername.trim();
        // Verificar si el nombre ya existe
        const [existing] = await db_1.pool.query("SELECT id FROM usuariosinvitados WHERE guest_username = ?", [trimmedUsername]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "El nombre de usuario ya está en uso" });
        }
        // Insertar el nuevo usuario invitado
        const [result] = await db_1.pool.query("INSERT INTO usuariosinvitados (guest_username) VALUES (?)", [trimmedUsername]);
        const guestId = result.insertId;
        res.status(201).json({
            id: guestId,
            username: trimmedUsername,
            message: "Usuario invitado registrado exitosamente"
        });
    }
    catch (err) {
        console.error('Error registrando usuario invitado:', err);
        res.status(500).json({ error: "Error al registrar usuario invitado" });
    }
});
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map