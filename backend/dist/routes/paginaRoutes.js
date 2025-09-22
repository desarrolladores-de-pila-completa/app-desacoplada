"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paginaController_1 = require("../controllers/paginaController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post("/", auth_1.authMiddleware, paginaController_1.crearPagina);
router.get("/:id", paginaController_1.verPagina);
router.get("/autor/:username", paginaController_1.paginasPorAutor);
router.get("/", paginaController_1.paginasPublicas);
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map