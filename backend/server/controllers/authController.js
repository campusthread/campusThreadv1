import { authService, getAuthCookieOptions } from "../services/authService.js";
import { sendSuccess } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
import * as emailService from "../services/emailService.js";
import { logger } from "../utils/logger.js";

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie("accessToken", result.token, getAuthCookieOptions());
  sendSuccess(res, { statusCode: 201, message: "Registration successful", data: result });

  (async () => {
    try {
      await emailService.sendWelcomeEmail(result.user);
      logger.info('Sent welcome email', { to: result.user.email });
    } catch (err) {
      logger.error('Failed to send welcome email', { to: result.user.email, message: err?.message });
    }
  })();
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie("accessToken", result.token, getAuthCookieOptions());
  sendSuccess(res, { message: "Login successful", data: result });
};

export const getCurrentUser = async (req, res) => {
  sendSuccess(res, { data: { user: authService.sanitizeUser(req.user) } });
};

export const logout = async (req, res) => {
  res.clearCookie("accessToken", getAuthCookieOptions());
  sendSuccess(res, { message: "Logout successful" });
};

export const refresh = async (req, res) => {
  const cookieToken = req.cookies?.accessToken || null;
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = bearerToken || cookieToken;

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  const result = await authService.refresh(token);
  res.cookie("accessToken", result.token, getAuthCookieOptions());
  sendSuccess(res, { message: "Token refreshed", data: result });
};
