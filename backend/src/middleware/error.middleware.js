import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function errorMiddleware(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error instanceof AppError ? error.message : "Error interno del servidor.";
  const details = Array.isArray(error.details) ? error.details : [];

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(env.nodeEnv === "development" && !error.isOperational ? { stack: error.stack } : {}),
  });
}
