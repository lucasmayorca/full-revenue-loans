import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : "Internal server error";

  logger.error("unhandled_error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    status: statusCode,
  });

  res.status(statusCode).json({ error: message });
}
