"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Obtener mensajes privados (vacío para chat solo WebSocket)
router.get("/:userId", async (req, res) => {
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
// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/", async (req, res) => {
    try {
        // No almacenar mensajes, solo devolver éxito
        res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al enviar mensaje privado" });
    }
});
// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/", async (req, res) => {
    try {
        // No almacenar mensajes, solo devolver éxito
        res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al enviar mensaje privado" });
    }
});
exports.default = router;
//# sourceMappingURL=privateRoutes.js.map