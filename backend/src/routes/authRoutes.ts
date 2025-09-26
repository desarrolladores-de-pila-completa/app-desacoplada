import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/authController";
const router = Router();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // máximo 20 peticiones por IP por minuto
  message: { error: "Demasiadas peticiones, intenta más tarde." }
});

router.use(limiter);
router.post("/register", register);
router.post("/login", login);

export default router;
