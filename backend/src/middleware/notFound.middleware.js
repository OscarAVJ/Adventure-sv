import { AppError } from "../utils/AppError.js";

export function notFoundMiddleware(req, _res, next) {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
}
