
import { Request, Response, NextFunction } from "express";
import { AppError, ErrorResponse } from "../types/interfaces";
import { sanitizeForLogging } from "./security";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = "Error interno del servidor";
  let isOperational = false;

  if (err instanceof AppError) {
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
    console.error('Unhandled error:', sanitizeForLogging(err));
  }

  const errorResponse: ErrorResponse = {
    status: 'error',
    message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}
