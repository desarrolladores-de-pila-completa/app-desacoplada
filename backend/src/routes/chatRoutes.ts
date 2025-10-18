import { Router } from "express";
import { pool } from "../middlewares/db";

const router = Router();

// Obtener mensajes del chat global (vacío para chat solo WebSocket)
router.get("/global", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Devolver array vacío ya que los mensajes se manejan solo por WebSocket
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes del chat" });
  }
});

// Obtener mensajes privados (vacío para chat solo WebSocket)
router.get("/private/:userId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Devolver array vacío ya que los mensajes se manejan solo por WebSocket
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener mensajes privados" });
  }
});

// Enviar mensaje al chat global (no hace nada, solo para compatibilidad)
router.post("/global", async (req, res) => {
  try {
    // No almacenar mensajes, solo devolver éxito
    res.status(201).json({ id: Date.now(), message: "Mensaje enviado" });
  } catch (err) {
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

// Enviar mensaje privado (no hace nada, solo para compatibilidad)
router.post("/private", async (req, res) => {
  try {
    // No almacenar mensajes, solo devolver éxito
    res.status(201).json({ id: Date.now(), message: "Mensaje privado enviado" });
  } catch (err) {
    res.status(500).json({ error: "Error al enviar mensaje privado" });
  }
});

// ❌ ELIMINADA: Ruta duplicada
// Esta funcionalidad estaba duplicada en guestRoutes.ts
// Se mantiene solo la implementación en chatRoutes.ts

export default router;