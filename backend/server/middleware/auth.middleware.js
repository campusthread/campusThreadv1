import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = req.cookies?.accessToken || null;
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};
