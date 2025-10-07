/**
 * Clases de error personalizadas para la aplicación
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly errorCode: string;
    readonly details?: any;
    constructor(message: string, statusCode?: number, errorCode?: string, isOperational?: boolean, details?: any);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class InvalidFileError extends ValidationError {
    constructor(message?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class TokenError extends AuthenticationError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string, id?: string | number);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class DuplicateEmailError extends ConflictError {
    constructor();
}
export declare class DuplicateUsernameError extends ConflictError {
    constructor();
}
export declare class DatabaseError extends AppError {
    constructor(message?: string, originalError?: Error);
}
export declare class ConnectionError extends DatabaseError {
    constructor();
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class FileSizeError extends ValidationError {
    constructor(maxSize: string);
}
export declare class UnsupportedFileTypeError extends ValidationError {
    constructor(allowedTypes: string[]);
}
export declare class BusinessLogicError extends AppError {
    constructor(message: string, errorCode?: string);
}
export declare class PageNotOwnedError extends AuthorizationError {
    constructor();
}
export declare class CommentNotOwnedError extends AuthorizationError {
    constructor();
}
/**
 * Crear error desde código de estado HTTP
 */
export declare function createErrorByStatus(statusCode: number, message?: string): AppError;
/**
 * Verificar si un error es operacional (esperado)
 */
export declare function isOperationalError(error: Error): boolean;
/**
 * Extraer información útil de errores de MySQL
 */
export declare function handleDatabaseError(error: any): AppError;
/**
 * Formatear respuesta de error para cliente
 */
export declare function formatErrorResponse(error: AppError): any;
//# sourceMappingURL=AppErrors.d.ts.map