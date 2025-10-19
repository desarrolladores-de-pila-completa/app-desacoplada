"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const interfaces_1 = require("../types/interfaces");
const security_1 = require("./security");
function errorHandler(err, req, res, next) {
    let statusCode = 500;
    let message = "Error interno del servidor";
    let isOperational = false;
    if (err instanceof interfaces_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }
    // Log detallado para debugging del error 426
    console.log('=== ERROR HANDLER DEBUG ===', {
        statusCode,
        message,
        isOperational,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        errorType: err.constructor.name,
        errorMessage: err.message,
        context: 'error-handler'
    });
    // Si detectamos error 426, log detallado
    if (statusCode === 426) {
        console.error('🚨 ERROR 426 EN ERROR HANDLER 🚨', {
            url: req.originalUrl,
            method: req.method,
            headers: req.headers,
            body: req.body,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            error: err.message,
            stack: err.stack,
            context: 'error-426-handler'
        });
    }
    // Log error for debugging
    if (!isOperational) {
        console.error('Unhandled error:', (0, security_1.sanitizeForLogging)(err));
    }
    const errorResponse = {
        status: 'error',
        message,
    };
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    res.status(statusCode).json(errorResponse);
}
//# sourceMappingURL=errorHandler.js.map