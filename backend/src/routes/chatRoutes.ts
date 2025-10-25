import { Router } from "express";

const router = Router();

// ❌ ELIMINADAS: Todas las rutas de chat HTTP
// El chat se maneja exclusivamente por WebSocket en puerto 3003
// Estas rutas HTTP eran redundantes y solo devolvían respuestas vacías

export default router;