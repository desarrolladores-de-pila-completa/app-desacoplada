import { Router } from "express";
import { PrivateMessageService } from "../services/PrivateMessageService";
import { container } from "../utils/diContainer";
import { authMiddleware } from "../middlewares/auth";
import { pool } from "../middlewares/db";
import { notifyUser } from "../index.js";

const router = Router();
const privateMessageService = container.resolve('PrivateMessageService') as any;

// Obtener mensajes privados con un usuario
router.get("/:userId", async (req, res) => {
  try {
    let otherUserId = req.params.userId;
    let currentUserId: string;

    // Verificar si el usuario está autenticado
    const isAuthenticated = (req as any).user && (req as any).user.id;

    if (isAuthenticated) {
      currentUserId = (req as any).user.id;
    } else {
      // Para usuarios no autenticados, usar un ID de invitado basado en la sesión
      currentUserId = `guest-${req.ip || 'unknown'}`;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Si el userId no es un UUID válido, intentar buscar por username o display_name
    if (otherUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(otherUserId)) {
      // Buscar usuario por username o display_name
      const [userRows]: any = await pool.query("SELECT id FROM users WHERE username = ? OR display_name = ?", [otherUserId, otherUserId]);
      if (userRows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      otherUserId = userRows[0].id;
    }

    const messages = await privateMessageService.getPrivateMessages(currentUserId, otherUserId, limit, offset);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes privados" });
  }
});

// Crear un nuevo mensaje privado
router.post("/:userId", async (req, res) => {
  try {
    let receiverId = req.params.userId;
    let senderId: string;
    let senderDisplayName: string;

    // Verificar si el usuario está autenticado
    const isAuthenticated = (req as any).user && (req as any).user.id;

    if (isAuthenticated) {
      senderId = (req as any).user.id;
      senderDisplayName = (req as any).user.display_name || (req as any).user.username;
    } else {
      // Para usuarios no autenticados, usar un ID de invitado
      senderId = req.body.senderId || `guest-${Date.now()}`;
      senderDisplayName = req.body.senderUsername || 'Invitado';
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es requerido" });
    }

    // Si el userId no es un UUID válido, intentar buscar por username o display_name
    if (receiverId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(receiverId)) {
      // Buscar usuario por username o display_name
      const [userRows]: any = await pool.query("SELECT id FROM users WHERE username = ? OR display_name = ?", [receiverId, receiverId]);
      if (userRows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      receiverId = userRows[0].id;
    }

    const messageId = await privateMessageService.createPrivateMessage(senderId, receiverId, message);

    // Notificar al receptor en tiempo real
    if (receiverId) {
      notifyUser(receiverId, {
        type: 'private_message',
        data: {
          id: messageId,
          sender_id: senderId,
          receiver_id: receiverId,
          message: message,
          created_at: new Date().toISOString(),
          sender_username: senderDisplayName
        }
      });
    }

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