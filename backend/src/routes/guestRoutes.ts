import { Router } from "express";
import { pool } from "../middlewares/db";

const router = Router();

// Registrar usuario invitado
router.post("/register", async (req, res) => {
  try {
    const { guestUsername } = req.body;

    if (!guestUsername || guestUsername.trim().length === 0) {
      return res.status(400).json({ error: "El nombre de usuario es requerido" });
    }

    const trimmedUsername = guestUsername.trim();

    // Verificar si el nombre ya existe
    const [existing] = await pool.query(
      "SELECT id FROM usuariosinvitados WHERE guest_username = ?",
      [trimmedUsername]
    );

    if ((existing as any[]).length > 0) {
      return res.status(409).json({ error: "El nombre de usuario ya está en uso" });
    }

    // Insertar el nuevo usuario invitado
    const [result] = await pool.query(
      "INSERT INTO usuariosinvitados (guest_username) VALUES (?)",
      [trimmedUsername]
    );

    const guestId = (result as any).insertId;

    res.status(201).json({
      id: guestId,
      username: trimmedUsername,
      message: "Usuario invitado registrado exitosamente"
    });
  } catch (err: any) {
    console.error('Error registrando usuario invitado:', err);
    res.status(500).json({ error: "Error al registrar usuario invitado" });
  }
});

export default router;