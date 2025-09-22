import { Router } from "express";
import { crearPagina, verPagina, paginasPorAutor, paginasPublicas } from "../controllers/paginaController";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

router.post("/", authMiddleware, crearPagina);
router.get("/:id", verPagina);
router.get("/autor/:username", paginasPorAutor);
router.get("/", paginasPublicas);

export default router;
