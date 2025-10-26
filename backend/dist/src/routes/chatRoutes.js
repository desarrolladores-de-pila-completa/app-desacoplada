"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// ❌ ELIMINADAS: Todas las rutas de chat HTTP
// El chat se maneja exclusivamente por WebSocket en puerto 3003
// Estas rutas HTTP eran redundantes y solo devolvían respuestas vacías
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map