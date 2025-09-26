"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 20, // máximo 20 peticiones por IP por minuto
    message: { error: "Demasiadas peticiones, intenta más tarde." }
});
router.use(limiter);
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map