import { Router } from "express";
import { ChatService } from "../services";
import { container } from "../utils/diContainer";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const chatService = container.resolve('ChatService') as any;

// Obtener mensajes del chat global
router.get("/global", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await chatService.getGlobalChat(limit, offset);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes del chat" });
  }
});

// Crear un nuevo mensaje en el chat global
router.post("/global", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = (req as any).user.id;
    console.log('Enviando mensaje:', { userId, message });

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    const messageId = await chatService.createMessage(userId, message);
    console.log('Mensaje enviado, ID:', messageId);
    res.status(201).json({ id: messageId, message: "Mensaje enviado" });
  } catch (err: any) {
    console.error('Error en POST /chat/global:', err);
    if (err.message.includes('vacío') || err.message.includes('largo')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Error al enviar mensaje" });
    }
  }
});

export default router;