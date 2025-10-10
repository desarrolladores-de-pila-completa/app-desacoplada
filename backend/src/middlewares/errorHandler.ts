
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
