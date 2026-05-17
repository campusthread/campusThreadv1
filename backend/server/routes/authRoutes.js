import { Router } from "express";

import { getCurrentUser, login, logout, register, refresh } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../services/authService.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, getCurrentUser);

export default router;
