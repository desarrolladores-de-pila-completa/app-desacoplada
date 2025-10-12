import { Router } from "express";
import { PrivateMessageService } from "../services/PrivateMessageService";
import { container } from "../utils/diContainer";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const privateMessageService = container.resolve('PrivateMessageService') as any;

// Obtener mensajes privados con un usuario
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await privateMessageService.getPrivateMessages(currentUserId, otherUserId, limit, offset);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes privados" });
  }
});

// Crear un nuevo mensaje privado
router.post("/:userId", authMiddleware, async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = (req as any).user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    const messageId = await privateMessageService.createPrivateMessage(senderId, receiverId, message);
    res.status(201).json({ id: messageId, message: "Mensaje privado enviado" });
  } catch (err: any) {
    console.error('Error en POST /private:', err);
    if (err.message.includes('vacío')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Error al enviar mensaje privado" });
    }
  }
});

export default router;