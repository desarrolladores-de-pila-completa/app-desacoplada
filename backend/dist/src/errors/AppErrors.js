"use strict";
/**
 * Clases de error personalizadas para la aplicación
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentNotOwnedError = exports.PageNotOwnedError = exports.BusinessLogicError = exports.UnsupportedFileTypeError = exports.FileSizeError = exports.RateLimitError = exports.ConnectionError = exports.DatabaseError = exports.DuplicateUsernameError = exports.DuplicateEmailError = exports.ConflictError = exports.NotFoundError = exports.TokenError = exports.AuthorizationError = exports.AuthenticationError = exports.InvalidFileError = exports.ValidationError = exports.AppError = void 0;
exports.createErrorByStatus = createErrorByStatus;
exports.isOperationalError = isOperationalError;
exports.handleDatabaseError = handleDatabaseError;
exports.formatErrorResponse = formatErrorResponse;
class AppError extends Error {
    statusCode;
    isOperational;
    errorCode;
    details;
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errorCode = errorCode;
        this.details = details;
        // Mantener el stack trace (si está disponible)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.AppError = AppError;
// === ERRORES DE VALIDACIÓN ===
class ValidationError extends AppError {
    constructor(message = 'Datos de entrada inválidos', details) {
        super(message, 400, 'VALIDATION_ERROR', true, details);
    }
}
exports.ValidationError = ValidationError;
class InvalidFileError extends ValidationError {
    constructor(message = 'Archivo inválido') {
        super(message);
    }
}
exports.InvalidFileError = InvalidFileError;
// === ERRORES DE AUTENTICACIÓN ===
class AuthenticationError extends AppError {
    constructor(message = 'Credenciales inválidas') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'No tienes permisos para realizar esta acción') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class TokenError extends AuthenticationError {
    constructor(message = 'Token inválido o expirado') {
        super(message);
    }
}
exports.TokenError = TokenError;
// === ERRORES DE RECURSOS ===
class NotFoundError extends AppError {
    constructor(resource = 'Recurso', id) {
        const message = id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`;
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'El recurso ya existe') {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class DuplicateEmailError extends ConflictError {
    constructor() {
        super('El email ya está registrado');
    }
}
exports.DuplicateEmailError = DuplicateEmailError;
class DuplicateUsernameError extends ConflictError {
    constructor() {
        super('El username ya está en uso');
    }
}
exports.DuplicateUsernameError = DuplicateUsernameError;
// === ERRORES DE BASE DE DATOS ===
class DatabaseError extends AppError {
    constructor(message = 'Error de base de datos', originalError) {
        super(message, 500, 'DATABASE_ERROR', true, originalError?.message);
    }
}
exports.DatabaseError = DatabaseError;
class ConnectionError extends DatabaseError {
    constructor() {
        super('Error de conexión a la base de datos');
    }
}
exports.ConnectionError = ConnectionError;
// === ERRORES DE RATE LIMITING ===
class RateLimitError extends AppError {
    constructor(message = 'Demasiadas solicitudes, intenta más tarde') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}
exports.RateLimitError = RateLimitError;
// === ERRORES DE ARCHIVO/UPLOAD ===
class FileSizeError extends ValidationError {
    constructor(maxSize) {
        super(`El archivo excede el tamaño máximo permitido de ${maxSize}`);
    }
}
exports.FileSizeError = FileSizeError;
class UnsupportedFileTypeError extends ValidationError {
    constructor(allowedTypes) {
        super(`Tipo de archivo no soportado. Tipos permitidos: ${allowedTypes.join(', ')}`);
    }
}
exports.UnsupportedFileTypeError = UnsupportedFileTypeError;
// === ERRORES DE NEGOCIO ===
class BusinessLogicError extends AppError {
    constructor(message, errorCode = 'BUSINESS_LOGIC_ERROR') {
        super(message, 422, errorCode);
    }
}
exports.BusinessLogicError = BusinessLogicError;
class PageNotOwnedError extends AuthorizationError {
    constructor() {
        super('No eres el propietario de esta página');
    }
}
exports.PageNotOwnedError = PageNotOwnedError;
class CommentNotOwnedError extends AuthorizationError {
    constructor() {
        super('No eres el propietario de este comentario');
    }
}
exports.CommentNotOwnedError = CommentNotOwnedError;
// === UTILIDADES DE ERROR ===
/**
 * Crear error desde código de estado HTTP
 */
function createErrorByStatus(statusCode, message) {
    switch (statusCode) {
        case 400:
            return new ValidationError(message);
        case 401:
            return new AuthenticationError(message);
        case 403:
            return new AuthorizationError(message);
        case 404:
            return new NotFoundError(message || 'Recurso');
        case 409:
            return new ConflictError(message);
        case 429:
            return new RateLimitError(message);
        default:
            return new AppError(message || 'Error interno del servidor', statusCode);
    }
}
/**
 * Verificar si un error es operacional (esperado)
 */
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
/**
 * Extraer información útil de errores de MySQL
 */
function handleDatabaseError(error) {
    // Error de duplicado (email/username)
    if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
            return new DuplicateEmailError();
        }
        if (error.message.includes('username')) {
            return new DuplicateUsernameError();
        }
        return new ConflictError('El recurso ya existe');
    }
    // Error de foreign key
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return new NotFoundError('Recurso relacionado');
    }
    // Error de conexión
    if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        return new ConnectionError();
    }
    // Error genérico de base de datos
    return new DatabaseError('Error de base de datos', error);
}
/**
 * Formatear respuesta de error para cliente
 */
function formatErrorResponse(error) {
    return {
        success: false,
        error: error.message,
        code: error.errorCode,
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
}
//# sourceMappingURL=AppErrors.js.map