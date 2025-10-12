import { Router } from "express";

const router = Router();

// Obtener mensajes privados (vacío para chat solo WebSocket)
router.get("/:userId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Devolver array vacío ya que los mensajes se manejan solo por WebSocket
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes privados" });
  }
});

// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/", async (req, res) => {
  try {
    // No almacenar mensajes, solo devolver éxito
    res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
  } catch (err) {
    res.status(500).json({ error: "Error al enviar mensaje privado" });
  }
});

// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/", async (req, res) => {
  try {
    // No almacenar mensajes, solo devolver éxito
    res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
  } catch (err) {
    res.status(500).json({ error: "Error al enviar mensaje privado" });
  }
});

export default router;