import { Router } from "express";
import { paginasPublicas } from "../controllers/paginaController";

const router = Router();

// Solo la ruta pública usada por el frontend
router.get("/", paginasPublicas);

export default router;
