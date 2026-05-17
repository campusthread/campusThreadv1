import { ZodError } from "zod";

import { AppError } from "../utils/errors.js";

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new AppError("Validation failed", 422, error.flatten()));
    }

    return next(error);
  }
};
