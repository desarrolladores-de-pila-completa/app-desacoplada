import { Router } from "express";
import { obtenerFeed } from "../controllers/feedController";
const router = Router();

router.get("/", async (req, res) => {
  try {
    const feed = await obtenerFeed();
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el feed" });
  }
});

export default router;
