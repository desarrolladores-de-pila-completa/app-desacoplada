"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paginaController_1 = require("../controllers/paginaController");
const router = (0, express_1.Router)();
// Solo la ruta pública usada por el frontend
router.get("/", paginaController_1.paginasPublicas);
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map