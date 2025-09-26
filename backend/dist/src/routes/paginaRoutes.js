"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const paginaController_1 = require("../controllers/paginaController");
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // máximo 30 peticiones por IP por minuto
    message: { error: "Demasiadas peticiones, intenta más tarde." }
});
// Solo la ruta pública usada por el frontend
router.get("/", limiter, paginaController_1.paginasPublicas);
exports.default = router;
//# sourceMappingURL=paginaRoutes.js.map