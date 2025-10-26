"use strict";
// Interfaces principales para el sistema
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// Error handling types
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=interfaces.js.map