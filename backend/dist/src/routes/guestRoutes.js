"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../middlewares/db");
const router = (0, express_1.Router)();
// Registrar usuario invitado
router.post("/register", async (req, res) => {
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
//# sourceMappingURL=guestRoutes.js.map