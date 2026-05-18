import { Router } from "express";

import { getCurrentUser, login, logout, register, refresh, getRegistrationStatus, forgotPassword, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../services/authService.js";

const router = Router();

router.get("/register-status", getRegistrationStatus);
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, getCurrentUser);

export default router;
