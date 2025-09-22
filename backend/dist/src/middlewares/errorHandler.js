"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
}
//# sourceMappingURL=errorHandler.js.map