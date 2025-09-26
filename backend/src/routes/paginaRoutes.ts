import { Router } from "express";
import rateLimit from "express-rate-limit";
import { crearPagina, verPagina, paginasPorAutor, paginasPublicas } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 peticiones por IP por minuto
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

router.use(limiter);
router.post("/", authMiddleware, crearPagina);
router.get("/:id", verPagina);
router.get("/autor/:username", paginasPorAutor);
router.get("/", paginasPublicas);

export default router;
