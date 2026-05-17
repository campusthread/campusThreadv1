import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (statusCode >= 500) {
    logger.error(message, error);
  } else {
    logger.warn(message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
  });
};
