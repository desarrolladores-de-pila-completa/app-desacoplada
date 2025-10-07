/**
 * Clases de error personalizadas para la aplicación
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string, 
    statusCode: number = 500, 
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    // Mantener el stack trace (si está disponible)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

// === ERRORES DE VALIDACIÓN ===

export class ValidationError extends AppError {
  constructor(message: string = 'Datos de entrada inválidos', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class InvalidFileError extends ValidationError {
  constructor(message: string = 'Archivo inválido') {
    super(message);
  }
}

// === ERRORES DE AUTENTICACIÓN ===

export class AuthenticationError extends AppError {
  constructor(message: string = 'Credenciales inválidas') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class TokenError extends AuthenticationError {
  constructor(message: string = 'Token inválido o expirado') {
    super(message);
  }
}

// === ERRORES DE RECURSOS ===

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso', id?: string | number) {
    const message = id ? `${resource} con ID ${id} no encontrado` : `${resource} no encontrado`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'El recurso ya existe') {
    super(message, 409, 'CONFLICT');
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor() {
    super('El email ya está registrado');
  }
}

export class DuplicateUsernameError extends ConflictError {
  constructor() {
    super('El username ya está en uso');
  }
}

// === ERRORES DE BASE DE DATOS ===

export class DatabaseError extends AppError {
  constructor(message: string = 'Error de base de datos', originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR', true, originalError?.message);
  }
}

export class ConnectionError extends DatabaseError {
  constructor() {
    super('Error de conexión a la base de datos');
  }
}

// === ERRORES DE RATE LIMITING ===

export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes, intenta más tarde') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// === ERRORES DE ARCHIVO/UPLOAD ===

export class FileSizeError extends ValidationError {
  constructor(maxSize: string) {
    super(`El archivo excede el tamaño máximo permitido de ${maxSize}`);
  }
}

export class UnsupportedFileTypeError extends ValidationError {
  constructor(allowedTypes: string[]) {
    super(
      `Tipo de archivo no soportado. Tipos permitidos: ${allowedTypes.join(', ')}`
    );
  }
}

// === ERRORES DE NEGOCIO ===

export class BusinessLogicError extends AppError {
  constructor(message: string, errorCode: string = 'BUSINESS_LOGIC_ERROR') {
    super(message, 422, errorCode);
  }
}

export class PageNotOwnedError extends AuthorizationError {
  constructor() {
    super('No eres el propietario de esta página');
  }
}

export class CommentNotOwnedError extends AuthorizationError {
  constructor() {
    super('No eres el propietario de este comentario');
  }
}

// === UTILIDADES DE ERROR ===

/**
 * Crear error desde código de estado HTTP
 */
export function createErrorByStatus(statusCode: number, message?: string): AppError {
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
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extraer información útil de errores de MySQL
 */
export function handleDatabaseError(error: any): AppError {
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
export function formatErrorResponse(error: AppError) {
  return {
    success: false,
    error: error.message,
    code: error.errorCode,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
}