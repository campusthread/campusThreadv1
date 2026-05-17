import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", getCategories);
router.post("/", requireAuth, requireRole("admin"), createCategory);
router.delete("/:id", requireAuth, requireRole("admin"), deleteCategory);

export default router;
