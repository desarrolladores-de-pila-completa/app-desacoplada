import { Router } from "express";
import rateLimit from "express-rate-limit";
import { paginasPublicas } from "../controllers/paginaController";

const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 peticiones por IP por minuto
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

// Solo la ruta pública usada por el frontend
router.get("/", limiter, paginasPublicas);

export default router;
