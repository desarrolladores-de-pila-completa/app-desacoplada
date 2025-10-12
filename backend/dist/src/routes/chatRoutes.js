"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diContainer_1 = require("../utils/diContainer");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const chatService = diContainer_1.container.resolve('ChatService');
// Obtener mensajes del chat global
router.get("/global", auth_1.authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const messages = await chatService.getGlobalChat(limit, offset);
        res.json(messages);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener mensajes del chat" });
    }
});
// Crear un nuevo mensaje en el chat global
router.post("/global", auth_1.authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        console.log('Enviando mensaje:', { userId, message });
        if (!message) {
            return res.status(400).json({ error: "El mensaje es requerido" });
        }
        const messageId = await chatService.createMessage(userId, message);
        console.log('Mensaje enviado, ID:', messageId);
        res.status(201).json({ id: messageId, message: "Mensaje enviado" });
    }
    catch (err) {
        console.error('Error en POST /chat/global:', err);
        if (err.message.includes('vacío') || err.message.includes('largo')) {
            res.status(400).json({ error: err.message });
        }
        else {
            res.status(500).json({ error: "Error al enviar mensaje" });
        }
    }
});
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map