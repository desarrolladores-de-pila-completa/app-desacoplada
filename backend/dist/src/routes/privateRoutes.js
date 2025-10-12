"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diContainer_1 = require("../utils/diContainer");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const privateMessageService = diContainer_1.container.resolve('PrivateMessageService');
// Obtener mensajes privados con un usuario
router.get("/:userId", auth_1.authMiddleware, async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const messages = await privateMessageService.getPrivateMessages(currentUserId, otherUserId, limit, offset);
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener mensajes privados" });
    }
});
// Crear un nuevo mensaje privado
router.post("/:userId", auth_1.authMiddleware, async (req, res) => {
    try {
        const receiverId = req.params.userId;
        const senderId = req.user.id;
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "El mensaje es requerido" });
        }
        const messageId = await privateMessageService.createPrivateMessage(senderId, receiverId, message);
        res.status(201).json({ id: messageId, message: "Mensaje privado enviado" });
    }
    catch (err) {
        console.error('Error en POST /private:', err);
        if (err.message.includes('vacío')) {
            res.status(400).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: "Error al enviar mensaje privado" });
        }
    }
});
exports.default = router;
//# sourceMappingURL=privateRoutes.js.map